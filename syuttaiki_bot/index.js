// syuttaiki_bot/index.js
/**
 * syuttaiki_botのコマンドとイベントハンドラモジュールをまとめてエクスポートします。
 * プロジェクトルートの index.js と events/interactionCreate.js から利用されます。
 */

// --- コマンド ---
const castPanel = require('./commands/cast-panel.js');
const castSettings = require('./commands/cast-settings.js');

// --- イベントハンドラ ---
// interactionCreate.js から呼び出される
const syuttaikinHandler = require('./handlers/syuttaikinHandler');
const castSettingsHandler = require('./handlers/castSettingsHandler.js');

module.exports = {
  // コマンドの配列
  commands: [castPanel, castSettings],
  // ハンドラの配列
  handlers: [syuttaikinHandler, castSettingsHandler],
};