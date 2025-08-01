const { PermissionFlagsBits } = require('discord.js');
const { updateState } = require('@root/syuttaikin_bot/utils/syuttaikinStateManager');
const { updateSettingsMessage } = require('@root/syuttaikin_bot/components/settings/_updateSettingsMessage');
const logger = require('@common/logger');

module.exports = {
  customId: 'notify_log_channel_select',
  /**
   * @param {import('discord.js').ChannelSelectMenuInteraction} interaction
   */
  async execute(interaction) {
    const selectedChannelId = interaction.values[0];
    const guildId = interaction.guild.id;

    try {
      await updateState(guildId, (currentState) => {
        currentState.syuttaikin = currentState.syuttaikin || {};
        currentState.syuttaikin.logChannelId = selectedChannelId;
        return currentState;
      });

      logger.info(`[syuttaikin-config] Guild ${guildId} の通知ログチャンネルを ${selectedChannelId} に設定しました。`);
      // 設定パネルを更新してユーザーに通知
      await updateSettingsMessage(interaction);
    } catch (error) {
      logger.error(`[syuttaikin-config] 通知ログチャンネルの設定中にエラーが発生しました (Guild: ${guildId})`, { error });
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '設定の更新中にエラーが発生しました。', ephemeral: true }).catch(() => {});
      }
    }
    return true; // このハンドラで処理済み
  },
};
