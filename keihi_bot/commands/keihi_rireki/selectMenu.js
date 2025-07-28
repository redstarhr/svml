// commands/keihi_rireki/selectMenu.js

const { EmbedBuilder } = require('discord.js');
const {
  getExpenseEntries,
  getOrCreateSpreadsheetUrl
} = require('../../utils/fileStorage.js');

module.exports = async function handleHistorySelect(interaction) {
  if (interaction.customId !== 'history_year_month') return;

  const guildId = interaction.guildId;
  const channelId = interaction.channelId;
  const selectedMonths = interaction.values;

  const embeds = [];

  for (const yearMonth of selectedMonths) {
    try {
      const entries = getExpenseEntries(guildId, yearMonth);

      const count = entries.length;
      const total = entries.reduce((sum, e) => sum + (e.amount || 0), 0);
      const nf = new Intl.NumberFormat('ja-JP');

      const spreadsheetUrl = await getOrCreateSpreadsheetUrl(guildId, yearMonth);

      const threadEntry = entries.find(e => e.threadMessageId);
      const threadUrl = threadEntry
        ? `https://discord.com/channels/${guildId}/${channelId}/${threadEntry.threadMessageId}`
        : null;

      const embed = new EmbedBuilder()
        .setTitle(`📅 ${yearMonth} の経費申請履歴`)
        .setColor(0x3498db)
        .addFields(
          { name: '🧾 件数', value: `${count} 件`, inline: true },
          { name: '💰 合計金額', value: `¥${nf.format(total)}`, inline: true },
          { name: '📎 スレッド', value: threadUrl ? `[リンクを開く](${threadUrl})` : '（未登録）' },
          { name: '📄 スプレッドシート', value: spreadsheetUrl ? `[シートを開く](${spreadsheetUrl})` : '（未登録）' }
        );

      embeds.push(embed);
    } catch (err) {
      console.error(`❌ ${yearMonth} の履歴取得中にエラー:`, err);

      embeds.push(
        new EmbedBuilder()
          .setTitle(`⚠️ ${yearMonth} の履歴取得に失敗`)
          .setDescription('エラーが発生しました。後ほど再試行してください。')
          .setColor(0xff0000)
      );
    }
  }

  if (!embeds.length) {
    return interaction.reply({
      content: '📭 表示できる履歴がありませんでした。',
      flags: 64
    });
  }

  await interaction.reply({
    embeds,
    flags: 64
  });
};

