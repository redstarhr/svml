// level_bot/components/buttons/addLevelStamp.js
const { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require('discord.js');

module.exports = {
  customId: 'addLevelStamp',
  /**
   * @param {import('discord.js').ButtonInteraction} interaction
   */
  async handle(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('addLevelStampModal')
      .setTitle('レベルアップスタンプ追加');

    const stampInput = new TextInputBuilder()
      .setCustomId('stampInput')
      .setLabel('追加するスタンプを入力 (例: 🎉)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(stampInput));
    await interaction.showModal(modal);
  },
};