// syuttaiki_bot/index.js

// --- コマンド ---
const castPanel = require('./commands/cast-panel.js');
const castSettings = require('./commands/cast-settings.js');

// --- イベントハンドラ ---
const syuttaikinHandler = require('./syuttaikin_handler.js');

module.exports = {
  commands: [castPanel, castSettings],
  handlers: [syuttaikinHandler],
};