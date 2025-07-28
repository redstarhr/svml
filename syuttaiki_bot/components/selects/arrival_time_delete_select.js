// components/selects/arrival_time_delete_select.js
const { readJSON, writeJSON } = require('../../utils/fileHelper');
const path = require('path');

module.exports = {
  customId: 'arrival_time_delete_select',
  async handle(interaction) {
    const guildId = interaction.guild.id;
    const selectedTime = interaction.values[0];

    const filePath = path.join('data-svml', guildId, `${guildId}.json`);

    let data;
    try {
      data = await readJSON(filePath);
    } catch {
      data = {};
    }

    data.syuttaikin = data.syuttaikin || {};
    const arrivalTimes = data.syuttaikin.arrivalTimes || [];

    data.syuttaikin.arrivalTimes = arrivalTimes.filter(time => time !== selectedTime);

    // もし状態の出勤配列にあれば削除も必要（省略可）
    if (data.syuttaikin.arrivals && data.syuttaikin.arrivals[selectedTime]) {
      delete data.syuttaikin.arrivals[selectedTime];
    }

    await writeJSON(filePath, data);

    await interaction.reply({ content: `✅ 出勤時間「${selectedTime}」を削除しました。`, ephemeral: true });
  },
};
