// discord_sales_bot/commands/uriage_houkoku.js

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('売上報告設置')
    .setDescription('売上報告用のボタン付きメッセージを送信します'),

  async execute(interaction) {
    await interaction.deferReply(); // flags: 0 は不要

    const embed = new EmbedBuilder()
      .setTitle('📊 売上報告')
      .setDescription('下の「報告」ボタンを押して、本日の売上を入力してください。')
      .addFields(
        { name: '日付', value: '例 7/7', inline: true },
        { name: '総売り', value: '例 300,000', inline: true },
        { name: '現金', value: '例 150,000', inline: true },
        { name: 'カード', value: '例 150,000', inline: true },
        { name: '諸経費', value: '例 150,000', inline: true },
      )
      .setColor(0x3498DB) // A slightly nicer blue
      .setFooter({ text: 'SVML事務Bot' });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('show_sales_report_modal')
        .setLabel('報告')
        .setStyle(ButtonStyle.Primary)
    );

    // Embed とボタンを送信
    await interaction.editReply({ embeds: [embed], components: [buttons] });
  }
};
