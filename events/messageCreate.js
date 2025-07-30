const { Events } = require('discord.js');
const logger = require('@common/logger');

module.exports = {
  name: Events.MessageCreate,
  /**
   * メッセージが作成されたときに、登録されたすべてのメッセージハンドラを実行します。
   * @param {import('discord.js').Message} message
   */
  async execute(message) {
    // Bot自身のメッセージやDMは無視
    if (message.author.bot || !message.guild) return;

    // 登録されているすべてのメッセージハンドラを非同期で実行
    for (const handler of message.client.messageHandlers) {
      try {
        await handler.execute(message);
      } catch (error) {
        logger.error(`MessageCreateハンドラの実行中にエラーが発生しました。`, { handler: handler.constructor.name, error });
      }
    }
  },
};