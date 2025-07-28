// uriage_bot/index.js

/**
 * uriage_botのユーティリティとコマンドモジュールをまとめてエクスポート
 */

// Commands
const uriageHoukoku = require('./commands/uriage_houkoku');
const uriageConfig = require('./commands/uriage_config');
const uriageCsv = require('./commands/uriage_csv');

// Utils (Interaction Handlers)
const uriageButtons = require('./utils/uriage_buttons');
const uriageModals = require('./utils/uriage_modals');

/**
 * エクスポートするモジュールを集約
 * Botのメインファイルから簡単にインポートできるようにする
 */
module.exports = {
  uriageHoukoku,
  uriageConfig,
  uriageCsv,
  uriageButtons,
  uriageModals,
};