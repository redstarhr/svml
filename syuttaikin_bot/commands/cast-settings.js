// syuttaiki_bot/commands/cast-settings.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { updateSettingsMessage } = require('../components/settings/_updateSettingsMessage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cast-settings')
    .setDescription('出退勤Botの各種設定を行います。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await updateSettingsMessage(interaction);
  },
};
