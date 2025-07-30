// level_bot/index.js

// --- Commands ---
const levelConfig = require('./commands/level-config.js');

// --- イベントハンドラ ---
const componentHandler = require('./handlers/componentHandler.js');
const messageCreateHandler = require('./handlers/messageCreateHandler.js');

module.exports = {
  commands: [levelConfig].filter(Boolean),
  componentHandlers: [componentHandler].filter(Boolean),
  messageHandlers: [messageCreateHandler].filter(Boolean),
};