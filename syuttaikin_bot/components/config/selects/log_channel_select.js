// syuttaiki_bot/components/selects/log_channel_select.js
const { readState, writeState } = require('@root/syuttaikin_bot/utils/syuttaikinStateManager');

module.exports = {
  customId: 'log_channel_select',
  /**
   * Handles the selection of a log channel.
   * @param {import('discord.js').ChannelSelectMenuInteraction} interaction
   */
  async handle(interaction) {
    const guildId = interaction.guild.id;
    const selectedChannelId = interaction.values[0];

    const state = await readState(guildId);

    // Update the state
    state.syuttaikin = state.syuttaikin || {};
    state.syuttaikin.logChannelId = selectedChannelId;

    await writeState(guildId, state);

    const channel = await interaction.guild.channels.fetch(selectedChannelId);
    await interaction.update({
      content: `✅ 出退勤ログの通知チャンネルを #${channel.name} に設定しました。`,
      components: [],
    });
  },
};