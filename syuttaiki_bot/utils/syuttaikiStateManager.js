// syuttaiki_bot/utils/syuttaikiStateManager.js
const { readJsonFromGCS, saveJsonToGCS } = require('@common/gcs/gcsUtils');
const logger = require('@common/logger');

const STATE_PATH = (guildId) => `syuttaiki_bot/${guildId}/state.json`;

/**
 * Reads the state for a specific guild for the syuttaiki_bot.
 * @param {string} guildId The ID of the guild.
 * @returns {Promise<object>} The state object. Returns empty object if not found.
 */
async function readState(guildId) {
  const defaultState = {
    syuttaikin: {
      castRoles: [],
      arrivalTimes: ['20:00', '20:30', '21:00'],
      panelChannelId: null,
      logChannelId: null,
      arrivals: {},
    },
    dailyRecords: {},
  };
  const statePath = STATE_PATH(guildId);
  const state = await readJsonFromGCS(statePath, defaultState);
  // ネストされたオブジェクトもデフォルト値で確実に初期化する
  const mergedState = { ...defaultState, ...state };
  mergedState.syuttaikin = { ...defaultState.syuttaikin, ...state.syuttaikin };
  return mergedState;
}

/**
 * Writes the state for a specific guild for the syuttaiki_bot.
 * @param {string} guildId The ID of the guild.
 * @param {object} state The state object to save.
 * @returns {Promise<void>}
 */
async function writeState(guildId, state) {
  const statePath = STATE_PATH(guildId);
  await saveJsonToGCS(statePath, state);
}

module.exports = {
  readState,
  writeState,
};
