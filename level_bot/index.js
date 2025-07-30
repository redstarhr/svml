// level_bot/index.js

// --- Commands ---
const levelConfig = require('@root/level_bot/commands/level-config.js');

// --- イベントハンドラ ---
const componentHandler = require('@root/level_bot/handlers/componentHandler.js');
const messageCreateHandler = require('@root/level_bot/handlers/messageCreateHandler.js');

module.exports = {
  commands: [levelConfig].filter(Boolean),
  componentHandlers: [componentHandler].filter(Boolean),
  messageHandlers: [messageCreateHandler].filter(Boolean),
};