// components/selects/arrivalTimeUserSelect.js
const { updateState } = require('@root/syuttaikin_bot/utils/syuttaikinStateManager');
const { createOrUpdateCastShiftEmbed } = require('@root/uriage_bot/utils/syuttaikinPanelManager');
const { sendSyukkaTaikinLog, formatSyukkaLog } = require('@root/uriage_bot/utils/syuttaikinLogger');
const logger = require('@common/logger');

module.exports = {
  customId: 'arrival_time_user_select',

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const channelId = interaction.channel.id;
    const selectedUserIds = interaction.values; // 選択されたユーザーID配列
    const time = interaction.message.components[0].components[0].label || '20:00'; // 例: ボタンのラベルから取得

    try {
      // 状態をアトミックに更新
      const updatedState = await new Promise((resolve, reject) => {
        updateState(guildId, (currentState) => {
          currentState.syuttaikin = currentState.syuttaikin || {};
          currentState.syuttaikin.arrivals = currentState.syuttaikin.arrivals || {};
          const arrivals = currentState.syuttaikin.arrivals;
          if (!arrivals[time]) arrivals[time] = [];

          // 重複しないように追加
          selectedUserIds.forEach((id) => {
            if (!arrivals[time].includes(id)) {
              arrivals[time].push(id);
            }
          });
          resolve(currentState); // 更新後の状態を解決
          return currentState;
        }).catch(reject);
      });

      // embed更新
      await createOrUpdateCastShiftEmbed(interaction.guild, channelId, updatedState);

      // 通知ログ送信
      const logMessage = formatSyukkaLog({ type: 'in', time, users: selectedUserIds.map((id) => ({ id })) });
      await sendSyukkaTaikinLog(interaction.guild, logMessage);
      
      // 完了レスポンス（コンポーネント削除）
      await interaction.update({ content: '出勤を登録しました。', components: [] });
    } catch (error) {
      logger.error(`[arrivalTimeUserSelect] 出勤登録処理中にエラーが発生しました。`, { error, guildId });
      await interaction.update({ content: 'エラーが発生しました。', components: [] }).catch(() => {});
    }
    return true;
  },
};
