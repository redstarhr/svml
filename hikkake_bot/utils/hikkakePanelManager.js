// hikkake_bot/utils/hikkakePanelManager.js

const { DateTime } = require('luxon');
const { readState, writeState } = require('./hikkakeStateManager');
const { buildPanelEmbed, buildPanelButtons, buildOrdersPanelButtons } = require('./panelBuilder');

/**
 * すべてのhikkake_botパネル（店内状況と受注一覧）を更新します。
 * @param {import('discord.js').Client} client
 * @param {string} guildId
 * @param {object} state stateManagerから取得した現在の状態オブジェクト
 */
async function updateAllHikkakePanels(client, guildId, state) {
  for (const type of ['quest', 'tosu', 'horse']) {
    const panelInfo = state.panelMessages?.[type];
    if (!panelInfo || !panelInfo.channelId || !panelInfo.statusMessageId || !panelInfo.ordersMessageId) {
      continue;
    }

    try {
      const channel = await client.channels.fetch(panelInfo.channelId);
      if (!channel || !channel.isTextBased()) continue;

      // 店内状況パネルを更新
      const statusMsg = await channel.messages.fetch(panelInfo.statusMessageId);
      const statusEmbed = buildPanelEmbed('status', type, state, guildId);
      const buttons = buildPanelButtons(type);
      await statusMsg.edit({ embeds: [statusEmbed], components: buttons });

      // 受注一覧パネルを更新
      const ordersMsg = await channel.messages.fetch(panelInfo.ordersMessageId);
      const ordersEmbed = buildPanelEmbed('orders', type, state, guildId);
      const orderButtons = buildOrdersPanelButtons(type);
      await ordersMsg.edit({ embeds: [ordersEmbed], components: orderButtons });

    } catch (error) {
      console.error(`[hikkakePanelManager] パネル更新失敗: type "${type}" in guild ${guildId}`, error);
    }
  }
}

/**
 * 古いログ（受注、退店など）を状態から削除するクリーンアップタスク。
 * @param {import('discord.js').Client} client
 * @param {string} guildId
 */
async function cleanupOldLogs(client, guildId) {
    const state = await readState(guildId);
    let stateModified = false;
    const now = DateTime.now();
    const LOG_LIFETIME_MINUTES = 10;

    for (const type of ['quest', 'tosu', 'horse']) {
        const originalOrders = state.orders[type] || [];
        if (originalOrders.length === 0) continue;

        // 退店時刻が記録されており、かつ10分以上経過したログをフィルタリングして削除
        const activeOrders = originalOrders.filter(order => {
            if (!order.leaveTimestamp) {
                return true; // 退店ボタンが押されていないログは常に保持
            }
            const leaveTime = DateTime.fromISO(order.leaveTimestamp);
            const diff = now.diff(leaveTime, 'minutes').as('minutes');
            return diff < LOG_LIFETIME_MINUTES; // 退店から10分未満のログは保持
        });

        if (activeOrders.length < originalOrders.length) {
            state.orders[type] = activeOrders;
            stateModified = true;
        }
    }

    if (stateModified) {
        console.log(`[LogCleanup] Guild ${guildId} の古いログをクリーンアップしました。`);
        await writeState(guildId, state);
        await updateAllHikkakePanels(client, guildId, state);
    }
}

/**
 * 1分ごとに実行される定期的なログクリーンアップ処理を開始します。
 * @param {import('discord.js').Client} client
 */
function startLogCleanupInterval(client) {
    setInterval(() => {
        client.guilds.cache.forEach(guild => {
            cleanupOldLogs(client, guild.id).catch(error => {
                console.error(`[LogCleanup] Guild ${guild.id} のクリーンアップ中にエラーが発生しました:`, error);
            });
        });
    }, 60 * 1000); // 60秒

    console.log('✅ 定期的なログクリーンアップ処理が開始されました。');
}

module.exports = {
  updateAllHikkakePanels,
  startLogCleanupInterval,
};