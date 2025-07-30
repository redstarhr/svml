const { Events } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const logger = require('@common/logger');

function loadMessageHandlers() {
  const handlers = [];
  const featureDirs = fs.readdirSync(path.join(__dirname, '..'), { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name.endsWith('_bot'))
    .map(dirent => dirent.name);

  for (const feature of featureDirs) {
    const featureIndexPath = path.join(__dirname, '..', feature, 'index.js');
    if (fs.existsSync(featureIndexPath)) {
      try {
        const featureModule = require(featureIndexPath);
        // 'messageHandlers' 配列のみを探索
        if (featureModule.messageHandlers && Array.isArray(featureModule.messageHandlers)) {
          handlers.push(...featureModule.messageHandlers);
        }
      } catch (error) {
        logger.error(`エラー: モジュール ${feature} からのメッセージハンドラ読み込みに失敗しました。`, { error });
      }
    }
  }
  return handlers;
}

const messageHandlers = loadMessageHandlers();
logger.info(`✅ ${messageHandlers.length}個のメッセージハンドラを動的に読み込みました。`);

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    for (const handler of messageHandlers) {
      // These are guaranteed to be message handlers now
      await handler.execute(message).catch(err => logger.error(`MessageCreateハンドラ実行中にエラー`, { error: err }));
    }
  },
};