// utils/syuttaikinPanelManager.js
const { EmbedBuilder } = require('discord.js');

/**
 * キャスト出退勤のembedを作成または更新する関数
 * @param {Guild} guild 
 * @param {string} channelId 
 * @param {Object} state - 保存されている出退勤状態JSON
 */
async function createOrUpdateCastShiftEmbed(guild, channelId, state) {
  const channel = await guild.channels.fetch(channelId);
  if (!channel?.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setTitle('🕓 キャスト出退勤記録')
    .setDescription(`年月日: ${new Date().toLocaleDateString()}`);

  // 出勤時間のキーを昇順ソート
  const arrivalTimes = Object.keys(state.syuttaikin.arrivals || {}).sort();
  const departureTimes = Object.keys(state.syuttaikin.departures || {}).sort();

  // 出勤フィールドを横並びinlineで追加
  arrivalTimes.forEach(time => {
    const userIds = state.syuttaikin.arrivals[time] || [];
    const mentions = userIds.map(id => `<@${id}>`).join('\n') || 'ー';
    embed.addFields({ name: `出勤 ${time}`, value: mentions, inline: true });
  });

  // 退勤フィールドを横並びinlineで追加
  departureTimes.forEach(time => {
    const userIds = state.syuttaikin.departures[time] || [];
    const mentions = userIds.map(id => `<@${id}>`).join('\n') || 'ー';
    embed.addFields({ name: `退勤 ${time}`, value: mentions, inline: true });
  });

  // 最新のembedメッセージを取得して編集 or 新規送信
  // （チャンネルのメッセージ取得・保存は別管理想定）
  const messages = await channel.messages.fetch({ limit: 50 });
  const existing = messages.find(m => m.author.id === guild.client.user.id && m.embeds.length > 0 && m.embeds[0].title === '🕓 キャスト出退勤記録');

  if (existing) {
    await existing.edit({ embeds: [embed] });
  } else {
    await channel.send({ embeds: [embed] });
  }
}

module.exports = {
  createOrUpdateCastShiftEmbed,
};
