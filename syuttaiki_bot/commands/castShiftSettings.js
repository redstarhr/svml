// syuttaiki_bot/commands/castShiftSettings.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
// const { readJSON } = require('../../../common/fileHelper.js'); // Example usage

module.exports = {
  data: new SlashCommandBuilder()
    .setName('シフト設定')
    .setDescription('キャストのシフト関連設定を行います。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    await interaction.reply({ content: 'このコマンドは現在開発中です。', ephemeral: true });
  },
};