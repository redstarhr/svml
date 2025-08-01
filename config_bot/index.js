// config_bot/index.js

const embedCommand = require('./commands/embed.js');
const embedHandler = require('./handlers/embedHandler.js');

/**
 * 汎用設定機能モジュール
 */
module.exports = {
  commands: [embedCommand],
  componentHandlers: [embedHandler],
};