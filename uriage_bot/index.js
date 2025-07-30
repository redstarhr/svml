// e:\共有フォルダ\svml_zimu_bot-main\svml_zimu_bot-main\uriage_bot\index.js

// --- コマンド ---
const uriageConfig = require('./commands/uriage_config.js');
const uriageHoukoku = require('./commands/uriage_houkoku.js');
const uriageCsv = require('./commands/uriage_csv.js');

// --- イベントハンドラ ---
const uriageHandler = require('./handlers/uriage_handler.js');
const uriageconfigHandler = require('./handlers/uriage_config_handler.js');

module.exports = {
  commands: [uriageConfig, uriageHoukoku, uriageCsv],
  // interactionCreate.jsが期待するハンドラの配列
  handlers: [uriageHandler].filter(Boolean),
};