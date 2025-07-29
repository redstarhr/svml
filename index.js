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

// --- コマンドハンドラの読み込み ---
client.commands = new Collection();
// プロジェクトルートにある `_bot` で終わるディレクトリを自動的に探索
const featureDirs = fs.readdirSync(__dirname, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory() && dirent.name.endsWith('_bot'))
  .map(dirent => dirent.name);

logger.info(`🔍 ${featureDirs.length}個の機能ディレクトリを検出: ${featureDirs.join(', ')}`);
for (const feature of featureDirs) {
  const featureIndexPath = path.join(__dirname, feature, 'index.js');
  if (fs.existsSync(featureIndexPath)) {
    try {
      const featureModule = require(featureIndexPath);
      if (featureModule.commands && Array.isArray(featureModule.commands)) {
        for (const command of featureModule.commands) {
          if ('data' in command && 'execute' in command) {
            const commandName = command.data.name;
            if (client.commands.has(commandName)) {
              logger.error(`❌ 重複エラー: コマンド名 "${commandName}" が検出されました。モジュール "${feature}" からのバージョンはスキップされます。`);
              continue;
            }
            client.commands.set(commandName, command);
          } else {
            logger.warn(`警告: モジュール ${feature} のコマンドオブジェクトに 'data' または 'execute' がありません。`);
          }
        }
      }
    } catch (error) {
      logger.error(`エラー: モジュール ${feature} からのコマンド読み込みに失敗しました。`, { error });
    }
  }
}
logger.info(`✅ ${client.commands.size}個のスラッシュコマンドを正常に読み込みました。`);

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
