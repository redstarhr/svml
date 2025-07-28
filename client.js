// client.js
const { Client, GatewayIntentBits, Collection } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // メンバー情報の取得に必要
    GatewayIntentBits.GuildMessages,
  ],
});

client.commands = new Collection();
client.buttons = new Collection();
client.modals = new Collection();
client.selects = new Collection();

module.exports = { client };