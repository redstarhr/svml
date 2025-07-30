// modals/level_stamp_add_modal.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { saveJsonToGCS, readJsonFromGCS } = require('../../utils/gcs');

module.exports = {
  customId: 'level_stamp_add_modal',

  async show(interaction) {
    const modal = new ModalBuilder()
      .setCustomId(this.customId)
      .setTitle('📌 レベルスタンプ追加');

    const levelInput = new TextInputBuilder()
      .setCustomId('target_level')
      .setLabel('対象レベル (数値)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('例: 10')
      .setRequired(true);

    const stampInput = new TextInputBuilder()
      .setCustomId('stamp_value')
      .setLabel('スタンプ (カスタム絵文字 or 画像URL)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('例: <:star:123456789012345678> or https://...')
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(levelInput),
      new ActionRowBuilder().addComponents(stampInput)
    );

    await interaction.showModal(modal);
  },

  async handle(interaction) {
    const guildId = interaction.guildId;
    const level = parseInt(interaction.fields.getTextInputValue('target_level'));
    const stamp = interaction.fields.getTextInputValue('stamp_value');

    if (isNaN(level) || level <= 0) {
      return interaction.reply({ content: '⚠️ 有効なレベル数値を入力してください。', ephemeral: true });
    }

    const filePath = `data-svml/${guildId}/level/stamps.json`;
    const data = await readJsonFromGCS(filePath) || {};

    data[level] = stamp;

    await saveJsonToGCS(filePath, data);
    await interaction.reply({ content: `✅ レベル ${level} にスタンプを登録しました！\n${stamp}`, ephemeral: true });
  }
};
