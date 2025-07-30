const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('keihi_csv')
    .setDescription('申請された経費のCSVをダウンロードします。'),
  async execute(interaction) {
    // ここにコマンドの処理を実装します
    await interaction.reply({ content: '`/経費申請csv` コマンドは現在開発中です。', ephemeral: true });
  },
};