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
    // コマンド実行ログをターミナルに出力
    console.log(`[${new Date().toISOString()}] コマンド「${interaction.commandName}」がユーザー「${interaction.user.tag}」によって実行されました。`);

    // 応答を保留します（公開メッセージ）
    await interaction.deferReply(); // flags: 0 は不要

    const embed = new EmbedBuilder()
      .setTitle('売上報告')
      .setDescription('下のボタンから売上報告または報告の修正を行ってください。')
      .addFields(
        { name: '日付', value: '例 7/7', inline: true },
        { name: '総売り', value: '例 300,000', inline: true },
        { name: '現金', value: '例 150,000', inline: true },
        { name: 'カード', value: '例 150,000', inline: true },
        { name: '諸経費', value: '例 150,000', inline: true },
      )
      .setColor(0x0099ff)
      .setFooter({ text: 'SVML事務Bot' });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('sales_report')
        .setLabel('売上報告')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('sales_report_edit')
        .setLabel('報告を修正')
        .setStyle(ButtonStyle.Secondary)
    );

    // Embed とボタンを送信
    await interaction.editReply({ embeds: [embed], components: [buttons] });
  }
};
