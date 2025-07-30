// hikkake_bot/utils/hikkakePanelManager.js

const { ChannelType } = require('discord.js');
const { DateTime } = require('luxon');
const { readState, writeState } = require('./hikkakeStateManager');
const { buildPanelEmbed } = require('./panelBuilder');
const logger = require('@common/logger');

const LOG_CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute
const LOG_RETENTION_MINUTES = 10; // 10 minutes

/**
 * Fetches a channel and a message safely, handling cases where they might have been deleted.
 * @param {import('discord.js').Client} client
 * @param {string} channelId
 * @param {string} messageId
 * @returns {Promise<import('discord.js').Message|null>}
 */
async function fetchMessageSafely(client, channelId, messageId) {
  if (!channelId || !messageId) return null;
  try {
    const channel = await client.channels.fetch(channelId);
    if (channel?.isTextBased()) {
      return await channel.messages.fetch(messageId);
    }
  } catch (error) {
    // Common errors: Unknown Channel (10003), Unknown Message (10008). These are expected if deleted.
    if (error.code !== 10003 && error.code !== 10008) {
      logger.error(`[PanelManager] メッセージ取得エラー (Channel: ${channelId}, Message: ${messageId}):`, { error: error.message });
    }
  }
  return null;
}

/**
 * Updates all hikkake panels for a specific guild with the latest state.
 * @param {import('discord.js').Client} client
 * @param {string} guildId
 * @param {object} [state] - Optional: The current state to use. If not provided, it will be read from GCS.
 */
async function updateAllHikkakePanels(client, guildId, state) {
  const currentState = state || await readState(guildId);
  if (!currentState) return;

  for (const type of ['quest', 'tosu', 'horse']) {
    const panelInfo = currentState.panelMessages?.[type];
    if (!panelInfo || !panelInfo.channelId) continue;

    // Update Status Panel
    const statusMessage = await fetchMessageSafely(client, panelInfo.channelId, panelInfo.statusMessageId);
    if (statusMessage) {
      const statusContent = buildPanelEmbed('status', type, currentState);
      await statusMessage.edit(statusContent).catch(err => {
        logger.error(`[PanelManager] ステータスパネルの編集に失敗 (${type}):`, { error: err.message, guildId });
      });
    }

    // Update Orders Panel
    const ordersMessage = await fetchMessageSafely(client, panelInfo.channelId, panelInfo.ordersMessageId);
    if (ordersMessage) {
      const ordersContent = buildPanelEmbed('orders', type, currentState);
      await ordersMessage.edit(ordersContent).catch(err => {
        logger.error(`[PanelManager] 注文パネルの編集に失敗 (${type}):`, { error: err.message, guildId });
      });
    }
  }
}

/**
 * Starts a periodic task to clean up old, resolved logs from the state.
 * @param {import('discord.js').Client} client
 */
function startLogCleanupInterval(client) {
  setInterval(async () => {
    for (const guild of client.guilds.cache.values()) {
      try {
        const state = await readState(guild.id);
        if (!state?.orders) continue;

        let stateWasModified = false;
        const now = DateTime.now();

        for (const type of ['quest', 'tosu', 'horse']) {
          const originalCount = state.orders[type]?.length || 0;
          if (originalCount === 0) continue;

          state.orders[type] = state.orders[type].filter(order => {
            if (!order.leaveTimestamp) return true; // Keep active orders
            const diffMinutes = now.diff(DateTime.fromISO(order.leaveTimestamp), 'minutes').minutes;
            return diffMinutes < LOG_RETENTION_MINUTES;
          });

          if (state.orders[type].length < originalCount) {
            stateWasModified = true;
          }
        }

        if (stateWasModified) {
          await writeState(guild.id, state);
          await updateAllHikkakePanels(client, guild.id, state);
          logger.info(`[PanelManager] 古いログをクリーンアップしました (Guild: ${guild.name})`);
        }
      } catch (error) {
        logger.error(`[PanelManager] ログのクリーンアップ中にエラーが発生しました (Guild: ${guild.id}):`, { error });
      }
    }
  }, LOG_CLEANUP_INTERVAL_MS);
}

module.exports = {
  updateAllHikkakePanels,
  startLogCleanupInterval,
};