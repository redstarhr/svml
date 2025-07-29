// hikkake_bot/utils/hikkakeStateManager.js
const { readJsonFromGCS, saveJsonToGCS } = require('@common/gcs/gcsUtils');

const HIKKAKE_STATE_PATH = (guildId) => `hikkake_bot/${guildId}/state.json`;

/**
 * Reads the state for a specific guild for the hikkake_bot.
 * @param {string} guildId The ID of the guild.
 * @returns {Promise<object|null>} The state object or null if not found.
 */
async function readState(guildId) {
  const statePath = HIKKAKE_STATE_PATH(guildId);
  return await readJsonFromGCS(statePath, {}); // Return empty object as fallback
}

/**
 * Writes the state for a specific guild for the hikkake_bot.
 * @param {string} guildId The ID of the guild.
 * @param {object} state The state object to save.
 * @returns {Promise<void>}
 */
async function writeState(guildId, state) {
  const statePath = HIKKAKE_STATE_PATH(guildId);
  await saveJsonToGCS(statePath, state);
}

/**
 * 現在対応中のスタッフ数を計算します。
 * @param {object} state 現在のサーバーの状態
 * @param {string} type 注文の種類 ('quest', 'tosu', 'horse')
 * @returns {{allocatedPura: number, allocatedKama: number}}
 */
function getActiveStaffAllocation(state, type) {
  const allocations = { allocatedPura: 0, allocatedKama: 0 };
  if (!state?.orders?.[type]) {
    return allocations;
  }

  for (const order of state.orders[type]) {
    // 対応が完了していない注文（statusやleaveTimestampがない）をアクティブとみなす
    if (!order.status && !order.leaveTimestamp) {
      allocations.allocatedPura += order.castPura || 0;
      allocations.allocatedKama += order.castKama || 0;
    }
  }
  return allocations;
}

module.exports = {
  readState,
  writeState,
  getActiveStaffAllocation,
};