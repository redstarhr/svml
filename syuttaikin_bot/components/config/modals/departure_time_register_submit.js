const { updateState } = require('@root/syuttaikin_bot/utils/syuttaikinStateManager');
const { updateSettingsMessage } = require('@root/syuttaikin_bot/components/settings/_updateSettingsMessage');
const logger = require('@common/logger');

module.exports = {
  customId: 'departure_time_register_submit',
  /**
   * @param {import('discord.js').ModalSubmitInteraction} interaction
   */
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const time = interaction.fields.getTextInputValue('departure_time_input');

    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      return interaction.reply({
        content: '⚠️ 時間は `HH:mm` 形式 (例: `18:00`) で入力してください。',
        ephemeral: true,
      });
    }

    try {
      let updated = false;
      await updateState(guildId, (currentState) => {
        const config = currentState.syuttaikin || {};
        config.departureTimes = config.departureTimes || [];

        if (config.departureTimes.includes(time)) {
          return currentState; // No change needed
        }

        config.departureTimes.push(time);
        config.departureTimes.sort();
        currentState.syuttaikin = config;
        updated = true;
        return currentState;
      });

      if (updated) {
        logger.info(`[syuttaikin-config] Guild ${guildId} に退勤時間「${time}」を追加しました。`);
        await updateSettingsMessage(interaction);
      } else {
        await interaction.reply({ content: `✅ 退勤時間 \`${time}\` は既に登録されています。`, ephemeral: true });
      }
    } catch (error) {
      logger.error(`[syuttaikin-config] 退勤時間の追加処理中にエラーが発生しました (Guild: ${guildId})`, { error });
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '設定の更新中にエラーが発生しました。', ephemeral: true }).catch(() => {});
      }
    }
    return true;
  },
};