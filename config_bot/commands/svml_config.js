const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('svml_config')
    .setDescription('各種設定パネルを表示します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('⚙️ SVML Bot 設定パネル')
      .setDescription('以下のボタンから各種設定を行ってください。')
      .setColor(0x3498DB);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('config_add_store')
        .setLabel('店舗名追加')
        .setEmoji('🏪')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('config_register_user')
        .setLabel('ユーザー情報登録')
        .setEmoji('👤')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('config_level_settings')
        .setLabel('レベル設定')
        .setEmoji('📈')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      embeds: [embed],
      components: [buttons],
      ephemeral: true,
    });
  },
};