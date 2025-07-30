// commands/keihi_setti/index.js
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('keihi_setti')
    .setDescription('経費申請の受付メッセージをこのチャンネルに設置します。'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📋 経費申請の設置')
      .setDescription('下のボタンでこれからbot送信される『経費申請フォーラム』の本文を入力します')
      .setColor(0x3498db);

    const configButton = new ButtonBuilder()
      .setCustomId('setup_create_forum')
      .setLabel('経費申請フォーラム作成')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(configButton);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: 64 // 自分にだけ見える
    });
  },
};
