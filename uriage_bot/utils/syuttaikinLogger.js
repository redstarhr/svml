// utils/syuttaikinLogger.js
const { readJSON } = require('./fileHelper');

async function sendSyukkaTaikinLog(guild, message) {
  try {
    const guildId = guild.id;
    // GCS保存パス例
    const filePath = `data-svml/${guildId}/${guildId}.json`;
    const config = await readJSON(filePath);

    const logChannelId = config?.syuttaikin?.logChannelId;
    if (!logChannelId) return; // 通知ログ未設定

    const channel = await guild.channels.fetch(logChannelId);
    if (!channel?.isTextBased()) return;

    await channel.send({ content: message });
  } catch (err) {
    console.error('通知ログ送信エラー:', err);
  }
}

function formatSyukkaLog({ type, time, users }) {
  const mentions = users.map(u => `<@${u.id}>`).join(' ');
  const emoji = type === 'in' ? '🕓 出勤ログ' : '🚪 退勤ログ';
  return `${emoji}\n**${time}**：${mentions}`;
}

module.exports = {
  sendSyukkaTaikinLog,
  formatSyukkaLog,
};
