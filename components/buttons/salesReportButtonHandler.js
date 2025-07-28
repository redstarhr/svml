// components/buttons/salesReportButtonHandler.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  customId: 'sales_report',
  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('sales_report_modal') // このIDはモーダルハンドラと一致させる必要があります
      .setTitle('📈 売上報告');

    const fields = [
      { id: 'report_date', label: '日付 (例: 7/18)', style: TextInputStyle.Short, required: true },
      { id: 'report_total', label: '総売り (半角数字)', style: TextInputStyle.Short, required: true },
      { id: 'report_cash', label: '現金 (半角数字)', style: TextInputStyle.Short, required: true },
      { id: 'report_card', label: 'カード (半角数字)', style: TextInputStyle.Short, required: true },
      { id: 'report_expense', label: '諸経費 (半角数字、なければ0)', style: TextInputStyle.Short, required: false, placeholder: '0' },
    ];

    fields.forEach(field => {
      const input = new TextInputBuilder()
        .setCustomId(field.id)
        .setLabel(field.label)
        .setStyle(field.style)
        .setRequired(field.required);
      
      if (field.placeholder) input.setPlaceholder(field.placeholder);

      modal.addComponents(new ActionRowBuilder().addComponents(input));
    });

    await interaction.showModal(modal);
  },
};