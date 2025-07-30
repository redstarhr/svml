const { ensureCastShiftSettingJSON, readJSON, writeJSON } = require('../../utils/fileHelper');
const { safeReply } = require('../../../utils/safeReply');

module.exports = {
  customId: 'set_notify_log_channel_select',
  handle: async (interaction) => {
    const guild = interaction.guild;
    const selectedChannelId = interaction.values[0];

    try {
      // 設定ファイルの読み込みと更新
      const filePath = await ensureCastShiftSettingJSON(guild.id);
      const data = await readJSON(filePath);

      data.notifyLogChannelId = selectedChannelId;

      await writeJSON(filePath, data);

      // 成功メッセージを返信
      await safeReply(interaction, {
        content: `✅ 通知ログチャンネルが <#${selectedChannelId}> に設定されました。`,
        ephemeral: true,
      });
    } catch (err) {
      console.error('通知ログチャンネル設定エラー:', err);
      await safeReply(interaction, {
        content: '⚠️ 通知ログチャンネルの設定中にエラーが発生しました。',
        ephemeral: true,
      });
    }
  },
};
