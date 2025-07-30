const fs = require('node:fs').promises;
const path = require('node:path');
const logger = require('@common/logger');

const DATA_DIR = path.join(__dirname, '..', '..', 'data-svml');

/**
 * Gets the path to the guild's user data file.
 * @param {string} guildId
 * @returns {string}
 */
function getUserDataPath(guildId) {
  return path.join(DATA_DIR, guildId, 'users.json');
}

/**
 * Reads the guild's user data.
 * @param {string} guildId
 * @returns {Promise<object>} The user data object, keyed by user ID.
 */
async function getUserData(guildId) {
  const dataPath = getUserDataPath(guildId);
  try {
    const data = await fs.readFile(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {}; // Return empty object if file doesn't exist
    }
    logger.error(`Failed to read user data for guild ${guildId}`, { error });
    throw error;
  }
}

/**
 * Writes the guild's user data.
 * @param {string} guildId
 * @param {object} userData
 * @returns {Promise<void>}
 */
async function setUserData(guildId, userData)