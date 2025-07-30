// level_bot/components/buttons/editBasicSettings.js
const { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require('discord.js');
const { readConfig } = require('../../utils/levelStateManager');

module.exports = {
  customId: 'editBasicSettings',
  /**
   * @param {import('discord.js').ButtonInteraction} interaction
   */
  async handle(interaction) {
    const config = await readConfig(interaction.guildId);

    const modal = new ModalBuilder()
      .setCustomId('editBasicSettingsModal')
      .setTitle('レベル基本設定');

    const xpInput = new TextInputBuilder()
      .setCustomId('xpPerMessage')
      .setLabel('1メッセージあたりの獲得XP')
      .setStyle(TextInputStyle.Short)
      .setValue(String(config.xpPerMessage))
      .setRequired(true);

    const cooldownInput = new TextInputBuilder()
      .setCustomId('cooldownSec')
      .setLabel('クールダウン（秒）')
      .setStyle(TextInputStyle.Short)
      .setValue(String(config.cooldownSec))
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(xpInput), new ActionRowBuilder().addComponents(cooldownInput));
    await interaction.showModal(modal);
  },
};