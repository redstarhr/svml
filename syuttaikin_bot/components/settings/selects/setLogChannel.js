// syuttaikin_bot/components/settings/selects/setLogChannel.js
const { updateState } = require('@root/syuttaikin_bot/utils/syuttaikinStateManager');
const logger = require('@common/logger');

module.exports = {
  customId: 'syuttaikin_select_log_channel',
  /**
   * @param {import('discord.js').ChannelSelectMenuInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferUpdate();
    const guildId = interaction.guild.id;
    const selectedChannelId = interaction.values[0];

    try {
      await updateState(guildId, (state) => {
        state.syuttaikin.logChannelId = selectedChannelId;
        return state;
      });

      await interaction.editReply({
        content: `✅ 出退勤ログの通知先チャンネルを <#${selectedChannelId}> に設定しました。`,
        components: [],
      });
    } catch (error) {
      logger.error('出退勤ログチャンネルの設定保存中にエラー', { error, guildId });
      await interaction.editReply({ content: '❌ 設定の保存中にエラーが発生しました。', components: [] });
    }
    return true;
  },
};