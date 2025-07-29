// uriage_bot/handlers/uriage_handler.js
const buttonHandler = require('../utils/uriage_buttons.js');
const modalHandler = require('../utils/uriage_modals.js');
const configHandler = require('./uriage_config_handler.js');

module.exports = {
  async execute(interaction, client) {
    // Each handler returns true if it processed the interaction
    if (await configHandler.execute(interaction, client)) return true;
    if (await buttonHandler.execute(interaction, client)) return true;
    if (await modalHandler.execute(interaction, client)) return true;
    
    // Return false if no handler in this bot processed the interaction
    return false;
  },
};