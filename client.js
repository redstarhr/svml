// client.js
const { Client, GatewayIntentBits, Collection } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // メンバー情報の取得に必要
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // メッセージ内容の取得に必要
  ],
});

client.commands = new Collection();
// すべてのコンポーネント（ボタン、モーダル等）の処理を担うハンドラ（ルーター形式）
client.componentHandlers = [];
client.messageHandlers = [];   // 特定のメッセージに反応する処理

module.exports = { client };