// commands/keihi_setti/edit.js

const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');

module.exports = {
  data: {
    customId: 'edit_button',
  },

  async execute(interaction) {
    const message = interaction.message;
    const embed = message.embeds?.[0];

    if (!embed) {
      return interaction.reply({
        content: '❌ 修正対象の申請情報が見つかりません。',
        flags: 64
      });
    }

    // 埋め込みから値を抽出
    const fields = embed.fields;
    const item = fields.find(f => f.name === '内容')?.value ?? '';
    const amount = fields.find(f => f.name === '金額')?.value.replace(/[¥,]/g, '') ?? '';
    const detail = fields.find(f => f.name === '詳細')?.value ?? '';

    // モーダル作成
    const modal = new ModalBuilder()
      .setCustomId(`edit_modal_${message.id}`)
      .setTitle('🖊️ 経費申請の修正');

    const itemInput = new TextInputBuilder()
      .setCustomId('item')
      .setLabel('申請項目')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setValue(item);

    const amountInput = new TextInputBuilder()
      .setCustomId('amount')
      .setLabel('金額（半角数字）')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setValue(amount);

    const detailInput = new TextInputBuilder()
      .setCustomId('detail')
      .setLabel('用途・詳細（任意）')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setValue(detail);

    modal.addComponents(
      new ActionRowBuilder().addComponents(itemInput),
      new ActionRowBuilder().addComponents(amountInput),
      new ActionRowBuilder().addComponents(detailInput)
    );

    await interaction.showModal(modal);
  }
};
