const fs = require('node:fs').promises;
const path = require('node:path');
const logger = require('@common/logger');

const DATA_DIR = path.join(__dirname, '..', '..', 'data-svml');

/**
 * Ensures the directory for a given guild exists.
 * @param {string} guildId
 * @returns {Promise<string>} The path to the level config directory.
 */
async function ensureLevelDir(guildId) {
  const levelDir = path.join(DATA_DIR, guildId, 'level');
  await fs.mkdir(levelDir, { recursive: true });
  return levelDir;
}

/**
 * Reads the level configuration for a guild.
 * @param {string} guildId
 * @returns {Promise<object>} The level configuration object.
 */
async function getLevelConfig(guildId) {
  const levelDir = await ensureLevelDir(guildId);
  const configPath = path.join(levelDir, 'config.json');
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Default config if file doesn't exist
      logger.info(`Level config for guild ${guildId} not found. Creating default.`);
      return {
        xpPerMessage: { min: 15, max: 25 },
        cooldownSeconds: 60,
        levelUpChannelId: null,
        rewards: [], // { level: 10, roleId: '...' }
      };
    }
    logger.error(`Failed to read level config for guild ${guildId}`, { error });
    throw error;
  }
}

/**
 * Writes the level configuration for a guild.
 * @param {string} guildId
 * @param {object} configData
 * @returns {Promise<void>}
 */
async function setLevelConfig(guildId, configData) {
  const levelDir = await ensureLevelDir(guildId);
  const configPath = path.join(levelDir, 'config.json');
  await fs.writeFile(configPath, JSON.stringify(configData, null, 2), 'utf-8');
  logger.info(`Successfully saved level config for guild ${guildId}.`);
}

module.exports = { getLevelConfig, setLevelConfig };