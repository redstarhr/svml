const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  customId: 'departure_time_register_modal',
  handle: async (interaction) => {
    const modal = new ModalBuilder()
      .setCustomId('departure_time_register_submit')
      .setTitle('退勤時間の登録');

    const timeInput = new TextInputBuilder()
      .setCustomId('departure_time_input')
      .setLabel('退勤時間を入力してください（例: 18:00）')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('HH:mm形式で入力')
      .setRequired(true);

    const timeRow = new ActionRowBuilder().addComponents(timeInput);

    modal.addComponents(timeRow);

    await interaction.showModal(modal);
  },
};
