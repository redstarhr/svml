// components/modals/arrival_time_register_modal.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  customId: 'arrival_time_register_modal',
  async handle(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('arrival_time_register_submit')
      .setTitle('出勤時間登録');

    const input = new TextInputBuilder()
      .setCustomId('arrival_times_input')
      .setLabel('出勤時間をカンマ区切りで入力してください（例: 10:00,10:30）')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(input);
    modal.addComponents(row);

    await interaction.showModal(modal);
  },
};
