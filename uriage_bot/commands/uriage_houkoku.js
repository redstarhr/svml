// discord_sales_bot/commands/uriage_houkoku.js

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');

const SHOW_MODAL_BUTTON_ID = 'uriage_show_sales_report_modal';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('売上報告設置')
    .setDescription('売上報告用のボタン付きメッセージを送信します')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📊 売上報告')
      .setDescription('下の「報告」ボタンを押して、本日の売上を入力してください。')
      .setColor(0x3498DB) // A slightly nicer blue
      .setFooter({ text: 'SVML事務Bot' });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(SHOW_MODAL_BUTTON_ID)
        .setLabel('報告')
        .setStyle(ButtonStyle.Primary)
    );

    // パネルをチャンネルに送信
    await interaction.channel.send({ embeds: [embed], components: [buttons] });
    // 実行者にエフェメラルメッセージで完了通知
    await interaction.reply({ content: '売上報告の受付メッセージを設置しました。', flags: MessageFlags.Ephemeral });
  }
};
