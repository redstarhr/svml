const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const dayjs = require('dayjs');
const { writeState } = require('./attendanceStateManager');

const DEFAULT_SHIFT_TIMES = {
  work: ['20:00', '20:30', '同伴'],
  leave: ['21:00']
};

async function createAttendancePanel(guildId, channel) {
  const today = dayjs().format('YYYY-MM-DD');

  const embed = new EmbedBuilder()
    .setTitle(`📅 キャスト出退勤記録（${today}）`)
    .setDescription(
      `🕓 出勤\n${DEFAULT_SHIFT_TIMES.work.map(t => `**${t}**：\n`).join('')}\n\n` +
      `🏁 退勤\n${DEFAULT_SHIFT_TIMES.leave.map(t => `**${t}**：\n`).join('')}`
    )
    .setColor(0xFABD2F)
    .setTimestamp();

  // 出勤ボタン
  const workButtons = new ActionRowBuilder().addComponents(
    DEFAULT_SHIFT_TIMES.work.map(t =>
      new ButtonBuilder()
        .setCustomId(`cast_work_${t}`)
        .setLabel(t)
        .setStyle(ButtonStyle.Primary)
    )
  );

  // 退勤ボタン
  const leaveButtons = new ActionRowBuilder().addComponents(
    DEFAULT_SHIFT_TIMES.leave.map(t =>
      new ButtonBuilder()
        .setCustomId(`cast_leave_${t}`)
        .setLabel(t)
        .setStyle(ButtonStyle.Secondary)
    )
  );

  const message = await channel.send({
    embeds: [embed],
    components: [workButtons, leaveButtons],
  });

  // 保存しておく（あとで更新などに使う）
  await writeState(guildId, today, {
    messageId: message.id,
    channelId: channel.id,
    embedData: {
      work: DEFAULT_SHIFT_TIMES.work,
      leave: DEFAULT_SHIFT_TIMES.leave,
      workMap: {},  // time: [userId]
      leaveMap: {}  // time: [userId]
    }
  });

  return message;
}

module.exports = { createAttendancePanel };
