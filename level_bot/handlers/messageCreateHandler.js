// level_bot/handlers/level_handler.js
const logger = require('@common/logger');
const { readConfig } = require('../utils/levelStateManager');
const { readUserData, writeUserData, getXpForNextLevel } = require('../utils/levelDataManager');

module.exports = {
  /**
   * メッセージ作成イベントを処理してXPを付与します。
   * @param {import('discord.js').Message} message
   */
  async execute(message) {
    // BotからのメッセージやDMは無視
    if (message.author.bot || !message.inGuild()) return;

    const guildId = message.guild.id;
    const userId = message.author.id;

    try {
      const config = await readConfig(guildId);
      if (!config.enabled) return;

      // Check for disabled roles
      if (message.member && message.member.roles.cache.some(role => config.disabledRoles.includes(role.id))) {
        return;
      }

      const userData = await readUserData(guildId, userId);
      const now = Date.now();
      const cooldownMs = config.cooldownSec * 1000;

      if (now - userData.lastMessageTimestamp < cooldownMs) return;

      userData.xp += config.xpPerMessage;
      userData.lastMessageTimestamp = now;

      const xpForNext = getXpForNextLevel(userData.level);
      if (userData.xp >= xpForNext) {
        userData.level++;
        logger.info(`[LevelUp] ${message.author.tag} がレベル ${userData.level} に到達しました (サーバー: ${message.guild.name})`);

        // Send level up notification
        const levelUpMessage = `🎉 **${message.author.username}** がレベル **${userData.level}** に上がりました！`;
        if (config.notifyChannelId) {
          const notifyChannel = await message.client.channels.fetch(config.notifyChannelId).catch(() => null);
          if (notifyChannel && notifyChannel.isTextBased()) {
            await notifyChannel.send(levelUpMessage);
          }
        } else {
          await message.channel.send(levelUpMessage);
        }

        // Add a random reaction from the configured stamps
        if (config.levelStamps && config.levelStamps.length > 0) {
          const randomStamp = config.levelStamps[Math.floor(Math.random() * config.levelStamps.length)];
          await message.react(randomStamp).catch(e => logger.warn(`スタンプでのリアクションに失敗しました: ${randomStamp}`, { error: e.message }));
        }
      }

      await writeUserData(guildId, userId, userData);
    } catch (error) {
      logger.error(`[LevelSystem] XP付与の処理中にエラーが発生しました (Guild: ${guildId})`, { error });
    }
  },
};