// syuttaiki_bot/components/selects/arrival_time_delete_select.js
const { updateState } = require('@root/syuttaikin_bot/utils/syuttaikinStateManager');
const { updateSettingsMessage } = require('@root/syuttaikin_bot/components/settings/_updateSettingsMessage');
const logger = require('@common/logger');

module.exports = {
  customId: 'arrival_time_delete_select',
  /**
   * @param {import('discord.js').StringSelectMenuInteraction} interaction
   */
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const timeToDelete = interaction.values[0]; // The selected time to delete

    try {
      await updateState(guildId, (currentState) => {
        if (currentState.syuttaikin?.arrivalTimes) {
          currentState.syuttaikin.arrivalTimes = currentState.syuttaikin.arrivalTimes.filter(t => t !== timeToDelete);
        }
        return currentState;
      });

      logger.info(`[syuttaikin-config] Guild ${guildId} から出勤時間「${timeToDelete}」を削除しました。`);
      await updateSettingsMessage(interaction);
    } catch (error) {
      logger.error(`[syuttaikin-config] 出勤時間の削除処理中にエラーが発生しました (Guild: ${guildId})`, { error });
    }
    return true;
  },
};