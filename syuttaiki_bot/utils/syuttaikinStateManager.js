// syuttaiki_bot/utils/syuttaikinStateManager.js

const { readJsonFromGCS, saveJsonToGCS } = require('../../common/gcs/gcsUtils.js');

/**
 * GCSの保存パスを返す
 * @param {string} guildId
 * @param {string} [date] YYYY-MM-DD形式の日付（任意）
 * @returns {string}
 */
const getFilePath = (guildId, date) => {
  if (date) {
    return `syuttaiki_bot/${guildId}/state_${date}.json`;
  }
  return `syuttaiki_bot/${guildId}/state.json`;
};

/**
 * 出退勤状態をGCSから読み込む
 * @param {string} guildId
 * @param {string} [date] 任意の日付（YYYY-MM-DD）
 * @returns {Promise<object>} 状態オブジェクト。存在しなければ空初期値
 */
async function readState(guildId, date) {
  try {
    const filePath = getFilePath(guildId, date);
    const state = await readJsonFromGCS(filePath);
    return state ?? { users: {} };
  } catch (error) {
    console.error(`[syuttaikinStateManager.readState] Error reading state for guildId=${guildId}, date=${date}`, error);
    throw error;
  }
}

/**
 * 出退勤状態をGCSに書き込む
 * @param {string} guildId
 * @param {object} state 保存する状態オブジェクト
 * @param {string} [date] 任意の日付（YYYY-MM-DD）
 * @returns {Promise<boolean>} 書き込み成功時true
 */
async function writeState(guildId, state, date) {
  try {
    const filePath = getFilePath(guildId, date);
    await saveJsonToGCS(filePath, state);
    return true;
  } catch (error) {
    console.error(`[syuttaikinStateManager.writeState] Error writing state for guildId=${guildId}, date=${date}`, error);
    throw error;
  }
}

module.exports = {
  readState,
  writeState,
};
