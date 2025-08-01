// syuttaiki_bot/components/selects/log_channel_select.js
const { updateState } = require('@root/syuttaikin_bot/utils/syuttaikinStateManager');
const { updateSettingsMessage } = require('@root/syuttaikin_bot/components/settings/_updateSettingsMessage');
const logger = require('@common/logger');

module.exports = {
  customId: 'log_channel_select',
  /**
   * @param {import('discord.js').ChannelSelectMenuInteraction} interaction
   */
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const selectedChannelId = interaction.values[0];

    try {
      await updateState(guildId, (currentState) => {
        currentState.syuttaikin = currentState.syuttaikin || {};
        currentState.syuttaikin.logChannelId = selectedChannelId;
        return currentState;
      });

      logger.info(`[syuttaikin-config] Guild ${guildId} の出退勤ログチャンネルを ${selectedChannelId} に設定しました。`);
      await updateSettingsMessage(interaction); // 共通の更新関数を使用
    } catch (error) {
      logger.error(`[syuttaikin-config] 出退勤ログチャンネルの設定中にエラーが発生しました (Guild: ${guildId})`, { error });
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '設定の更新中にエラーが発生しました。', ephemeral: true }).catch(() => {});
      }
    }
    return true;
  },
};