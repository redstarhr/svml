// e:\共有フォルダ\svml_zimu_bot-main\svml_zimu_bot-main\uriage_bot\index.js

// --- コマンド ---
const uriageConfig = require('./commands/uriage_config.js');
const uriageHoukoku = require('./commands/uriage_houkoku.js');
const uriageCsv = require('./commands/uriage_csv.js');

// --- イベントハンドラ ---
const uriageHandler = require('./handlers/uriageHandler.js');

module.exports = {
  commands: [uriageConfig, uriageHoukoku, uriageCsv],
  // コンポーネント操作を処理するハンドラ
  componentHandlers: [uriageHandler],
};