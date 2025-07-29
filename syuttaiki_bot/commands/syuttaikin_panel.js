// syuttaiki_bot/commands/syuttaikin_panel.js

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('出退勤パネル設置')
    .setDescription('出勤・退勤ボタンを設置します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle('🕒 出退勤管理')
      .setDescription('下のボタンを押して出勤・退勤を記録してください。')
      .setColor(0x5865F2)
      .setFooter({ text: 'SVML事務Bot' });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('syuttaikin_clock_in')
        .setLabel('出勤')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('syuttaikin_clock_out')
        .setLabel('退勤')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.channel.send({ embeds: [embed], components: [buttons] });
    await interaction.editReply({ content: '✅ 出退勤パネルを設置しました。' });
  }
};