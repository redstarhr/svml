// e:\共有フォルダ\svml_zimu_bot-main\svml_zimu_bot-main\uriage_bot\index.js

/**
 * uriage_botのコマンドとイベントハンドラモジュールをまとめてエクスポートします。
 */

// --- コマンド ---
const uriageConfig = require('./commands/uriage_config.js');
const uriageHoukoku = require('./commands/uriage_houkoku.js');
const uriageCsv = require('./commands/uriage_csv.js');

// --- イベントハンドラ ---
const uriageHandler = require('./handler/uriage_handler.js');

module.exports = {
  // コマンド
  uriageConfig,
  uriageHoukoku,
  uriageCsv,
  // ハンドラ
  uriageHandler,
};