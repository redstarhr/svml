// syuttaiki_bot/utils/castShift/castStateManager.js
const { readJsonFromGCS, saveJsonToGCS } = require('../../../common/gcs/gcsUtils');

const BASE_PATH = 'data-svml';

/**
 * GCS上のキャスト出退勤状態データのパスを作成
 * @param {string} guildId 
 * @param {string} dateStr 例: '2025-07-29'
 * @returns {string}
 */
function getDataPath(guildId, dateStr) {
  return [BASE_PATH, guildId, 'キャスト出退勤', `${dateStr}_出退勤.json`].join('/');
}

/**
 * キャストの出退勤状態を保存
 * @param {string} guildId 
 * @param {string} dateStr 例: '2025-07-29'
 * @param {Object} state 保存する状態オブジェクト
 */
async function saveCastState(guildId, dateStr, state) {
  const filePath = getDataPath(guildId, dateStr);
  await saveJsonToGCS(filePath, state);
}

/**
 * キャストの出退勤状態を読み込み
 * @param {string} guildId 
 * @param {string} dateStr 例: '2025-07-29'
 * @returns {Object|null} 状態オブジェクト or null
 */
async function loadCastState(guildId, dateStr) {
  const filePath = getDataPath(guildId, dateStr);
  return await readJsonFromGCS(filePath);
}

module.exports = {
  saveCastState,
  loadCastState,
};
