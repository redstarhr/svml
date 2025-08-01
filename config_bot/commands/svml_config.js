const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } = require('discord.js');

// Custom IDs for the buttons
const ADD_STORE_ID = 'config_add_store';
const REGISTER_USER_ID = 'config_register_user';
const LEVEL_SETTINGS_ID = 'config_level_settings';


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
        .setCustomId(ADD_STORE_ID) // Note: This ID is not handled by any current handler.
        .setLabel('店舗名追加')
        .setEmoji('🏪')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(REGISTER_USER_ID) // Note: This ID is not handled by any current handler.
        .setLabel('ユーザー情報登録')
        .setEmoji('👤')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(LEVEL_SETTINGS_ID) // Handled by leveling_bot/handlers/levelSettingsHandler.js
        .setLabel('レベル設定')
        .setEmoji('📈')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      embeds: [embed],
      components: [buttons],
      flags: MessageFlags.Ephemeral,
    });
  },
};