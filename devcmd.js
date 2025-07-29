// devcmd.js
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');

// --- 必須環境変数チェック ---
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('❌ 致命的エラー: DISCORD_TOKEN, CLIENT_ID, GUILD_ID のいずれかが .env に設定されていません。');
  process.exit(1);
}

const commands = [];
const commandNames = new Set();

// --- コマンドデータの読み込み ---
const featureDirs = fs.readdirSync(__dirname, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory() && dirent.name.endsWith('_bot'))
  .map(dirent => dirent.name);

console.log(`[DEV-DEPLOY] 🔍 ${featureDirs.length}個の機能ディレクトリを検出: ${featureDirs.join(', ')}`);
for (const feature of featureDirs) {
    const commandsPath = path.join(__dirname, feature, 'commands');
    if (!fs.existsSync(commandsPath)) {
      continue;
    }
    // commandsディレクトリ直下の.jsファイルのみを読み込む（再帰しない）
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        try {
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                const commandName = command.data.name;
                if (commandNames.has(commandName)) {
                    // 重複するコマンド名を検出した場合、エラーを出力してスキップ
                    console.error(`[DEV-DEPLOY] ❌ 重複エラー: コマンド名 "${commandName}" (${filePath}) は既に使用されています。`);
                    continue;
                }
                commandNames.add(commandName);
                commands.push(command.data.toJSON());
            } else {
                console.warn(`[DEV-DEPLOY] ⚠️  [警告] ${filePath} のコマンドは 'data' または 'execute' が不足しています。`);
            }
        } catch (error) {
            console.error(`[DEV-DEPLOY] ❌ コマンドファイルの読み込みに失敗: ${filePath}`, error);
        }
    }
}

// --- RESTインスタンスの作成とコマンドの登録 ---
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log(`[DEV-DEPLOY] 🚀 ${commands.length} 個のアプリケーションコマンドを開発サーバーに登録開始...`);
    const data = await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log(`[DEV-DEPLOY] ✅ ${data.length} 個のコマンドを開発サーバー (ID: ${GUILD_ID}) に正常に登録しました。`);
  } catch (error) {
    console.error('[DEV-DEPLOY] ❌ コマンドの登録中にエラーが発生しました:', error);
  }
})();