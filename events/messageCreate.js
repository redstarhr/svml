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
        if (featureModule.handlers && Array.isArray(featureModule.handlers)) {
          handlers.push(...featureModule.handlers);
        }
      } catch (error) {
        logger.error(`エラー: モジュール ${feature} からのハンドラ読み込みに失敗しました。`, { error });
      }
    }
  }
  return handlers;
}

const messageHandlers = loadMessageHandlers();

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    // 現状はlevel_handlerのみが対象だが、将来的な拡張のためにループ処理にしておく
    for (const handler of messageHandlers) {
      // messageCreateを処理するハンドラはinteractionを引数に取らないので、直接messageを渡す
      if (handler.execute.length === 1) { // 引数がmessageのみのハンドラを対象
        await handler.execute(message).catch(err => logger.error(`MessageCreateハンドラ実行中にエラー`, { error: err }));
      }
    }
  },
};