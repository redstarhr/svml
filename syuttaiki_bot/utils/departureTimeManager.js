// syuttaiki_bot/utils/departureTimeManager.js

const castStateManager = require('./castShift/castStateManager');

/**
 * 指定日の退勤データを取得
 * @param {string} guildId
 * @param {string} date
 * @returns {Promise<Object>} 退勤データ
 */
async function getDepartureData(guildId, date) {
  const state = await castStateManager.loadState(guildId, date);
  return state.departure || {};
}

/**
 * 退勤データを保存
 * @param {string} guildId
 * @param {string} date
 * @param {Object} newDepartureData
 * @returns {Promise<void>}
 */
async function setDepartureData(guildId, date, newDepartureData) {
  const state = await castStateManager.loadState(guildId, date);
  state.departure = newDepartureData;
  await castStateManager.saveState(guildId, date, state);
}

/**
 * 退勤時間にユーザーを追加
 * @param {string} guildId
 * @param {string} date
 * @param {string} time
 * @param {string} userId
 */
async function addUserToDepartureTime(guildId, date, time, userId) {
  const data = await getDepartureData(guildId, date);
  if (!data[time]) data[time] = [];
  if (!data[time].includes(userId)) data[time].push(userId);
  await setDepartureData(guildId, date, data);
}

/**
 * 退勤時間からユーザーを削除
 * @param {string} guildId
 * @param {string} date
 * @param {string} time
 * @param {string} userId
 */
async function removeUserFromDepartureTime(guildId, date, time, userId) {
  const data = await getDepartureData(guildId, date);
  if (data[time]) {
    data[time] = data[time].filter(id => id !== userId);
    if (data[time].length === 0) delete data[time];
  }
  await setDepartureData(guildId, date, data);
}

module.exports = {
  getDepartureData,
  setDepartureData,
  addUserToDepartureTime,
  removeUserFromDepartureTime,
};
