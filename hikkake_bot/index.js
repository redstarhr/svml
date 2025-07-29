// hikkake_bot/index.js

/**
 * hikkake_botのコマンドとイベントハンドラモジュールをまとめてエクスポートします。
 * これにより、Botのメインファイルから各機能を一元的に管理しやすくなります。
 */

// --- コマンド ---
const hikkakeReactionAdmin = require('./commands/hikkakeReactionAdmin.js');
const hikkakeSetting = require('./commands/hikkakeSetting.js');
const hikkakeSetup = require('./commands/hikkakeSetup.js');

// --- イベントハンドラ ---
const hikkakeHandler = require('./handlers/hikkake_handler.js');

module.exports = {
  hikkakeReactionAdmin,
  hikkakeSetting,
  hikkakeSetup,
  hikkakeHandler,
};
