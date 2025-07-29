// commands/levelSetting.js
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('レベル設定')
    .setDescription('レベル機能の設定パネルを表示します')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('level_stamp_config')
        .setLabel('📌 レベルスタンプ登録')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('level_invalid_role')
        .setLabel('🚫 レベル無効ロール設定')
        .setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({
      content: 'レベル設定パネルを表示します：',
      components: [row],
      ephemeral: true,
    });
  },
};
