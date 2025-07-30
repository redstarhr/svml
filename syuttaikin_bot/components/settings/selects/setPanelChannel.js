// syuttaiki_bot/components/settings/selects/setPanelChannel.js
const { readState, writeState } = require('@root/syuttaiki_bot/utils/syuttaikiStateManager');
const { MessageFlags } = require('discord.js');

module.exports = {
  customId: 'setting_set_panel_channel',
  /**
   * @param {import('discord.js').ChannelSelectMenuInteraction} interaction
   */
  async handle(interaction) {
    const guildId = interaction.guild.id;
    const selectedChannelId = interaction.values[0];

    const state = await readState(guildId);
    state.syuttaikin.panelChannelId = selectedChannelId;
    await writeState(guildId, state);

    await interaction.reply({
      content: `✅ 出退勤パネルの投稿先チャンネルを <#${selectedChannelId}> に設定しました。`,
      flags: [MessageFlags.Ephemeral],
    });
  },
};