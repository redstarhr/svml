// e:\共有フォルダ\svml_zimu_bot-main\svml_zimu_bot-main\uriage_bot\index.js

/**
 * uriage_botのコマンドとイベントハンドラモジュールをまとめてエクスポートします。
 */

// --- コマンド ---
const uriageConfig = require('./commands/uriage_config.js');
const uriageHoukoku = require('./commands/uriage_houkoku.js');

// --- イベントハンドラ ---
const uriageHandler = require('./uriage_handler.js');

module.exports = {
  uriageConfig, uriageHoukoku, uriageHandler
};