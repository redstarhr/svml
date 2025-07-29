// level_bot/handlers/level_handler.js
const logger = require('@common/logger');
const { getConfig } = require('../utils/levelConfigManager');
const { addXp } = require('../utils/levelManager');

// ユーザーごとのクールダウンを管理
const userCooldowns = new Map();
const COOLDOWN_SECONDS = 60;

module.exports = {
  /**
   * メッセージ作成イベントを処理してXPを付与します。
   * @param {import('discord.js').Message} message
   * @returns {Promise<boolean>}
   */
  async execute(message) {
    // messageCreateイベント以外は処理しない
    if (!message.author || !message.guild) return false;

    // BotからのメッセージやDMは無視
    if (message.author.bot || !message.inGuild()) return false;

    // クールダウンチェック
    const now = Date.now();
    const lastMessageTimestamp = userCooldowns.get(message.author.id) || 0;
    if (now - lastMessageTimestamp < COOLDOWN_SECONDS * 1000) {
      return false; // クールダウン中はXPを付与しない
    }
    userCooldowns.set(message.author.id, now);

    const config = await getConfig(message.guild.id);
    const xpToAdd = Math.floor(Math.random() * (config.xpPerMessage.max - config.xpPerMessage.min + 1)) + config.xpPerMessage.min;

    await addXp(message.member, xpToAdd);
    return false;
  },
};