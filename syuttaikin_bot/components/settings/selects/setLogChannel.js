// syuttaiki_bot/components/settings/selects/setLogChannel.js
const { readState, writeState } = require('@root/syuttaiki_bot/utils/syuttaikiStateManager');
const { MessageFlags } = require('discord.js');

module.exports = {
  customId: 'setting_set_log_channel',
  /**
   * @param {import('discord.js').ChannelSelectMenuInteraction} interaction
   */
  async handle(interaction) {
    const guildId = interaction.guild.id;
    const selectedChannelId = interaction.values[0];

    const state = await readState(guildId);
    state.syuttaikin.logChannelId = selectedChannelId;
    await writeState(guildId, state);

    await interaction.reply({
      content: `✅ 出退勤ログの通知先チャンネルを <#${selectedChannelId}> に設定しました。`,
      flags: [MessageFlags.Ephemeral],
    });
  },
};