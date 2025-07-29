// level_bot/index.js
/**
 * level_botのコマンドとイベントハンドラモジュールをまとめてエクスポートします。
 */

// --- Commands ---
const levelConfig = require('./commands/level-config');
const levelCheck = require('./commands/level-check');

// --- イベントハンドラ ---
const levelHandler = require('./handlers/level_handler.js');

module.exports = {
  commands: [levelConfig, levelCheck].filter(Boolean),
  handlers: [levelHandler],
};