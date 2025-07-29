// syuttaiki_bot/index.js
/**
 * syuttaiki_botのコマンドとイベントハンドラモジュールをまとめてエクスポートします。
 */

// --- コマンド ---
const syuttaikinPanel = require('./commands/syuttaikin_panel.js');
const castShiftSetup = require('./commands/castShiftSetup.js');
const castShiftSettings = require('./commands/castShiftSettings.js');

// --- イベントハンドラ ---
const syuttaikinHandler = require('./syuttaikinHandler.js');
const castShiftHandler = require('./castShiftHandler.js');

module.exports = {
  syuttaikinHandler,
  castShiftHandler,
  syuttaikinPanel,
  castShiftSetup,
  castShiftSettings,
};