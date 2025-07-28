const { readJSON, writeJSON } = require('../../fileHelper');
const path = require('path');

module.exports = {
  customId: 'log_channel_select',
  handle: async (interaction) => {
    const selectedChannelId = interaction.values[0];
    const guildId = interaction.guild.id;

    // 保存先を data-svml/<GUILD_ID>/<GUILD_ID>.json に変更
    const filePath = path.join(
      __dirname,
      '../../data-svml',
      guildId,
      `${guildId}.json`
    );

    let data;
    try {
      data = await readJSON(filePath);
    } catch (e) {
      data = {};
    }

    data.syuttaikin = data.syuttaikin || {};
    data.syuttaikin.logChannelId = selectedChannelId;

    await writeJSON(filePath, data);

    await interaction.reply({
      content: `✅ 通知ログチャンネルが <#${selectedChannelId}> に設定されました。`,
      ephemeral: true,
    });
  },
};
