const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const castStateManager = require('../utils/castShift/castStateManager');
const { createOrUpdateCastShiftEmbed } = require('../utils/castShift/castPanelManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('キャスト出勤設置')
    .setDescription('キャスト出退勤のパネルをこのチャンネルに設置します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const channel = interaction.channel;
    const today = new Date().toISOString().split('T')[0];

    const initialState = await castStateManager.loadOrInitState(guildId, today, channel.id);

    const embedMessage = await createOrUpdateCastShiftEmbed({
      guildId,
      date: today,
      state: initialState,
      channel,
    });

    await interaction.reply({ content: '✅ 出勤パネルを設置しました。', ephemeral: true });
  }
};
