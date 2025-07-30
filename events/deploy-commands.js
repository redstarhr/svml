require('dotenv').config();
require('module-alias/register');
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const logger = require('@common/logger');

const commands = [];
const commandData = [];

// すべての機能モジュールからコマンドを読み込む
const featureDirs = fs.readdirSync(path.join(__dirname, '..'), { withFileTypes: true })
  .filter(dirent => dirent.isDirectory() && dirent.name.endsWith('_bot'))
  .map(dirent => dirent.name);

logger.info(`[DEPLOY] 🔍 ${featureDirs.length}個の機能ディレクトリからコマンドを探索中: ${featureDirs.join(', ')}`);

for (const feature of featureDirs) {
  const featureIndexPath = path.join(__dirname, '..', feature, 'index.js');
  if (fs.existsSync(featureIndexPath)) {
    try {
      const featureModule = require(featureIndexPath);
      if (featureModule.commands && Array.isArray(featureModule.commands)) {
        commands.push(...featureModule.commands);
      }
    } catch (error) {
      logger.error(`[DEPLOY] ❌ エラー: モジュール ${feature} からのコマンド読み込みに失敗しました。`, { error });
    }
  }
}

// APIに送信するためにコマンドデータを抽出する
for (const command of commands) {
    if ('data' in command && 'execute' in command) {
        commandData.push(command.data.toJSON());
    } else {
        logger.warn(`[DEPLOY] 警告: コマンドオブジェクトに 'data' または 'execute' がありません。`);
    }
}

const { DISCORD_TOKEN, CLIENT_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
    logger.error('[DEPLOY] ❌ 致命的エラー: DISCORD_TOKEN または CLIENT_ID が .env ファイルに設定されていません。');
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
	try {
		logger.info(`[DEPLOY] 🚀 ${commandData.length}個のアプリケーションコマンドをグローバルに登録しています...`);

		const data = await rest.put(
			Routes.applicationCommands(CLIENT_ID),
			{ body: commandData },
		);

		logger.info(`[DEPLOY] ✅ ${data.length}個のコマンドをグローバルに正常に登録しました。`);
	} catch (error) {
		logger.error('[DEPLOY] ❌ コマンドの登録中にエラーが発生しました。', { error });
	}
})();