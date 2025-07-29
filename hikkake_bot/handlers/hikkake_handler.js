// hikkake_bot/handlers/hikkake_handler.js

const buttonHandler = require('../utils/hikkake_button_handler');
const modalHandler = require('../utils/hikkake_modal_handler');
const selectHandler = require('../utils/hikkake_select_handler');

module.exports = {
  /**
   * hikkake_bot関連のインタラクションを適切なハンドラに振り分ける
   * @param {import('discord.js').Interaction} interaction
   * @returns {Promise<boolean>} 処理した場合はtrue
   */
  async execute(interaction) {
    if (interaction.isButton()) {
      return await buttonHandler.execute(interaction);
    }
    if (interaction.isModalSubmit()) {
      return await modalHandler.execute(interaction);
    }
    if (interaction.isAnySelectMenu()) {
      return await selectHandler.execute(interaction);
    }
    return false; // このハンドラでは処理しなかった
  }
};