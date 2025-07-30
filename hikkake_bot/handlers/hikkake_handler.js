// hikkake_bot/handlers/hikkake_handler.js

const logger = require('@common/logger');
const buttonHandler = require('../utils/hikkake_button_handler');
const modalHandler = require('../utils/hikkake_modal_handler');
const selectHandler = require('../utils/hikkake_select_handler');

module.exports = {
  /**
   * hikkake_bot関連のインタラクションを適切なハンドラに振り分けます。
   * @param {import('discord.js').Interaction} interaction
   * @returns {Promise<boolean>} 処理した場合はtrue
   */
  async execute(interaction) {
    // このハンドラは 'hikkake_' または 'cancel_order_' で始まるcustomIdを持つインタラクションのみを処理します。
    if (!interaction.customId || !(interaction.customId.startsWith('hikkake_') || interaction.customId.startsWith('cancel_order_'))) {
      return false;
    }

    try {
      if (interaction.isButton()) {
        return await buttonHandler.execute(interaction);
      }
      if (interaction.isModalSubmit()) {
        return await modalHandler.execute(interaction);
      }
      if (interaction.isAnySelectMenu()) {
        return await selectHandler.execute(interaction);
      }
    } catch (error) {
        logger.error(`[HikkakeHandler] インタラクション処理中にエラーが発生しました (ID: ${interaction.customId})`, { error });
        // ユーザーにエラーを通知
        if (interaction.isRepliable()) {
            const errorMessage = { content: '処理中にエラーが発生しました。管理者に連絡してください。', ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage).catch(() => {});
            } else {
                await interaction.reply(errorMessage).catch(() => {});
            }
        }
        return true; // エラーはこちらで処理済み
    }
    return false;
  }
};