// utils/syukkaTaikin/5_syukkaTaikinLogger.js
const { EmbedBuilder } = require('discord.js');
const { readJSON } = require('../../fileHelper');

async function sendSyukkaTaikinLog(guild, message) {
  try {
    const configPath = `data-svml/${guild.id}/syukkaTaikin_config.json`;
    const config = await readJSON(configPath);
    if (!config.logChannelId) return;

    const channel = await guild.channels.fetch(config.logChannelId);
    if (!channel || !channel.isTextBased()) return;

    await channel.send({ content: message });
  } catch (err) {
    console.error('[Log送信エラー]', err);
  }
}

function formatSyukkaLog({ type, time, users }) {
  const userMentions = users.map(u => `<@${u.id}>`).join(' ');
  return `🕓 **${type === 'in' ? '出勤' : '退勤'}ログ**
**${time}**：${userMentions}`;
}

module.exports = {
  sendSyukkaTaikinLog,
  formatSyukkaLog,
};
