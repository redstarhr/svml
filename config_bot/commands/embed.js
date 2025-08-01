const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');

const NEW_BUTTON_ID = 'embed_builder_new';
const EDIT_BUTTON_ID = 'embed_builder_edit';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Embedメッセージの作成・編集パネルを呼び出します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📝 Embedビルダー')
      .setDescription('Embedメッセージを新規作成するか、既存のものを編集するか選択してください。')
      .setColor(0x3498db);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(NEW_BUTTON_ID)
        .setLabel('新規作成')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(EDIT_BUTTON_ID)
        .setLabel('編集')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral,
    });
  },
};