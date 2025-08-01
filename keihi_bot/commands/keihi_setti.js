// commands/keihi_setti/index.js
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');

const APPLY_BUTTON_ID = 'keihi_apply_start';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('keihi_setti')
    .setDescription('このチャンネルに経費申請の受付メッセージを設置します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // 管理者のみ実行可能

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('経費申請')
      .setDescription('下のボタンを押して、経費申請フォームに必要な情報を入力してください。')
      .setColor(0x5865F2)
      .setFooter({ text: 'STAR管理bot' });

    const applyButton = new ButtonBuilder()
      .setCustomId(APPLY_BUTTON_ID)
      .setLabel('経費を申請する')
      .setEmoji('📝')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(applyButton);

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '経費申請の受付メッセージを設置しました。', flags: MessageFlags.Ephemeral });
  },
};
