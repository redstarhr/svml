// hikkake_bot/index.js

// --- Commands ---
const hikkakeReactionAdmin = require('./commands/hikkakeReactionAdmin');
const hikkakeSetting = require('./commands/hikkakeSetting');
const hikkakeSetup = require('./commands/hikkakeSetup');

// --- Handlers ---
const hikkakeHandler = require('./handlers/hikkake_handler');

module.exports = {
  // Standardized export for slash commands
  commands: [hikkakeReactionAdmin, hikkakeSetting, hikkakeSetup].filter(Boolean),
  // Standardized export for component handlers
  handlers: [hikkakeHandler].filter(Boolean),
};
