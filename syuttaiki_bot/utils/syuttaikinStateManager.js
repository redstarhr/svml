// syuttaiki_bot/utils/syuttaikinStateManager.js

const { readJsonFromGCS, saveJsonToGCS } = require('../../common/gcs/gcsUtils');

const STATE_FILE_PATH = (guildId) => `data/${guildId}/syuttaikin_state.json`;

/**
 * Reads the current clock-in/out state from GCS.
 * @param {string} guildId
 * @returns {Promise<object>} The state object.
 */
async function readState(guildId) {
    try {
        const state = await readJsonFromGCS(STATE_FILE_PATH(guildId));
        return state || { users: {} };
    } catch (error) {
        if (error.code === 404) {
            return { users: {} }; // Return a default state if the file doesn't exist
        }
        console.error('❌ Error reading syuttaikin state from GCS:', error);
        throw error;
    }
}

async function writeState(guildId, state) {
  await saveJsonToGCS(STATE_FILE_PATH(guildId), state);
}

module.exports = {
  readState,
  writeState,
};