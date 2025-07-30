// components/modals/arrival_time_register_submit.js
const { readJSON, writeJSON } = require('../../../common/fileHelper');
const path = require('path');

module.exports = {
  customId: 'arrival_time_register_submit',
  async handle(interaction) {
    const guildId = interaction.guild.id;
    const input = interaction.fields.getTextInputValue('arrival_times_input');
    const times = input.split(',').map(t => t.trim()).filter(t => t);

    const filePath = path.join('data-svml', guildId, `${guildId}.json`);

    let data;
    try {
      data = await readJSON(filePath);
    } catch {
      data = {};
    }

    data.syuttaikin = data.syuttaikin || {};
    data.syuttaikin.arrivalTimes = Array.from(new Set([...(data.syuttaikin.arrivalTimes || []), ...times])).sort();

    await writeJSON(filePath, data);

    await interaction.reply({ content: `✅ 出勤時間を登録しました: ${times.join(', ')}`, ephemeral: true });
  },
};
