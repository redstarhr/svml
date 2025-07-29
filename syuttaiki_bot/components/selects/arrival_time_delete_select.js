// syuttaiki_bot/components/selects/arrival_time_delete_select.js
const { readJSON, writeJSON } = require('../../../common/fileHelper');
const { createOrUpdateCastShiftEmbed } = require('../../../uriage_bot/utils/syuttaikinPanelManager');
const path = require('path');

module.exports = {
  customId: 'arrival_time_delete_select',
  async handle(interaction) {
    const guildId = interaction.guild.id;
    const channelId = interaction.channel.id;
    const timeToDelete = interaction.values[0]; // The selected time to delete

    const filePath = path.join('data-svml', guildId, `${guildId}.json`);

    // Read existing state
    const state = await readJSON(filePath, {});
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
    await writeJSON(filePath, state);

    // Update the embed
    await createOrUpdateCastShiftEmbed(interaction.guild, channelId, state);

    await interaction.update({ content: `出勤時間「${timeToDelete}」を削除しました。`, components: [] });
  },
};