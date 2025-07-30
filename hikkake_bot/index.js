// hikkake_bot/index.js

// --- Commands ---
const hikkakeReactionAdmin = require('@root/hikkake_bot/commands/hikkakeReactionAdmin');
const hikkakeSetting = require('@root/hikkake_bot/commands/hikkakeSetting');
const hikkakeSetup = require('@root/hikkake_bot/commands/hikkakeSetup');

// --- Handlers ---
const hikkakeHandler = require('@root/hikkake_bot/handlers/hikkake_handler');

module.exports = {
  // Standardized export for slash commands
  commands: [hikkakeReactionAdmin, hikkakeSetting, hikkakeSetup].filter(Boolean),
  // コンポーネント操作を処理するハンドラ
  componentHandlers: [hikkakeHandler].filter(Boolean),
};
