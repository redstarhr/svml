// index.js

require('module-alias/register');
require('dotenv').config();
const fs = require('node:fs');
const path = require('path');
const { Collection, Events } = require('discord.js');
const { client } = require('./client');
const logger = require('@common/logger');

// --- 必須環境変数チェック ---
const requiredEnv = ['DISCORD_TOKEN', 'CLIENT_ID'];
for (const envVar of requiredEnv) {
  if (!process.env[envVar]) {
    logger.error(`❌ 致命的エラー: 環境変数 ${envVar} が .env に設定されていません。`);
    process.exit(1);
  }
}
// 開発環境ではGUILD_IDも必須
if (process.env.NODE_ENV === 'development' && !process.env.GUILD_ID) {
    logger.error(`❌ 致命的エラー: 開発環境では環境変数 GUILD_ID が .env に設定されている必要があります。`);
    process.exit(1);
}

logger.info(`Google認証情報を使用中: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);

// プロジェクトルートにあるディレクトリを機能モジュールとして自動的に探索
// 'common', 'events' などの共通ディレクトリや '.' で始まるディレクトリは除外
const featureDirs = fs.readdirSync(__dirname, { withFileTypes: true })
  .filter(dirent => {
    if (!dirent.isDirectory()) return false;
    const excludedDirs = ['common', 'events', 'node_modules'];
    if (excludedDirs.includes(dirent.name) || dirent.name.startsWith('.')) return false;
    // ディレクトリ内に 'index.js' が存在するかどうかで判断
    return fs.existsSync(path.join(__dirname, dirent.name, 'index.js'));
  })
  .map(dirent => dirent.name);

logger.info(`🔍 ${featureDirs.length}個の機能ディレクトリを検出: ${featureDirs.join(', ')}`);
for (const feature of featureDirs) {
  const featureIndexPath = path.join(__dirname, feature, 'index.js');
  if (fs.existsSync(featureIndexPath)) {
    try {
      const featureModule = require(featureIndexPath);

      // コマンドの読み込み
      if (featureModule.commands && Array.isArray(featureModule.commands)) {
        for (const command of featureModule.commands) {
          if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
          } else {
            logger.warn(`[${feature}] 警告: コマンドに 'data' または 'execute' がありません。`);
          }
        }
      }

      // コンポーネントハンドラの読み込み (Buttons, Selects, etc.)
      if (featureModule.componentHandlers && Array.isArray(featureModule.componentHandlers)) {
        const handlersPath = path.join(__dirname, feature, 'handlers');
        if (fs.existsSync(handlersPath)) {
          const handlerFiles = fs.readdirSync(handlersPath).filter(file => file.endsWith('.js'));
          for (const handler of featureModule.componentHandlers) {
            if (handler && typeof handler.execute === 'function') {
              // Find the file that exports this handler object to attach its path for logging
              const handlerFileName = handlerFiles.find(file => require(path.join(handlersPath, file)) === handler);
              handler.filePath = handlerFileName ? path.join(feature, 'handlers', handlerFileName) : '不明なファイル';
              client.componentHandlers.push(handler);
            } else {
              logger.warn(`[${feature}] 警告: コンポーネントハンドラに 'execute' がありません。`);
            }
          }
        }
      }

      // メッセージハンドラの読み込み
      if (featureModule.messageHandlers && Array.isArray(featureModule.messageHandlers)) {
        for (const handler of featureModule.messageHandlers) {
          if ('execute' in handler) {
            client.messageHandlers.push(handler);
          } else {
            logger.warn(`[${feature}] 警告: メッセージハンドラに 'execute' がありません。`);
          }
        }
      }

    } catch (error) {
      logger.error(`エラー: モジュール ${feature} の読み込みに失敗しました。詳細: ${error.stack}`);
    }
  }
}
logger.info(`✅ ${client.commands.size}個のスラッシュコマンドを正常に読み込みました。`);
logger.info(`✅ ${client.componentHandlers.length}個のコンポーネントハンドラを動的に読み込みました。`);
logger.info(`✅ ${client.messageHandlers.length}個のメッセージハンドラを動的に読み込みました。`);

// --- イベントハンドラの読み込み ---
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}
logger.info(`✅ ${eventFiles.length}個のイベントハンドラを正常に読み込みました。`);

// --- Discord Bot ログイン ---
client.login(process.env.DISCORD_TOKEN);
