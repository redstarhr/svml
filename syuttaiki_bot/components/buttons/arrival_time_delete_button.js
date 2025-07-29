// components/buttons/arrival_time_delete_button.js
const { ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const { readJSON } = require('@common/fileHelper');
const path = require('path');

module.exports = {
  customId: 'arrival_time_delete_button',
  async handle(interaction) {
    const guildId = interaction.guild.id;
    const filePath = path.join('data-svml', guildId, `${guildId}.json`);

    let data;
    try {
      data = await readJSON(filePath);
    } catch {
      data = {};
    }
    const arrivalTimes = data.syuttaikin?.arrivalTimes || [];

    if (arrivalTimes.length === 0) {
      await interaction.reply({ content: '削除可能な出勤時間がありません。', flags: [MessageFlags.Ephemeral] });
      return;
    }

    const options = arrivalTimes.map(time => ({
      label: time,
      value: time,
    }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('arrival_time_delete_select')
      .setPlaceholder('削除する出勤時間を選択してください')
      .addOptions(options)
      .setMinValues(1)
      .setMaxValues(1);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({ content: '削除する出勤時間を選択してください。', components: [row], flags: [MessageFlags.Ephemeral] });
  },
};
