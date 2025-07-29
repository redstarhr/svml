// syuttaiki_bot/commands/castShiftSetup.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
// const { readJSON } = require('../../../common/fileHelper.js'); // Example usage

module.exports = {
  data: new SlashCommandBuilder()
    .setName('シフトセットアップ')
    .setDescription('キャストのシフト管理パネルを設置します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    await interaction.reply({ content: 'このコマンドは現在開発中です。', ephemeral: true });
  },
};