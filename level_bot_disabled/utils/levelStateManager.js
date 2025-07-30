// level_bot/utils/levelStateManager.js
const { readJsonFromGCS, saveJsonToGCS } = require('@common/gcs/gcsUtils');

const CONFIG_PATH = (guildId) => `level_bot/${guildId}/config.json`;

/**
 * Reads the configuration for the level_bot.
 * @param {string} guildId The ID of the guild.
 * @returns {Promise<object>} The config object.
 */
async function readConfig(guildId) {
  const defaultConfig = {
    enabled: true,
    xpPerMessage: 5,
    cooldownSec: 30,
    notifyChannelId: null,
    disabledRoles: [],
    levelStamps: [],
  };
  const config = await readJsonFromGCS(CONFIG_PATH(guildId), defaultConfig);
  // Ensure all default keys are present
  return { ...defaultConfig, ...config };
}

/**
 * Writes the configuration for the level_bot.
 * @param {string} guildId The ID of the guild.
 * @param {object} config The config object to save.
 * @returns {Promise<void>}
 */
async function writeConfig(guildId, config) {
  await saveJsonToGCS(CONFIG_PATH(guildId), config);
}

module.exports = {
  readConfig,
  writeConfig,
};