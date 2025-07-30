const { updateState } = require('@root/syuttaikin_bot/utils/syuttaikinStateManager');
const { updateSettingsMessage } = require('./_updateSettingsMessage');
const logger = require('@common/logger');

module.exports = {
  customId: 'setting_set_panel_channel',
  /**
   * @param {import('discord.js').ChannelSelectMenuInteraction} interaction
   */
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const selectedChannelId = interaction.values[0];

    try {
      await updateState(guildId, (currentState) => {
        if (!currentState.syuttaikin) currentState.syuttaikin = {};
        currentState.syuttaikin.panelChannelId = selectedChannelId;
        return currentState;
      });

      await updateSettingsMessage(interaction);
      logger.info(`[syuttaikin-settings] Guild ${guildId} のパネル投稿チャンネルを更新しました。`);
    } catch (error) {
      logger.error(`[syuttaikin-settings] パネル投稿チャンネルの更新中にエラーが発生しました (Guild: ${guildId})`, { error });
      if (!interaction.replied && !interaction.deferred) await interaction.reply({ content: '設定の更新中にエラーが発生しました。', ephemeral: true });
    }
  },
};