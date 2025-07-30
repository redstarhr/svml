const { ActionRowBuilder, UserSelectMenuBuilder } = require('discord.js');

module.exports = {
  customId: 'departure_time_button',
  handle: async (interaction) => {
    const row = new ActionRowBuilder().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId('departure_time_user_select')
        .setPlaceholder('退勤ユーザーを選択')
        .setMaxValues(10)
    );

    await interaction.reply({
      content: '退勤するユーザーを選択してください。',
      components: [row],
      ephemeral: true,
    });
  },
};
