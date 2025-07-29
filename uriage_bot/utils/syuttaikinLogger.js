// utils/syuttaikinLogger.js
const { readState } = require('@root/syuttaiki_bot/utils/syuttaikiStateManager');
const logger = require('@common/logger');

async function sendSyukkaTaikinLog(guild, message) {
  try {
    const guildId = guild.id;
    const state = await readState(guildId);

    const logChannelId = state?.syuttaikin?.logChannelId;
    if (!logChannelId) return; // 通知ログ未設定

    const channel = await guild.channels.fetch(logChannelId);
    if (!channel?.isTextBased()) return;

    await channel.send({ content: message });
  } catch (err) {
    logger.error('出退勤ログの送信に失敗しました。', { error: err });
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
