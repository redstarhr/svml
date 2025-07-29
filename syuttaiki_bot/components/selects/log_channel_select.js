// syuttaiki_bot/components/selects/log_channel_select.js
const { readJSON, writeJSON } = require('@common/fileHelper');
const path = require('path');

module.exports = {
  customId: 'log_channel_select',
  /**
   * Handles the selection of a log channel.
   * @param {import('discord.js').ChannelSelectMenuInteraction} interaction
   */
  async handle(interaction) {
    const guildId = interaction.guild.id;
    const selectedChannelId = interaction.values[0];

    const filePath = path.join('data-svml', guildId, `${guildId}.json`);
    const state = await readJSON(filePath, {});

    // Update the state
    state.syuttaikin = state.syuttaikin || {};
    state.syuttaikin.logChannelId = selectedChannelId;

    await writeJSON(filePath, state);

    const channel = await interaction.guild.channels.fetch(selectedChannelId);
    await interaction.update({
      content: `✅ 出退勤ログの通知チャンネルを #${channel.name} に設定しました。`,
      components: [],
    });
  },
};