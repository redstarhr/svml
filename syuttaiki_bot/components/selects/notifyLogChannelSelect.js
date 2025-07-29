const { PermissionFlagsBits } = require('discord.js');
const { writeNotifyLogChannel } = require('../../utils/storage'); // GCSなどへの書き込み関数例

module.exports = {
  customId: 'notify_log_channel_select',
  handle: async (interaction) => {
    if (!interaction.guild) {
      await interaction.reply({ content: 'ギルド内で実行してください。', ephemeral: true });
      return;
    }

    const channelId = interaction.values[0];
    const guildId = interaction.guild.id;

    // 権限チェック（管理者のみなど）
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ content: 'この操作を行う権限がありません。', ephemeral: true });
      return;
    }

    // ここで通知ログチャンネルIDを永続化（例としてGCSなど）
    await writeNotifyLogChannel(guildId, channelId);

    await interaction.reply({ content: `通知ログチャンネルを <#${channelId}> に設定しました。`, ephemeral: true });

    // ここでEmbed更新等必要なら呼び出す
  },
};
