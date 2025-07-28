const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const castStateManager = require('./castStateManager');

const SETTINGS_ID_PREFIX = 'cast_shift_setting_';

async function showSettingsMenu(interaction) {
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder().setCustomId(SETTINGS_ID_PREFIX + 'work_add').setLabel('出勤時間登録').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(SETTINGS_ID_PREFIX + 'work_del').setLabel('出勤時間削除').setStyle(ButtonStyle.Danger)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder().setCustomId(SETTINGS_ID_PREFIX + 'leave_add').setLabel('退勤時間登録').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(SETTINGS_ID_PREFIX + 'leave_del').setLabel('退勤時間削除').setStyle(ButtonStyle.Danger)
    );

  const row3 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder().setCustomId(SETTINGS_ID_PREFIX + 'notify_channel').setLabel('通知ログ設定').setStyle(ButtonStyle.Secondary)
    );

  await interaction.editReply({
    content: '出勤・退勤時間を管理してください。',
    components: [row1, row2, row3],
  });
}

module.exports = { showSettingsMenu };
