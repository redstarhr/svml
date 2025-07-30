const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('経費申請設置')
    .setDescription('経費申請を開始するためのメッセージとボタンを設置します。'),
  async execute(interaction) {
    // ここにコマンドの処理を実装します
    await interaction.reply({ content: '`/経費申請設置` コマンドは現在開発中です。', ephemeral: true });
  },
};