// keihi_bot/utils/keihiStateManager.js
const { readJsonFromGCS, saveJsonToGCS } = require('@common/gcs/gcsUtils');
const logger = require('@common/logger');

const getFilePath = (guildId) => `keihi_bot/${guildId}/state.json`;
const defaultState = { expenses: [] };

/**
 * Reads the state for the keihi_bot.
 * If no state exists, returns a default initial state object.
 * @param {string} guildId The ID of the guild.
 * @returns {Promise<object>} The state object, guaranteed to not be null.
 */
async function readState(guildId) {
  try {
    const state = await readJsonFromGCS(getFilePath(guildId), defaultState);
    // Ensure a valid object is returned, merging with default if the file is empty or partially formed.
    return { ...defaultState, ...state };
  } catch (error) {
    logger.error(`[KeihiStateManager] 状態の読み込みに失敗しました (Guild: ${guildId})。デフォルト値を返します。`, { error });
    // Return a default state on error to prevent crashes.
    return defaultState;
  }
}

/**
 * Atomically reads, modifies, and writes the state.
 * @param {string} guildId The ID of the guild.
 * @param {(state: object) => object} updateFn A function that takes the current state and returns the new state.
 * @returns {Promise<void>}
 */
async function updateState(guildId, updateFn) {
    const currentState = await readState(guildId);
    const newState = updateFn(currentState);
    await saveJsonToGCS(getFilePath(guildId), newState);
}


module.exports = { readState, updateState };