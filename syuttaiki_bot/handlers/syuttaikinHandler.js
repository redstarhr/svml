// syuttaiki_bot/handlers/syuttaikinHandler.js
const fs = require('node:fs');
const path = require('node:path');
const { Collection } = require('discord.js');
const logger = require('@common/logger');

// --- 動的にコンポーネントハンドラを読み込む ---
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
      logger.warn(`[SyuttaikinHandler] 警告: コンポーネントハンドラ ${filePath} に 'customId' または 'handle' がありません。`);
    }
  }
}

module.exports = {
  async execute(interaction) {
    if (!interaction.customId) return false;

    // Find a handler that matches the customId prefix
    const handler = componentHandlers.find((_, key) => interaction.customId.startsWith(key));

    if (handler) {
      await handler.handle(interaction);
      return true;
    }

    return false;
  },
};
