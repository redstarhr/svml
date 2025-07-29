// level_bot/utils/levelDataManager.js
const { readJsonFromGCS, saveJsonToGCS } = require('@common/gcs/gcsUtils');

const USER_DATA_PATH = (guildId, userId) => `level_bot/${guildId}/users/${userId}.json`;

/**
 * Reads a user's level data.
 * @param {string} guildId The ID of the guild.
 * @param {string} userId The ID of the user.
 * @returns {Promise<object>} The user's data.
 */
async function readUserData(guildId, userId) {
  const defaultData = {
    xp: 0,
    level: 0,
    lastMessageTimestamp: 0,
  };
  const userData = await readJsonFromGCS(USER_DATA_PATH(guildId, userId), defaultData);
  return { ...defaultData, ...userData };
}

/**
 * Writes a user's level data.
 * @param {string} guildId The ID of the guild.
 * @param {string} userId The ID of the user.
 * @param {object} data The user data to save.
 * @returns {Promise<void>}
 */
async function writeUserData(guildId, userId, data) {
  await saveJsonToGCS(USER_DATA_PATH(guildId, userId), data);
}

/**
 * Calculates the XP required for the next level.
 * Formula: 5 * (level ^ 2) + 50 * level + 100
 * @param {number} level The current level.
 * @returns {number} The XP needed to reach the next level.
 */
function getXpForNextLevel(level) {
  return 5 * (level ** 2) + (50 * level) + 100;
}

module.exports = {
  readUserData,
  writeUserData,
  getXpForNextLevel,
};