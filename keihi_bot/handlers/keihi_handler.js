// keihi_bot/handlers/keihi_handler.js
const fs = require('node:fs');
const path = require('node:path');
const { Collection } = require('discord.js');
const logger = require('@common/logger');

// --- Dynamically load component handlers ---
const componentHandlers = new Collection();
const componentTypes = ['buttons', 'modals', 'selects'];

for (const type of componentTypes) {
  const componentPath = path.join(__dirname, '..', 'components', type);
  if (!fs.existsSync(componentPath)) continue;

  const componentFiles = fs.readdirSync(componentPath).filter(file => file.endsWith('.js'));
  for (const file of componentFiles) {
    const filePath = path.join(componentPath, file);
    const handler = require(filePath);
    if ('customId' in handler && 'handle' in handler) {
      componentHandlers.set(handler.customId, handler);
    } else {
      logger.warn(`[KeihiHandler] 警告: コンポーネントハンドラ ${filePath} に 'customId' または 'handle' がありません。`);
    }
  }
}

module.exports = {
  /**
   * Dispatches keihi_bot related interactions to the appropriate component handler.
   * @param {import('discord.js').Interaction} interaction
   * @returns {Promise<boolean>} True if the interaction was handled, false otherwise.
   */
  async execute(interaction) {
    if (!interaction.customId || !interaction.customId.startsWith('keihi_')) {
      return false;
    }

    // Find a handler that matches the customId prefix
    const handler = componentHandlers.find((_, key) => interaction.customId.startsWith(key));

    if (handler) {
      await handler.handle(interaction);
      return true;
    }

    return false; // No handler found for this customId
  }
};