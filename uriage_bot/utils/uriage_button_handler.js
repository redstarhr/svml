// uriage_bot/utils/uriage_button_handler.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  async execute(interaction) {
    if (!interaction.isButton()) return false;

    // 「売上報告」ボタンが押された時の処理
    if (interaction.customId === 'sales_report') {
      const modal = new ModalBuilder()
        .setCustomId('sales_report_modal')
        .setTitle('売上報告');

      const dateInput = new TextInputBuilder().setCustomId('date').setLabel('日付 (例: 7/7)').setStyle(TextInputStyle.Short).setRequired(true);
      const totalSalesInput = new TextInputBuilder().setCustomId('total_sales').setLabel('総売り').setStyle(TextInputStyle.Short).setRequired(true);
      const cashInput = new TextInputBuilder().setCustomId('cash').setLabel('現金').setStyle(TextInputStyle.Short).setRequired(true);
      const cardInput = new TextInputBuilder().setCustomId('card').setLabel('カード').setStyle(TextInputStyle.Short).setRequired(true);
      const expensesInput = new TextInputBuilder().setCustomId('expenses').setLabel('諸経費').setStyle(TextInputStyle.Short).setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(dateInput),
        new ActionRowBuilder().addComponents(totalSalesInput),
        new ActionRowBuilder().addComponents(cashInput),
        new ActionRowBuilder().addComponents(cardInput),
        new ActionRowBuilder().addComponents(expensesInput)
      );

      await interaction.showModal(modal);
      return true;
    }

    // 「報告を修正」ボタンが押された時の処理
    if (interaction.customId === 'sales_report_edit') {
        await interaction.reply({ content: '修正機能は現在開発中です。', flags: 64 });
        return true;
    }

    return false;
  }
};