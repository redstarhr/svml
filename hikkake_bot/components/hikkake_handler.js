// hikkake_bot/components/hikkake_handler.js
const fs = require('node:fs');
const path = require('node:path');
const { Collection } = require('discord.js');

function getJsFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getJsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

const collections = {
  buttons: new Collection(),
  modals: new Collection(),
  selects: new Collection(),
};

const componentTypes = ['buttons', 'modals', 'selects'];
for (const type of componentTypes) {
  const componentPath = path.join(__dirname, type);
  const componentFiles = getJsFiles(componentPath);
  for (const file of componentFiles) {
    const handler = require(file);
    if (handler.customId) collections[type].set(handler.customId, handler);
  }
}

async function handleComponent(interaction, collection, client) {
  for (const [customId, handler] of collection.entries()) {
    const isMatch = (typeof customId === 'string' && customId === interaction.customId) || (customId instanceof RegExp && customId.test(interaction.customId));
    if (isMatch) {
      await handler.execute(interaction, client);
      return true;
    }
  }
  return false;
}

module.exports = {
  async execute(interaction, client) {
    if (interaction.isButton()) return await handleComponent(interaction, collections.buttons, client);
    if (interaction.isModalSubmit()) return await handleComponent(interaction, collections.modals, client);
    if (interaction.isAnySelectMenu()) return await handleComponent(interaction, collections.selects, client);
    return false;
  },
};