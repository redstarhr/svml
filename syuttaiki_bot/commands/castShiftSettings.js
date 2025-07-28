// commands/castShiftSettings.js

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { showSettingsMenu } = require('../utils/castShift/castSettingsManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('キャスト出退勤設定')
    .setDescription('キャストの出勤・退勤時間や通知ログを管理します')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await showSettingsMenu(interaction);
  }
};
