// syuttaiki_bot/handlers/castSettingsHandler.js
const fs = require('node:fs');
const path = require('node:path');
const { Collection } = require('discord.js');
const logger = require('@common/logger');

const componentHandlers = new Collection();
const componentTypes = ['buttons', 'modals', 'selects'];

for (const type of componentTypes) {
  // Look inside the 'settings' subdirectory for these handlers
  const componentPath = path.join(__dirname, '..', 'components', 'settings', type);
  if (!fs.existsSync(componentPath)) continue;

  const componentFiles = fs.readdirSync(componentPath).filter(file => file.endsWith('.js'));
  for (const file of componentFiles) {
    const filePath = path.join(componentPath, file);
    const handler = require(filePath);
    if ('customId' in handler && 'handle' in handler) {
      componentHandlers.set(handler.customId, handler);
    } else {
      logger.warn(`[CastSettingsHandler] 警告: コンポーネントハンドラ ${filePath} に 'customId' または 'handle' がありません。`);
    }
  }
}

module.exports = {
  async execute(interaction) {
    if (!interaction.customId || !interaction.customId.startsWith('setting_')) {
      return false;
    }

    const handler = componentHandlers.get(interaction.customId);
    if (handler) {
      await handler.handle(interaction);
      return true;
    }

    return false;
  }
};