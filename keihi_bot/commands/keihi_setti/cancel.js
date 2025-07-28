// commands/keihi_setti/cancel.js

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const {
  deleteExpenseEntry,
  getExpenseEntries
} = require('../../utils/fileStorage.js');

const dayjs = require('dayjs');

module.exports = async function handleCancelButton(interaction) {
  if (!interaction.isButton() || interaction.customId !== 'cancel_button') return;

  const userId = interaction.user.id;
  const username = interaction.user.globalName || interaction.user.username;
  const guildId = interaction.guildId;
  const message = interaction.message;
  const messageId = message.id;
  const yearMonth = dayjs(message.createdAt).format('YYYY-MM');

  try {
    // 📄 対象の申請ログを取得
    const entries = getExpenseEntries(guildId, yearMonth);
    const entry = entries.find(e => e.threadMessageId === messageId);

    if (!entry || entry.userId !== userId) {
      return await interaction.reply({
        content: '❌ この申請は取り消せません（他の人の申請か、ログに存在しません）。',
        flags: 64
      });
    }

    // 🗑️ ログファイルから削除
    const deleted = deleteExpenseEntry(guildId, yearMonth, messageId);
    if (!deleted) {
      return await interaction.reply({
        content: '⚠️ ログの削除に失敗しました。',
        flags: 64
      });
    }

    // 🖊️ 元メッセージを取り消し状態に更新
    const originalEmbed = message.embeds?.[0];
    const updatedEmbed = EmbedBuilder.from(originalEmbed)
      .setTitle((originalEmbed?.title || '📄 経費申請') + ' [取り消し済]')
      .setColor(0x999999)
      .setFooter({ text: `申請は ${username} により取り消されました` });

    await message.edit({
      content: '🗑️ ~~以下の内容で申請されました：~~（取り消されました）',
      embeds: [updatedEmbed],
      components: [] // ボタン削除
    });

    // 📣 ログ通知を送信（申請元チャンネルに）
    const logEmbed = new EmbedBuilder()
      .setTitle('🗑️ 経費申請が取り消されました')
      .addFields(
        { name: 'ユーザー', value: `<@${userId}>`, inline: true },
        { name: '項目', value: entry.item, inline: true },
        { name: '金額', value: `¥${entry.amount.toLocaleString()}`, inline: true },
        { name: '詳細', value: entry.detail || '（詳細なし）' },
        { name: '日時', value: dayjs().format('YYYY-MM-DD HH:mm') }
      )
      .setColor(0xaaaaaa)
      .setTimestamp();

    await interaction.channel.send({ embeds: [logEmbed] });

    // ✅ 実行者に通知
    await interaction.reply({
      content: '🗑️ 経費申請を取り消しました。',
      flags: 64
    });

  } catch (err) {
    console.error('❌ 取り消し処理エラー:', err);
    try {
      await interaction.reply({
        content: '⚠️ 経費申請の取り消し中にエラーが発生しました。',
        flags: 64
      });
    } catch (e) {
      console.error('⚠️ エラーレスポンス送信失敗:', e);
    }
  }
};
