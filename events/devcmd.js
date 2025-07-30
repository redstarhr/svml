require('dotenv').config();
require('module-alias/register');
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const logger = require('@common/logger');

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
    logger.error('[DEV-DEPLOY] ❌ 致命的エラー: DISCORD_TOKEN, CLIENT_ID, GUILD_ID のいずれかが .env ファイルに設定されていません。');
    process.exit(1);
}

const commands = [];
// すべての機能モジュールからコマンドを読み込む
const featureDirs = fs.readdirSync(path.join(__dirname, '..'), { withFileTypes: true })
  .filter(dirent => dirent.isDirectory() && dirent.name.endsWith('_bot'))
  .map(dirent => dirent.name);

logger.info(`[DEV-DEPLOY] 🔍 ${featureDirs.length}個の機能ディレクトリからコマンドを探索中: ${featureDirs.join(', ')}`);

for (const feature of featureDirs) {
  const featureIndexPath = path.join(__dirname, '..', feature, 'index.js');
  if (fs.existsSync(featureIndexPath)) {
    try {
      const featureModule = require(featureIndexPath);
      if (featureModule.commands && Array.isArray(featureModule.commands)) {
        commands.push(...featureModule.commands.map(cmd => cmd.data.toJSON()));
      }
    } catch (error) {
      logger.error(`[DEV-DEPLOY] ❌ エラー: モジュール ${feature} からのコマンド読み込みに失敗しました。`, { error });
    }
  }
}

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    logger.info(`[DEV-DEPLOY] 🚀 ${commands.length}個のアプリケーションコマンドを開発サーバーに登録しています...`);

    const data = await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands },
    );

    logger.info(`[DEV-DEPLOY] ✅ ${data.length}個のコマンドをサーバー(ID: ${GUILD_ID})に正常に登録しました。`);
  } catch (error) {
    logger.error('[DEV-DEPLOY] ❌ コマンドの登録中にエラーが発生しました。', { error });
  }
})();