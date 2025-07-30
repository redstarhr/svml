const { readState, updateState } = require('@root/syuttaikin_bot/utils/syuttaikinStateManager');
const { updateSettingsMessage } = require('@root/syuttaikin_bot/components/settings/_updateSettingsMessage');
const logger = require('@common/logger');

module.exports = {
  customId: 'config_add_departure_time_modal', // This is an assumption
  /**
   * @param {import('discord.js').ModalSubmitInteraction} interaction
   */
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const time = interaction.fields.getTextInputValue('time_input');

    if (!/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      return interaction.reply({
        content: '⚠️ 時間は `HH:mm` 形式 (例: `18:00`) で入力してください。',
        ephemeral: true,
      });
    }

    try {
      const currentState = await readState(guildId);
      if (currentState.syuttaikin?.departureTimes?.includes(time)) {
        return interaction.reply({
          content: `⚠️ 退勤時間 \`${time}\` は既に登録されています。`,
          ephemeral: true,
        });
      }

      await updateState(guildId, (state) => {
        state.syuttaikin.departureTimes.push(time);
        state.syuttaikin.departureTimes.sort();
        return state;
      });

      logger.info(`[syuttaikin-config] Guild ${guildId} に退勤時間「${time}」を追加しました。`);

      await updateSettingsMessage(interaction);

    } catch (error) {
      logger.error(`[syuttaikin-config] 退勤時間の追加処理中にエラーが発生しました (Guild: ${guildId})`, { error });
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '設定の更新中にエラーが発生しました。', ephemeral: true }).catch(() => {});
      }
    }
  },
};