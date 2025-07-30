const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
  customId: 'departure_time_user_select',
  handle: async (interaction) => {
    const selectedUsers = interaction.values; // ユーザーIDの配列
    const time = interaction.customId.split(':')[1];

    const modal = new ModalBuilder()
      .setCustomId(`departure_time_register_modal:${time}:${selectedUsers.join(',')}`)
      .setTitle(`退勤時間 ${time} を登録`);

    const noteInput = new TextInputBuilder()
      .setCustomId('note')
      .setLabel('備考（任意）')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const row = new ActionRowBuilder().addComponents(noteInput);

    modal.addComponents(row);
    await interaction.showModal(modal);
  },
};
