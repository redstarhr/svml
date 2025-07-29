// keihi_bot/index.js

// --- Commands ---
const keihiConfig = require('./commands/keihi_config.js');
const keihiEmbed = require('./commands/keihi_embed.js');
const keihiRireki = require('./commands/keihi_rireki.js');
const keihiSetti = require('./commands/keihi_setti.js');

// --- Handlers ---
const keihiHandler = require('./handlers/keihi_handler.js');

module.exports = {
  // Standardized export for slash commands
  commands: [keihiConfig, keihiEmbed, keihiRireki, keihiSetti].filter(Boolean),
  // Standardized export for component handlers
  handlers: [keihiHandler].filter(Boolean),
};