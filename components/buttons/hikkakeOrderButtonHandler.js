const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  customId: /^order_(quest|tosu|horse)$/,
  async execute(interaction) {
    const type = interaction.customId.split('_')[1];

    const modal = new ModalBuilder()
      .setCustomId(`order_modal_${type}`)
      .setTitle('受注入力');

    const orderInput = new TextInputBuilder()
      .setCustomId('order_details')
      .setLabel('受注内容を入力してください')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const actionRow = new ActionRowBuilder().addComponents(orderInput);
    modal.addComponents(actionRow);

    await interaction.showModal(modal);
  },
};