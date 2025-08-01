// commands/keihi_setti/apply.js

const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');

module.exports = {
  data: {
    customId: 'apply', // ← ボタンと一致
  },

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('expense_apply_modal') // このIDでモーダル提出後に反応
      .setTitle('📋 経費申請フォーム');

    const itemInput = new TextInputBuilder()
      .setCustomId('item')
      .setLabel('申請項目（例：交通費、備品など）')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const amountInput = new TextInputBuilder()
      .setCustomId('amount')
      .setLabel('金額（半角数字のみ）')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const detailInput = new TextInputBuilder()
      .setCustomId('detail')
      .setLabel('用途・詳細（任意）')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(itemInput),
      new ActionRowBuilder().addComponents(amountInput),
      new ActionRowBuilder().addComponents(detailInput)
    );

    await interaction.showModal(modal);
  }
};


