const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const logger = require('@common/logger');

module.exports = {
  customId: /^order_(quest|tosu|horse)$/,
  async execute(interaction) {
    try {
      const match = interaction.customId.match(this.customId);
      if (!match) return;
      const type = match[1];

      const modal = new ModalBuilder()
        .setCustomId(`order_modal_${type}`)
        .setTitle('ひっかけ予定入力');

      const peopleInput = new TextInputBuilder()
        .setCustomId('people')
        .setLabel('客数')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('例: 3')
        .setRequired(true);

      const bottlesInput = new TextInputBuilder()
        .setCustomId('bottles')
        .setLabel('本数')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('例: 2')
        .setRequired(true);

      const castPuraInput = new TextInputBuilder()
        .setCustomId('castPura')
        .setLabel('消費プラキャスト数')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('例: 1')
        .setValue('0')
        .setRequired(true);

      const castKamaInput = new TextInputBuilder()
        .setCustomId('castKama')
        .setLabel('消費カマキャスト数')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('例: 1')
        .setValue('0')
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(peopleInput),
        new ActionRowBuilder().addComponents(bottlesInput),
        new ActionRowBuilder().addComponents(castPuraInput),
        new ActionRowBuilder().addComponents(castKamaInput),
      );

      await interaction.showModal(modal);
    } catch (error) {
      logger.error('ひっかけ予定モーダルの表示中にエラーが発生しました。', { error, customId: interaction.customId });
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ モーダルの表示中にエラーが発生しました。', ephemeral: true });
      }
    }
  },
};