const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hikkake')
    .setDescription('（開発中）ひっかけ関連のコマンドです。'),

  async execute(interaction) {
    await interaction.reply({ content: 'このコマンドは現在開発中です。', ephemeral: true });
  },
};