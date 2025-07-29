const { readJsonFromGCS, saveJsonToGCS } = require('@common/gcs/gcsUtils');
const logger = require('@common/logger');

const getFilePath = (guildId) => `hikkake_bot/${guildId}/state.json`;
const defaultState = { orders: { quest: [], tosu: [], horse: [] }, staff: {}, panelMessages: {}, hikkakeLogThreads: {} };

/**
 * Reads the state for the hikkake_bot.
 * If no state exists, returns a default initial state object.
 * @param {string} guildId The ID of the guild.
 * @returns {Promise<object>} The state object, guaranteed to not be null.
 */
async function readState(guildId) {
  const filePath = getFilePath(guildId);
  try {
    const state = await readJsonFromGCS(filePath);
    // Ensure a valid object is returned, merging with default if the file is empty or partially formed.
    return state ? { ...defaultState, ...state } : defaultState;
  } catch (error) {
    logger.error(`[HikkakeStateManager] 状態の読み込みに失敗しました (Guild: ${guildId})。デフォルト値を返します。`, { error });
    // Return a default state on error to prevent crashes.
    return defaultState;
  }
}

async function writeState(guildId, state) {
  const filePath = getFilePath(guildId);
  await saveJsonToGCS(filePath, state);
}

module.exports = { readState, writeState };