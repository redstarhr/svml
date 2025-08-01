// events/devcmd.js

const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('module-alias/register');
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const logger = require('@common/logger');

// --- 引数解析 ---
const isClear = process.argv.includes('--clear');
const isGlobalOnly = process.argv.includes('--global');
const isGuildOnly = process.argv.includes('--guild');

// --- 必須環境変数チェック ---
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  logger.error('[DevDeploy] ❌ 環境変数 DISCORD_TOKEN, CLIENT_ID, GUILD_ID のいずれかが未設定です。');
  process.exit(1);
}

const commands = [];
const commandNames = new Map();

const featureDirs = fs.readdirSync(path.join(__dirname, '..'), { withFileTypes: true })
  .filter(dirent => dirent.isDirectory() && (dirent.name.endsWith('_bot') || dirent.name === 'syuttaikin'))
  .map(dirent => dirent.name);

logger.info(`[DevDeploy] 🔍 ${featureDirs.length}個の機能ディレクトリを検出: ${featureDirs.join(', ')}`);

for (const feature of featureDirs) {
  const featureIndexPath = path.join(__dirname, '..', feature, 'index.js');
  if (fs.existsSync(featureIndexPath)) {
    try {
      const featureModule = require(featureIndexPath);
      if (Array.isArray(featureModule.commands)) {
        for (const command of featureModule.commands) {
          if ('data' in command && 'execute' in command) {
            const name = command.data.name;
            if (commandNames.has(name)) {
              logger.error(`[DevDeploy] ❌ 重複エラー: "${name}" は ${commandNames.get(name)} と ${feature} で競合しています`);
              continue;
            }
            commandNames.set(name, feature);
            commands.push(command.data.toJSON());
          } else {
            logger.warn(`[DevDeploy] ⚠️ ${feature} のコマンドに data または execute がありません`);
          }
        }
      }
    } catch (error) {
      logger.error(`[DevDeploy] ❌ ${feature} の読み込みエラー`, { error });
    }
  }
}

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    const body = isClear ? [] : commands;
    const targets = [];

    if (!isGlobalOnly) {
      targets.push({
        name: '開発サーバー',
        route: Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
      });
    }

    if (!isGuildOnly) {
      targets.push({
        name: 'グローバル',
        route: Routes.applicationCommands(CLIENT_ID)
      });
    }

    for (const target of targets) {
      if (isClear) {
        logger.info(`[DevDeploy] 🧹 ${target.name} のコマンドをクリア中...`);
      } else {
        logger.info(`[DevDeploy] 🚀 ${body.length}個のコマンドを ${target.name} に登録中...`);
      }

      const data = await rest.put(target.route, { body });
      logger.info(`[DevDeploy] ✅ ${data.length}個のコマンドを ${target.name} に登録完了`);
    }
  } catch (error) {
    logger.error('[DevDeploy] ❌ コマンド登録時にエラーが発生しました', { error });
  }
})();
