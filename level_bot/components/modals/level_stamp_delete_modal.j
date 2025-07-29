// modals/level_stamp_delete_modal.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { saveJsonToGCS, readJsonFromGCS } = require('../../utils/gcs');

module.exports = {
  customId: 'level_stamp_delete_modal',

  async show(interaction) {
    const modal = new ModalBuilder()
      .setCustomId(this.customId)
      .setTitle('🗑️ レベルスタンプ削除');

    const levelInput = new TextInputBuilder()
      .setCustomId('target_level')
      .setLabel('削除するレベル (数値)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('例: 10')
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(levelInput)
    );

    await interaction.showModal(modal);
  },

  async handle(interaction) {
    const guildId = interaction.guildId;
    const level = parseInt(interaction.fields.getTextInputValue('target_level'));

    if (isNaN(level) || level <= 0) {
      return interaction.reply({ content: '⚠️ 有効なレベル数値を入力してください。', ephemeral: true });
    }

    const filePath = `data-svml/${guildId}/level/stamps.json`;
    const data = await readJsonFromGCS(filePath);

    if (!data || !data[level]) {
      return interaction.reply({ content: `⚠️ レベル ${level} に登録されたスタンプは存在しません。`, ephemeral: true });
    }

    delete data[level];
    await saveJsonToGCS(filePath, data);

    await interaction.reply({ content: `🗑️ レベル ${level} のスタンプを削除しました。`, ephemeral: true });
  }
};
