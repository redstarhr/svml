// index.js

require('module-alias/register');
require('dotenv').config();
const fs = require('node:fs');
const path = require('path');
const { Collection, Events } = require('discord.js');
const { client } = require('./client');

// --- 必須環境変数チェック ---
const requiredEnv = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
for (const envVar of requiredEnv) {
  if (!process.env[envVar]) {
    console.error(`❌ 致命的エラー: 環境変数 ${envVar} が .env に設定されていません。`);
    process.exit(1);
  }
}

console.log('Google Credentials Path:', process.env.GOOGLE_APPLICATION_CREDENTIALS);

// --- コマンドハンドラの読み込み ---
client.commands = new Collection();
// プロジェクトルートにある `_bot` で終わるディレクトリを自動的に探索
const featureDirs = fs.readdirSync(__dirname, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory() && dirent.name.endsWith('_bot'))
  .map(dirent => dirent.name);

console.log(`🔍 ${featureDirs.length}個の機能ディレクトリを検出: ${featureDirs.join(', ')}`);
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
                if (client.commands.has(commandName)) {
                    // 重複するコマンド名を検出した場合、エラーを出力してスキップ
                    console.error(`❌ 重複エラー: コマンド名 "${commandName}" (${filePath}) は既に読み込まれています。上書きはしません。`);
                    continue;
                }
                client.commands.set(commandName, command);
            } else {
                console.warn(`⚠️  [警告] ${filePath} のコマンドは 'data' または 'execute' が不足しています。`);
            }
        } catch (error) {
            console.error(`❌ コマンドファイルの読み込みに失敗: ${filePath}`, error);
        }
    }
}
console.log(`✅ ${client.commands.size} 個のコマンドを読み込みました。`);

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
console.log(`✅ ${eventFiles.length} 個のイベントハンドラを読み込みました。`);

// --- Discord Bot ログイン ---
client.login(process.env.DISCORD_TOKEN);
