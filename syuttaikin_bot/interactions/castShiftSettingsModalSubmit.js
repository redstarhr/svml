const castStateManager = require('../utils/castShift/castStateManager');
const { createOrUpdateCastShiftEmbed } = require('../utils/castShift/castPanelManager');

const SETTINGS_ID_PREFIX = 'cast_shift_setting_';

module.exports = {
  customIdPrefix: SETTINGS_ID_PREFIX,

  async handle(interaction) {
    const { customId, guildId, channel } = interaction;
    const date = new Date().toISOString().split('T')[0];
    const state = await castStateManager.loadOrInitState(guildId, date, channel.id);

    if (customId === SETTINGS_ID_PREFIX + 'work_add_modal') {
      const timesRaw = interaction.fields.getTextInputValue('work_times');
      const times = timesRaw.split(',').map(t => t.trim()).filter(t => t.length > 0);

      for (const time of times) {
        if (!state.shifts[time]) {
          state.shifts[time] = [];
        }
      }

      await castStateManager.saveState(guildId, date, state);
      await createOrUpdateCastShiftEmbed({ guildId, date, state, channel });

      await interaction.reply({ content: `出勤時間を登録しました: ${times.join(', ')}`, ephemeral: true });
      return;
    }

    if (customId === SETTINGS_ID_PREFIX + 'leave_add_modal') {
      const timesRaw = interaction.fields.getTextInputValue('leave_times');
      const times = timesRaw.split(',').map(t => t.trim()).filter(t => t.length > 0);

      for (const time of times) {
        if (!state.leaveTimes) {
          state.leaveTimes = [];
        }
        if (!state.leaveTimes.includes(time)) {
          state.leaveTimes.push(time);
        }
      }

      await castStateManager.saveState(guildId, date, state);
      await createOrUpdateCastShiftEmbed({ guildId, date, state, channel });

      await interaction.reply({ content: `退勤時間を登録しました: ${times.join(', ')}`, ephemeral: true });
      return;
    }
  }
};
