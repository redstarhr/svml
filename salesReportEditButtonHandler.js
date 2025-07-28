// components/buttons/salesReportEditButtonHandler.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { readJsonFromGCS } = require('../../../utils/gcs');

module.exports = {
  customId: /^edit_sales_report_(\d{4}-\d{2}-\d{2})_(\d+)$/,
  async execute(interaction) {
    const match = interaction.customId.match(this.customId);
    const [, date, userId] = match;
    const guildId = interaction.guildId;
    const filePath = `data/sales_reports/${guildId}/uriage-houkoku-${date}-${userId}.json`;

    try {
      const reportData = await readJsonFromGCS(filePath);
      if (!reportData) {
        return interaction.reply({ content: '修正対象の報告データが見つかりませんでした。', ephemeral: true });
      }

      const modal = new ModalBuilder()
        .setCustomId(`edit_sales_report_modal_${date}_${userId}`) // 修正用モーダルハンドラのIDと一致させる
        .setTitle('📝 売上報告の修正');

      const fields = [
        { id: 'report_date', label: '日付 (例: 7/18)', value: reportData.日付 },
        { id: 'report_total', label: '総売り (半角数字)', value: String(reportData.総売り) },
        { id: 'report_cash', label: '現金 (半角数字)', value: String(reportData.現金) },
        { id: 'report_card', label: 'カード (半角数字