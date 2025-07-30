// syuttaiki_bot/utils/castShift/castPanelManager.js

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const castStateManager = require('./castStateManager');

async function createOrUpdateCastShiftEmbed({ guildId, date, state, channel }) {
  const embed = new EmbedBuilder()
    .setTitle(`🕓 出勤記録 - ${date}`)
    .setColor(0x91caff)
    .setTimestamp();

  const shiftTimes = Object.keys(state.shifts).sort();
  for (const time of shiftTimes) {
    const users = state.shifts[time].map(userId => {
      const leaveTime = state.leaves?.[userId];
      return leaveTime
        ? `<@${userId}> 退勤：${leaveTime}`
        : `<@${userId}>`;
    }).join('\n');

    embed.addFields({ name: `**${time}**`, value: users || '（なし）', inline: true });
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`cast_shift_select_${date}`)
      .setLabel('出勤登録')
      .setStyle(ButtonStyle.Primary)
  );

  if (state.messageId) {
    try {
      const message = await channel.messages.fetch(state.messageId);
      await message.edit({ embeds: [embed], components: [row] });
      return message;
    } catch {
      // 編集できない場合は新規送信
    }
  }

  const sent = await channel.send({ embeds: [embed], components: [row] });

  state.messageId = sent.id;
  await castStateManager.saveState(guildId, date, state);

  return sent;
}

module.exports = {
  createOrUpdateCastShiftEmbed,
};
