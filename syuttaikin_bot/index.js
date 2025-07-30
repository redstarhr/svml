// syuttaiki_bot/index.js

// --- コマンド ---
const castArrivalPanel = require('./commands/cast-arrival-panel.js');
const castDeparturePanel = require('./commands/cast-departure-panel.js');
const castSettings = require('./commands/cast-settings.js');

// --- イベントハンドラ ---
const syuttaikinHandler = require('./handlers/syuttaikin_handler.js');

module.exports = {
  commands: [castArrivalPanel, castDeparturePanel, castSettings],
  handlers: [syuttaikinHandler],
};