const { readJsonFromGCS, saveJsonToGCS } = require('@common/gcs/gcsUtils');
const logger = require('@common/logger');

const STATE_FILE_PATH = (guildId) => `data-svml/${guildId}/syuttaikin/state.json`;

const defaultState = {
  syuttaikin: {
    panelChannelId: null,
    logChannelId: null,
    castRoles: [], // This should be an array of role IDs
    arrivalTimes: [],
    departureTimes: [],
    // The following are transient daily data, might be better to store separately
    // but for now, let's keep them here. They should be cleared daily.
    arrivals: {}, // { "20:00": [userId1, userId2], ... }
    departures: {}, // { "21:00": [userId1, userId2], ... }
  },
};

/**
 * Reads the state from GCS and merges it with the default state.
 * @param {string} guildId The ID of the guild.
 * @returns {Promise<object>} The state object.
 */
async function readState(guildId) {
  try {
    const savedState = await readJsonFromGCS(STATE_FILE_PATH(guildId));
    return {
      ...defaultState,
      ...savedState,
      syuttaikin: {
        ...defaultState.syuttaikin,
        ...(savedState?.syuttaikin || {}),
      },
    };
  } catch (error) {
    if (error.code === 404) {
      logger.info(`[StateManager] No state file found for guild ${guildId}. Returning default state.`);
      return JSON.parse(JSON.stringify(defaultState)); // Return a deep copy
    }
    logger.error(`[StateManager] Failed to read state for guild ${guildId}`, { error });
    // In case of other errors, return default state to prevent crashes
    return JSON.parse(JSON.stringify(defaultState)); // Return a deep copy
  }
}

/**
 * Writes the state to GCS.
 * @param {string} guildId The ID of the guild.
 * @param {object} state The state object to write.
 */
async function writeState(guildId, state) {
  await saveJsonToGCS(STATE_FILE_PATH(guildId), state);
}

/**
 * Reads the current state, applies an update function, and writes the new state back to GCS.
 * This provides a safe way to update nested state properties.
 * @param {string} guildId The ID of the guild.
 * @param {(currentState: object) => object} updateFn A function that takes the current state and returns the new state.
 */
async function updateState(guildId, updateFn) {
  const currentState = await readState(guildId);
  const newState = updateFn(currentState);
  await writeState(guildId, newState);
}

module.exports = { readState, writeState, updateState, defaultState };
