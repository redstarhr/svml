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
// コンポーネントハンドラ
client.componentHandlers = new Collection(); // customIdで直接マッピングされるハンドラ
client.componentRouters = []; // 複数のcustomIdを処理するルーター型ハンドラ
client.messageHandlers = [];   // 特定のメッセージに反応する処理

module.exports = { client };