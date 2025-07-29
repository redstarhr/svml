// components/selects/arrivalTimeUserSelect.js
const { readJSON, writeJSON } = require('../../../common/fileHelper');
const { createOrUpdateCastShiftEmbed } = require('../../../uriage_bot/utils/syuttaikinPanelManager');
const { sendSyukkaTaikinLog, formatSyukkaLog } = require('../../../uriage_bot/utils/syuttaikinLogger');
const path = require('path');

module.exports = {
  customId: 'arrival_time_user_select',

  async handle(interaction) {
    const guildId = interaction.guild.id;
    const channelId = interaction.channel.id;
    const selectedUserIds = interaction.values; // 選択されたユーザーID配列
    const time = interaction.message.components[0].components[0].label || '20:00'; // 例: ボタンのラベルから取得

    // 日付を yyyy-mm-dd 形式で取得
    const date = new Date().toISOString().slice(0, 10);

    // GCS上の保存先パス例
    const filePath = path.join('data-svml', guildId, `${guildId}.json`);

    // 既存状態の読み込み
    let state;
    try {
      state = await readJSON(filePath);
    } catch {
      state = {};
    }
    state.syuttaikin = state.syuttaikin || {};
    state.syuttaikin.arrivals = state.syuttaikin.arrivals || {};

    // 出勤時間ごとの配列を更新
    const arrivals = state.syuttaikin.arrivals;
    if (!arrivals[time]) arrivals[time] = [];

    // 重複しないように追加
    selectedUserIds.forEach((id) => {
      if (!arrivals[time].includes(id)) {
        arrivals[time].push(id);
      }
    });

    // 保存
    await writeJSON(filePath, state);

    // embed更新
    await createOrUpdateCastShiftEmbed(interaction.guild, channelId, state);

    // 通知ログ送信
    const logMessage = formatSyukkaLog({
      type: 'in',
      time,
      users: selectedUserIds.map((id) => ({ id })),
    });
    await sendSyukkaTaikinLog(interaction.guild, logMessage);

    // 完了レスポンス（コンポーネント削除）
    await interaction.update({ content: '出勤を登録しました。', components: [] });
  },
};
