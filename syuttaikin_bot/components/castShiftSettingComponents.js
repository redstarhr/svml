const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function getCastShiftSettingMenuComponents() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('register_worktime_button')
      .setLabel('出勤時間登録')
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId('delete_worktime_button')
      .setLabel('出勤時間削除')
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId('register_leavetime_button')
      .setLabel('退勤時間登録')
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId('delete_leavetime_button')
      .setLabel('退勤時間削除')
      .setStyle(ButtonStyle.Danger)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('show_cast_by_role_button')
      .setLabel('キャストロール別表示')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('set_notify_log_channel_button')
      .setLabel('通知ログ')
      .setStyle(ButtonStyle.Secondary)
  );

  return [row1, row2];
}

module.exports = {
  getCastShiftSettingMenuComponents,
};
