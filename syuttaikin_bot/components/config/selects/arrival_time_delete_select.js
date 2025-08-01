// syuttaiki_bot/components/selects/arrival_time_delete_select.js
const { readState, writeState } = require('@root/syuttaikin_bot/utils/syuttaikinStateManager');
const { createOrUpdateCastShiftEmbed } = require('@root/uriage_bot/utils/syuttaikinPanelManager');

module.exports = {
  customId: 'arrival_time_delete_select',
  async handle(interaction) {
    const guildId = interaction.guild.id;
    const channelId = interaction.channel.id;
    const timeToDelete = interaction.values[0]; // The selected time to delete

    // Read existing state
    const state = await readState(guildId);
    if (!state.syuttaikin || !state.syuttaikin.arrivalTimes) {
      await interaction.update({ content: 'エラー: 削除対象のデータが見つかりませんでした。', components: [] });
      return;
    }

    // Filter out the selected time
    const originalCount = state.syuttaikin.arrivalTimes.length;
    state.syuttaikin.arrivalTimes = state.syuttaikin.arrivalTimes.filter(t => t !== timeToDelete);

    if (state.syuttaikin.arrivalTimes.length === originalCount) {
        await interaction.update({ content: `エラー: 時間「${timeToDelete}」が見つかりませんでした。`, components: [] });
        return;
    }

    // Save the updated state
    await writeState(guildId, state);

    // Update the embed
    await createOrUpdateCastShiftEmbed(interaction.guild, channelId, state);

    await interaction.update({ content: `出勤時間「${timeToDelete}」を削除しました。`, components: [] });
  },
};