// index.js

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

/**
 * 指定されたディレクトリから再帰的に .js ファイルを探索します。
 * @param {string} dir - 探索を開始するディレクトリ
 * @returns {string[]} 見つかったファイルのフルパスの配列
 */
function getJsFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) {
    return files;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getJsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

// --- コマンドハンドラの読み込み ---
client.commands = new Collection();
const featureDirs = ['hikkake_bot', 'uriage_bot', 'keihi_bot'];
for (const feature of featureDirs) {
    const commandsPath = path.join(__dirname, feature, 'commands');
    const commandFiles = getJsFiles(commandsPath);
    for (const file of commandFiles) {
        try {
            const command = require(file);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            } else {
                console.warn(`⚠️  [警告] ${file} のコマンドは 'data' または 'execute' が不足しています。`);
            }
        } catch (error) {
            console.error(`❌ コマンドファイルの読み込みに失敗: ${file}`, error);
        }
    }
}
console.log(`✅ ${client.commands.size} 個のコマンドを読み込みました。`);

// --- Discord Bot ログイン ---
client.login(process.env.DISCORD_TOKEN);
