const { readJsonFromGCS, saveJsonToGCS } = require('@common/gcs/gcsUtils');
const logger = require('@common/logger');

const STATE_FILE_PATH = (guildId) => `data-svml/${guildId}/syuttaikin/state.json`;

const defaultState = {
  syuttaikin: {
    panelChannelId: null,
    logChannelId: null,
    castRoles: {
      quest: null,
      totsuna: null,
      trojan: null,
    },
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
    const state = await readJsonFromGCS(STATE_FILE_PATH(guildId));
    // Deep merge with default state to ensure all keys exist
    return {
      ...defaultState,
      ...state,
      syuttaikin: {
        ...defaultState.syuttaikin,
        ...(state?.syuttaikin || {}),
        castRoles: {
          ...defaultState.syuttaikin.castRoles,
          ...(state?.syuttaikin?.castRoles || {}),
        },
        arrivals: state?.syuttaikin?.arrivals || {},
        departures: state?.syuttaikin?.departures || {},
      },
    };
  } catch (error) {
    if (error.code === 404) {
      logger.info(`[StateManager] No state file found for guild ${guildId}. Returning default state.`);
      return defaultState;
    }
    logger.error(`[StateManager] Failed to read state for guild ${guildId}`, { error });
    // In case of other errors, return default state to prevent crashes
    return defaultState;
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

module.exports = { readState, writeState, defaultState };
