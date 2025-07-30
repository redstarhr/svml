const { EmbedBuilder, ActionRowBuilder, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { readState } = require('@root/syuttaikin_bot/utils/syuttaikinStateManager');

/**
 * 設定パネル全体（埋め込みメッセージとコンポーネント）を再描画します。
 * @param {import('discord.js').CommandInteraction | import('discord.js').MessageComponentInteraction} interaction
 * @param {{ showArrivalRemove?: boolean, showDepartureRemove?: boolean }} options
 */
async function updateSettingsMessage(interaction, options = {}) {
  const state = await readState(interaction.guild.id);
  const config = state.syuttaikin || {};

  const formatTimes = (times) => {
    if (!times || times.length === 0) return '未設定';
    return '`' + [...times].sort().join('`, `') + '`';
  };

  const embed = new EmbedBuilder()
    .setTitle('⚙️ 出退勤Bot 設定パネル')
    .setDescription('各種設定をここで行います。')
    .setColor(0xFEE75C)
    .addFields(
      { name: 'キャストロール', value: config.castRoles?.length > 0 ? config.castRoles.map(id => `<@&${id}>`).join(', ') : '未設定' },
      { name: 'パネル投稿チャンネル', value: config.panelChannelId ? `<#${config.panelChannelId}>` : '未設定' },
      { name: 'ログ通知チャンネル', value: config.logChannelId ? `<#${config.logChannelId}>` : '未設定' },
      { name: '登録済みの出勤時間', value: formatTimes(config.arrivalTimes), inline: true },
      { name: '登録済みの退勤時間', value: formatTimes(config.departureTimes), inline: true }
    );

  const roleSelect = new RoleSelectMenuBuilder()
    .setCustomId('setting_set_cast_roles')
    .setPlaceholder('出退勤ボタンを押せるキャストロールを選択')
    .setMinValues(0)
    .setMaxValues(10);

  const panelChannelSelect = new ChannelSelectMenuBuilder()
    .setCustomId('setting_set_panel_channel')
    .setPlaceholder('出退勤パネルを投稿するチャンネルを選択')
    .addChannelTypes(ChannelType.GuildText);

  const logChannelSelect = new ChannelSelectMenuBuilder()
    .setCustomId('setting_set_log_channel')
    .setPlaceholder('出退勤ログを通知するチャンネルを選択')
    .addChannelTypes(ChannelType.GuildText);

  const timeButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('config_add_arrival_time').setLabel('出勤時間を追加').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('config_remove_arrival_time').setLabel('出勤時間を削除').setStyle(ButtonStyle.Danger).setDisabled(!config.arrivalTimes || config.arrivalTimes.length === 0),
    new ButtonBuilder().setCustomId('config_add_departure_time').setLabel('退勤時間を追加').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('config_remove_departure_time').setLabel('退勤時間を削除').setStyle(ButtonStyle.Danger).setDisabled(!config.departureTimes || config.departureTimes.length === 0)
  );

  const components = [
    new ActionRowBuilder().addComponents(roleSelect),
    new ActionRowBuilder().addComponents(panelChannelSelect),
    new ActionRowBuilder().addComponents(logChannelSelect),
    timeButtons,
  ];

  // オプションに応じて時間削除用のセレクトメニューを追加
  if (options.showArrivalRemove && config.arrivalTimes?.length > 0) {
    const arrivalOptions = config.arrivalTimes.sort().map(time => ({ label: time, value: time }));
    const arrivalSelect = new StringSelectMenuBuilder()
      .setCustomId('setting_remove_arrival_time')
      .setPlaceholder('削除する出勤時間を選択')
      .addOptions(arrivalOptions);
    components.push(new ActionRowBuilder().addComponents(arrivalSelect));
  }

  if (options.showDepartureRemove && config.departureTimes?.length > 0) {
    const departureOptions = config.departureTimes.sort().map(time => ({ label: time, value: time }));
    const departureSelect = new StringSelectMenuBuilder()
      .setCustomId('setting_remove_departure_time')
      .setPlaceholder('削除する退勤時間を選択')
      .addOptions(departureOptions);
    components.push(new ActionRowBuilder().addComponents(departureSelect));
  }

  const payload = {
    embeds: [embed],
    components: components,
    ephemeral: true
  };

  if (interaction.isCommand()) {
    await interaction.editReply(payload);
  } else {
    await interaction.update(payload);
  }
}

module.exports = { updateSettingsMessage };