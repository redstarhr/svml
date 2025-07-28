// hikkake_bot/utils/hikkake_modal_handler.js

const reactionSubmitHandler = require('./hikkakeReactionModalSubmit');
const dohanSubmitHandler = require('./hikkakeDohanSubmit');

const handlers = [
  reactionSubmitHandler,
  dohanSubmitHandler,
  // 他のハンドラをここに追加できます
];

module.exports = {
  /**
   * @param {import('discord.js').ModalSubmitInteraction} interaction
   * @returns {Promise<boolean>}
   */
  async execute(interaction) {
    if (!interaction.isModalSubmit() || !interaction.customId.startsWith('hikkake_')) return false;

    for (const handler of handlers) {
      // カスタムIDが文字列または正規表現で一致するかをチェック
      if (typeof handler.customId === 'string' && handler.customId === interaction.customId) {
        await handler.handle(interaction);
        return true;
      }
      if (handler.customId instanceof RegExp && handler.customId.test(interaction.customId)) {
        await handler.handle(interaction);
        return true;
      }
    }
    return false;
  }
};