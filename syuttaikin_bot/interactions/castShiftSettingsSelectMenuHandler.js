const castStateManager = require('../utils/castShift/castStateManager');
const { createOrUpdateCastShiftEmbed } = require('../utils/castShift/castPanelManager');

const SETTINGS_ID_PREFIX = 'cast_shift_setting_';

module.exports = {
  customIdPrefix: SETTINGS_ID_PREFIX,

  async handle(interaction) {
    const { customId, values, guildId, channel } = interaction;
    const date = new Date().toISOString().split('T')[0];
    const state = await castStateManager.loadOrInitState(guildId, date, channel.id);

    if (customId === SETTINGS_ID_PREFIX + 'work_del_select') {
      for (const time of values) {
        delete state.shifts[time];
      }
      await castStateManager.saveState(guildId, date, state);
      await createOrUpdateCastShiftEmbed({ guildId, date, state, channel });
      await interaction.update({ content: `出勤時間を削除しました: ${values.join(', ')}`, components: [] });
      return;
    }

    if (customId === SETTINGS_ID_PREFIX + 'leave_del_select') {
      if (state.leaveTimes) {
        state.leaveTimes = state.leaveTimes.filter(t => !values.includes(t));
      }
      // またleaveTimesから削除した退勤時間に該当するユーザーのleaveデータは削除しても良い（任意）
      for (const userId in state.leaves) {
        if (values.includes(state.leaves[userId])) {
          delete state.leaves[userId];
        }
      }

      await castStateManager.saveState(guildId, date, state);
      await createOrUpdateCastShiftEmbed({ guildId, date, state, channel });
      await interaction.update({ content: `退勤時間を削除しました: ${values.join(', ')}`, components: [] });
      return;
    }
  }
};
