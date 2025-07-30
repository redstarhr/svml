const castStateManager = require('../utils/castShift/castStateManager');
const { createOrUpdateCastShiftEmbed } = require('../utils/castShift/castPanelManager');

module.exports = {
  customIdPrefix: 'cast_shift_',

  async handle(interaction) {
    const { customId, values, guildId, channel } = interaction;

    const date = new Date().toISOString().split('T')[0];

    // 出勤選択
    if (customId.startsWith('cast_shift_work_select_')) {
      const time = customId.replace('cast_shift_work_select_', '');
      const state = await castStateManager.loadOrInitState(guildId, date, channel.id);

      if (!state.shifts[time]) state.shifts[time] = [];

      for (const userId of values) {
        if (!state.shifts[time].includes(userId)) {
          state.shifts[time].push(userId);
        }
      }

      await castStateManager.saveState(guildId, date, state);

      await createOrUpdateCastShiftEmbed({ guildId, date, state, channel });

      await interaction.update({ content: '出勤を記録しました。', components: [], ephemeral: true });
      return;
    }

    // 退勤選択
    if (customId.startsWith('cast_shift_leave_select_')) {
      const time = customId.replace('cast_shift_leave_select_', '');
      const state = await castStateManager.loadOrInitState(guildId, date, channel.id);

      if (!state.leaves) state.leaves = {};

      for (const userId of values) {
        state.leaves[userId] = time;
      }

      await castStateManager.saveState(guildId, date, state);

      await createOrUpdateCastShiftEmbed({ guildId, date, state, channel });

      await interaction.update({ content: '退勤を記録しました。', components: [], ephemeral: true });
      return;
    }

    await interaction.reply({ content: '不明な操作です。', ephemeral: true });
  }
};
