// commands/keihi_setti/edit_submit.js

const { EmbedBuilder } = require('discord.js');
const {
  editExpenseEntry,
  appendExpenseLog
} = require('../../utils/fileStorage.js');
const dayjs = require('dayjs');

module.exports = async function handleEditModal(interaction) {
  if (!interaction.isModalSubmit() || !interaction.customId.startsWith('edit_modal_')) return;

  const messageId = interaction.customId.replace('edit_modal_', '');
  const item = interaction.fields.getTextInputValue('item');
  const amountRaw = interaction.fields.getTextInputValue('amount').replace(/[,¥]/g, '');
  const detail = interaction.fields.getTextInputValue('detail') || '（詳細なし）';

  const amount = parseInt(amountRaw, 10);
  if (isNaN(amount) || amount < 0) {
    return interaction.reply({ content: '⛔ 金額は正の数字で入力してください。', flags: 64 });
  }

  // 🔄 元メッセージ取得
  const originalMsg = await interaction.channel.messages.fetch(messageId).catch(() => null);
  if (!originalMsg) {
    return interaction.reply({ content: '❌ 元メッセージが見つかりません。', flags: 64 });
  }

  const oldEmbed = originalMsg.embeds[0];
  const username = interaction.user.globalName || interaction.user.username;
  const now = new Date();

  // 🔁 修正履歴のカウント（footer）
  const prevFooter = oldEmbed.footer?.text || '';
  const prevCount = (prevFooter.match(/修正\d+/g) || []).length;
  const editCount = prevCount + 1;

  // 🔄 Embed 更新
  const newEmbed = EmbedBuilder.from(oldEmbed)
    .setFields(
      { name: '申請者', value: oldEmbed.fields[0].value, inline: true },
      { name: '金額', value: `¥${amount.toLocaleString()}`, inline: true },
      { name: '内容', value: item },
      { name: '詳細', value: detail }
    )
    .setFooter({ text: `修正${editCount}：${dayjs().format('YYYY-MM-DD HH:mm')}` });

  await originalMsg.edit({ embeds: [newEmbed] });

  // 📦 JSON ログを上書き
  const guildId = interaction.guildId;
  const yearMonth = oldEmbed.timestamp?.slice(0, 7) || dayjs().format('YYYY-MM');
  const success = editExpenseEntry(guildId, yearMonth, messageId, { item, amount, detail });

  // 📓 追記ログ（修正イベントとして）
  appendExpenseLog(guildId, {
    type: 'edit',
    messageId,
    userName: username,
    item,
    amount,
    detail,
    timestamp: now.toISOString()
  });

  await interaction.reply({
    content: '🖊️ 申請内容を修正しました。',
    flags: 64
  });
};

