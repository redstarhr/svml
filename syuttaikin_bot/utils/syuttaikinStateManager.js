// syuttaikin_bot/utils/syuttaikinStateManager.js
const StateManager = require('@common/utils/stateManager');

const STATE_FILE_PATH = (guildId) => `data-svml/${guildId}/syuttaikin/state.json`;

const defaultState = {
  syuttaikin: {
    panelChannelId: null,
    logChannelId: null,
    castRoles: [], // ロールIDの配列
    arrivalTimes: [], // 出勤時間の文字列配列（例: ['20:00', '21:00']）
    departureTimes: [], // 退勤時間の文字列配列
    arrivals: {}, // { "20:00": [userId1, userId2], ... } 日ごとの一時記録用
    departures: {}, // { "21:00": [userId1, userId2], ... } 日ごとの一時記録用
  },
};

const manager = new StateManager(STATE_FILE_PATH, defaultState, 'syuttaikin');

module.exports = {
  readState: (guildId) => manager.readState(guildId),
  writeState: (guildId, state) => manager.writeState(guildId, state),
  updateState: (guildId, updateFn) => manager.updateState(guildId, updateFn),
  defaultState,
};
