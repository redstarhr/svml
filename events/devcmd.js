require('dotenv').config();
require('module-alias/register');
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const logger = require('@common/logger');

// --- 引数解析 ---
const isGlobal = process.argv.includes('--global');
const isClear = process.argv.includes('--clear');

// --- 必須環境変数チェック ---
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  logger.error('[DevDeploy] ❌ 致命的エラー: DISCORD_TOKEN, CLIENT_ID を .env に設定する必要があります。');
  process.exit(1);
}
// グローバル登録でない場合、GUILD_IDも必須
if (!isGlobal && !GUILD_ID) {
  logger.error('[DevDeploy] ❌ 致命的エラー: 開発サーバーへの登録には GUILD_ID を .env に設定するか、--global フラグを指定してください。');
  process.exit(1);
}

const commands = [];
const commandNames = new Map(); // 重複チェック用

// すべての機能モジュールからコマンドを読み込む
const featureDirs = fs.readdirSync(path.join(__dirname, '..'), { withFileTypes: true })
  .filter(dirent => dirent.isDirectory() && (dirent.name.endsWith('_bot') || dirent.name === 'syuttaikin'))
  .map(dirent => dirent.name);

logger.info(`[DevDeploy] 🔍 ${featureDirs.length}個の機能ディレクトリを検出: ${featureDirs.join(', ')}`);

for (const feature of featureDirs) {
  const featureIndexPath = path.join(__dirname, '..', feature, 'index.js');
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

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    const body = isClear ? [] : commands;
    const route = isGlobal ? Routes.applicationCommands(CLIENT_ID) : Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID);
    const target = isGlobal ? 'グローバル' : `開発サーバー (ID: ${GUILD_ID})`;

    if (isClear) {
      logger.info(`[DevDeploy] 🧹 ${target} のアプリケーションコマンドをクリアしています...`);
    } else {
      logger.info(`[DevDeploy] 🚀 ${body.length}個のアプリケーションコマンドを ${target} に登録しています...`);
    }

    const data = await rest.put(route, { body });

    logger.info(`[DevDeploy] ✅ ${data.length}個のコマンドを ${target} に正常に登録しました。`);
  } catch (error) {
    logger.error('[DevDeploy] ❌ コマンドの登録中にエラーが発生しました。', { error });
  }
})();