// keihi_bot/components/buttons/keihi_submit_button.js
const { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require('discord.js');

module.exports = {
  customId: 'keihi_submit_button',
  /**
   * @param {import('discord.js').ButtonInteraction} interaction
   */
  async handle(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('keihi_submit_modal')
      .setTitle('経費申請フォーム');

    const amountInput = new TextInputBuilder()
      .setCustomId('keihi_amount')
      .setLabel('金額（円）')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('例: 1500')
      .setRequired(true);

    const descriptionInput = new TextInputBuilder()
      .setCustomId('keihi_description')
      .setLabel('内容・摘要')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('例: 〇〇購入費、交通費（△△駅 - □□駅）など')
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(amountInput), new ActionRowBuilder().addComponents(descriptionInput));

    await interaction.showModal(modal);
  },
};