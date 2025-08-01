// components/modals/arrival_time_register_submit.js
const { updateState } = require('@root/syuttaikin_bot/utils/syuttaikinStateManager');
const { updateSettingsMessage } = require('@root/syuttaikin_bot/components/settings/_updateSettingsMessage');
const logger = require('@common/logger');

module.exports = {
  customId: 'arrival_time_register_submit',
  /**
   * @param {import('discord.js').ModalSubmitInteraction} interaction
   */
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const input = interaction.fields.getTextInputValue('arrival_times_input');
    const times = input.split(',').map(t => t.trim()).filter(t => t);

    // 入力値のバリデーション
    const invalidTimes = times.filter(time => !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time));
    if (invalidTimes.length > 0) {
      return interaction.reply({
        content: `⚠️ 不正な時間形式が含まれています: \`${invalidTimes.join(', ')}\`\n時間は \`HH:mm\` 形式で、カンマ区切りで入力してください。`,
        ephemeral: true,
      });
    }
    if (times.length === 0) {
      return interaction.reply({ content: '⚠️ 登録する時間が入力されていません。', ephemeral: true });
    }

    try {
      let addedCount = 0;
      await updateState(guildId, (currentState) => {
        const config = currentState.syuttaikin || {};
        config.arrivalTimes = config.arrivalTimes || [];
        const originalSize = config.arrivalTimes.length;

        const timeSet = new Set(config.arrivalTimes);
        times.forEach(time => timeSet.add(time));

        const newTimes = Array.from(timeSet).sort();
        addedCount = newTimes.length - originalSize;
        config.arrivalTimes = newTimes;

        currentState.syuttaikin = config;
        return currentState;
      });

      if (addedCount > 0) {
        logger.info(`[syuttaikin-config] Guild ${guildId} に出勤時間「${times.join(', ')}」を追加しました。`);
        await updateSettingsMessage(interaction); // 設定パネルを更新してユーザーに通知
      } else {
        await interaction.reply({ content: '✅ 入力された時間はすべて登録済みです。', ephemeral: true });
      }
    } catch (error) {
      logger.error(`[syuttaikin-config] 出勤時間の追加処理中にエラーが発生しました (Guild: ${guildId})`, { error });
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '設定の更新中にエラーが発生しました。', ephemeral: true }).catch(() => {});
      }
    }
  },
};
