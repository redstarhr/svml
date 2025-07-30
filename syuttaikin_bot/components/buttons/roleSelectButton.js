const {
  ActionRowBuilder,
  RoleSelectMenuBuilder,
} = require('discord.js');

module.exports = {
  customId: 'role_select_button',
  handle: async (interaction) => {
    const row = new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('role_select')
        .setPlaceholder('キャストロールを選択')
        .setMaxValues(5)
    );

    await interaction.reply({
      content: '表示するキャストロールを選んでください。',
      components: [row],
      ephemeral: true,
    });
  },
};
