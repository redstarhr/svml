const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');

module.exports = {
  data: {
    customId: 'keihi_embed', // ボタンと一致
  },

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('keihi_embed_modal') // → modals/keihi_embed.js と一致
      .setTitle('経費申請メッセージ入力');

    const titleInput = new TextInputBuilder()
      .setCustomId('title')
      .setLabel('タイトル')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const subtitleInput = new TextInputBuilder()
      .setCustomId('subtitle')
      .setLabel('サブタイトル')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const bodyInput = new TextInputBuilder()
      .setCustomId('body')
      .setLabel('本文')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(subtitleInput),
      new ActionRowBuilder().addComponents(bodyInput)
    );

    await interaction.showModal(modal);
  },
};
