// keihi_bot/commands/keihi_setti.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
} = require('discord.js');
const { SHINSEI_BUTTON_ID } = require('../constants/customIds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('keihi_setti')
    .setDescription('このチャンネルに経費申請の受付メッセージを設置します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('経費申請')
      .setDescription('経費を申請する場合は、下のボタンを押してください。')
      .setColor(0x5865F2)
      .setFooter({ text: 'SVML管理bot' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(SHINSEI_BUTTON_ID)
        .setLabel('経費を申請する')
        .setEmoji('📝')
        .setStyle(ButtonStyle.Primary),
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '経費申請の受付メッセージを設置しました。', flags: MessageFlags.Ephemeral });
  },
};

