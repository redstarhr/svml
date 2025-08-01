const { updateState } = require('@root/syuttaikin_bot/utils/syuttaikinStateManager');
const { updateSettingsMessage } = require('@root/syuttaikin_bot/components/settings/_updateSettingsMessage');
const logger = require('@common/logger');

/**
 * 時間削除セレクトメニューの共通処理
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @param {'arrival' | 'departure'} type
 */
async function handleRemoveTimeSelect(interaction, type) {
  const guildId = interaction.guild.id;
  const timeToRemove = interaction.values[0];

  try {
    await updateState(guildId, (currentState) => {
      if (!currentState.syuttaikin) return currentState;

      const timeArrayKey = type === 'arrival' ? 'arrivalTimes' : 'departureTimes';
      if (currentState.syuttaikin[timeArrayKey]) {
        currentState.syuttaikin[timeArrayKey] = currentState.syuttaikin[timeArrayKey].filter(t => t !== timeToRemove);
      }
      return currentState;
    });

    logger.info(`[syuttaikin-config] Guild ${guildId} から ${type} 時間「${timeToRemove}」を削除しました。`);

    // パネルを更新してセレクトメニューを消し、最新の状態を表示
    await updateSettingsMessage(interaction);

  } catch (error) {
    logger.error(`[syuttaikin-config] 時間の削除処理中にエラーが発生しました (Guild: ${guildId})`, { error });
    // updateSettingsMessageがinteractionを更新するため、ここでは追加の返信はしない
  }
}

module.exports = { handleRemoveTimeSelect };