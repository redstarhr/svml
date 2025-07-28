// uriage_bot/utils/uriage_modal_handler.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { saveJsonToGCS, copyGCSFile } = require('../../utils/gcs');

// 数値をカンマ区切りにフォーマットする関数
function formatNumber(num) {
  return new Intl.NumberFormat('ja-JP').format(num);
}

module.exports = {
  async execute(interaction) {
    if (!interaction.isModalSubmit() || interaction.customId !== 'sales_report_modal') {
      return false;
    }

    await interaction.deferReply();

    try {
      const date = interaction.fields.getTextInputValue('date');
      const totalSales = parseInt(interaction.fields.getTextInputValue('total_sales').replace(/,/g, ''), 10);
      const cash = parseInt(interaction.fields.getTextInputValue('cash').replace(/,/g, ''), 10);
      const card = parseInt(interaction.fields.getTextInputValue('card').replace(/,/g, ''), 10);
      const expenses = parseInt(interaction.fields.getTextInputValue('expenses').replace(/,/g, ''), 10);

      if ([totalSales, cash, card, expenses].some(isNaN)) {
        await interaction.editReply({ content: '総売り、現金、カード、諸経費には半角数字を入力してください。', ephemeral: true });
        return true;
      }

      const remaining = totalSales - cash - expenses;
      const guildId = interaction.guildId;
      // 仕様書に基づき、日付をファイル名に使用
      const dateForFilename = date.replace(/\//g, '-');
      const dataFilePath = `uriage_bot/${guildId}/uriagehoukoku_${dateForFilename}.json`;
      const logFilePath = `uriage_bot/${guildId}/logs/uriagehoukoku_${dateForFilename}_${Date.now()}.json`;

      const reportData = {
        date,
        totalSales,
        cash,
        card,
        expenses,
        remaining,
        reportedBy: interaction.user.id,
        reportedAt: new Date().toISOString(),
      };

      // 既存ファイルがあればバックアップ
      await copyGCSFile(dataFilePath, logFilePath);
      // 新しいデータを保存
      await saveJsonToGCS(dataFilePath, reportData);

      const embed = new EmbedBuilder()
        .setTitle(`【売上報告】${date}`)
        .setDescription(`報告者: <@${interaction.user.id}>`)
        .addFields(
          { name: '総売り', value: `¥${formatNumber(totalSales)}`, inline: true },
          { name: '現金', value: `¥${formatNumber(cash)}`, inline: true },
          { name: 'カード', value: `¥${formatNumber(card)}`, inline: true },
          { name: '諸経費', value: `¥${formatNumber(expenses)}`, inline: true },
          { name: '差額', value: `¥${formatNumber(remaining)}`, inline: true }
        )
        .setColor(0x00FF00)
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('sales_report_edit')
          .setLabel('報告を修正')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true) // 修正機能は未実装
      );

      await interaction.editReply({ embeds: [embed], components: [row] });

    } catch (error) {
      console.error('売上報告モーダルの処理中にエラー:', error);
      await interaction.editReply({ content: 'エラーが発生し、報告を保存できませんでした。', ephemeral: true });
    }

    return true;
  }
};