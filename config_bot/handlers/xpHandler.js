const { EmbedBuilder } = require('discord.js');
const { getLevelConfig } = require('../utils/levelConfig');
const { getUserLevelData, setUserLevelData } = require('../utils/levelDataManager');
const logger = require('@common/logger');

/**
 * Calculates the XP required for a given level.
 * A common formula is 5 * (lvl ^ 2) + 50 * lvl + 100
 * @param {number} level The level to calculate XP for.
 * @returns {number} The total XP required to reach that level.
 */
function xpForLevel(level) {
  return Math.floor(5 * (level ** 2) + 50 * level + 100);
}

module.exports = {
  /**
   * This handler processes incoming messages to grant XP.
   * @param {import('discord.js').Message} message
   * @returns {Promise<void>}
   */
  async execute(message) {
    // This check is already in messageCreate, but it's good practice to keep it here too.
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;
    const userId = message.author.id;

    try {
      const config = await getLevelConfig(guildId);
      // If xpPerMessage is not configured, do nothing.
      if (!config?.xpPerMessage) {
        return;
      }
      const userData = await getUserLevelData(guildId, userId);

      // Cooldown check
      const now = Date.now();
      if (now - userData.lastMessageTimestamp < config.cooldownSeconds * 1000) {
        return;
      }

      // Grant XP
      const xpToGive = Math.floor(Math.random() * (config.xpPerMessage.max - config.xpPerMessage.min + 1)) + config.xpPerMessage.min;
      userData.xp += xpToGive;
      userData.lastMessageTimestamp = now;

      // Level up check
      const xpNeededForNextLevel = xpForLevel(userData.level);
      if (userData.xp >= xpNeededForNextLevel) {
        userData.level++;
        // Optional: Reset XP or carry over excess
        // userData.xp -= xpNeededForNextLevel; // Reset XP after level up

        // Announce level up
        if (config.levelUpChannelId) {
          const levelUpChannel = await message.client.channels.fetch(config.levelUpChannelId).catch(() => null);
          if (levelUpChannel?.isTextBased()) {
            const levelUpEmbed = new EmbedBuilder()
              .setColor(0x57F287) // Green
              .setDescription(`🎉 おめでとう、${message.author}！ **レベル ${userData.level}** に到達しました！`);
            await levelUpChannel.send({ embeds: [levelUpEmbed] });
          } else if (levelUpChannel) {
            logger.warn(`レベルアップ通知チャンネル(ID: ${config.levelUpChannelId})はテキストチャンネルではありません。`, { guildId });
          } else {
            logger.warn(`レベルアップ通知チャンネル(ID: ${config.levelUpChannelId})が見つかりませんでした。`, { guildId });
          }
        }
        // TODO: Add role rewards logic here
      }

      await setUserLevelData(guildId, userId, userData);

    } catch (error) {
      logger.error(`XP付与処理中にエラーが発生しました。`, { error, guildId, userId });
    }
  },
};