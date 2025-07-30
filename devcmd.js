// devcmd.js
require('dotenv').config();
require('module-alias/register');
const fs = require('node:fs');
const path = require('node:path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');
const logger = require('@common/logger');

// --- 必須環境変数チェック ---
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  logger.error('❌ 致命的エラー: 開発デプロイには DISCORD_TOKEN, CLIENT_ID, GUILD_ID を .env に設定する必要があります。');
  process.exit(1);
}

const commands = [];
const commandNames = new Map(); // Use Map to store feature name for better error reporting

// --- コマンドデータの読み込み (index.jsとロジックを統一) ---
const featureDirs = fs.readdirSync(__dirname, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory() && (dirent.name.endsWith('_bot') || dirent.name === 'syuttaikin'))
  .map(dirent => dirent.name);

logger.info(`[DevDeploy] 🔍 ${featureDirs.length}個の機能ディレクトリを検出: ${featureDirs.join(', ')}`);
for (const feature of featureDirs) {
  const featureIndexPath = path.join(__dirname, feature, 'index.js');
  if (fs.existsSync(featureIndexPath)) {
    try {
      const featureModule = require(featureIndexPath);
      if (featureModule.commands && Array.isArray(featureModule.commands)) {
        for (const command of featureModule.commands) {
          if ('data' in command && 'execute' in command) {
            const commandName = command.data.name;
            if (commandNames.has(commandName)) {
              logger.error(`[DevDeploy] ❌ 重複エラー: コマンド名 "${commandName}" が検出されました。`);
              logger.error(`    --> 既存のモジュール: ${commandNames.get(commandName)}`);
              logger.error(`    --> 競合するモジュール: ${feature}`);
              continue;
            }
            commandNames.set(commandName, feature);
            commands.push(command.data.toJSON());
          } else {
            logger.warn(`[DevDeploy] 警告: モジュール ${feature} のコマンドオブジェクトに 'data' または 'execute' がありません。`);
          }
        }
      }
    } catch (error) {
      logger.error(`[DevDeploy] ❌ エラー: モジュール ${feature} からのコマンド読み込みに失敗しました。`, { error });
    }
  }
}

// --- RESTインスタンスの作成とコマンドの登録 ---
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    logger.info(`[DevDeploy] 🚀 ${commands.length}個のアプリケーションコマンドを開発サーバーに登録しています...`);
    const data = await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    logger.info(`[DevDeploy] ✅ ${data.length}個のコマンドをサーバー(ID: ${GUILD_ID})に正常に登録しました。`);
  } catch (error) {
    logger.error('[DevDeploy] ❌ コマンドの登録中にエラーが発生しました:', { error });
  }
})();