// commands/keihi_setti/submit.js

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

const {
  appendExpenseLog,
  getApproverRoles,
  getExpenseEntries
} = require('../../utils/fileStorage.js');

const { getThreadName } = require('../../utils/threadUtils.js');
const { createAndSaveSpreadsheet } = require('../../utils/spreadsheet.js');

module.exports = async function handleModalSubmit(interaction) {
  if (interaction.customId !== 'expense_apply_modal') return;

  try {
    const item = interaction.fields.getTextInputValue('item');
    const amountRaw = interaction.fields.getTextInputValue('amount').replace(/[,¥]/g, '');
    const detail = interaction.fields.getTextInputValue('detail') || '（詳細なし）';

    const amount = parseInt(amountRaw, 10);
    if (isNaN(amount) || amount < 0) {
      return await interaction.reply({
        content: '⛔ 金額は半角の正の数字で入力してください。',
        flags: 64
      });
    }

    const guildId = interaction.guildId;
    const userId = interaction.user.id;
    const userName = interaction.user.globalName || interaction.user.username;
    const channelName = interaction.channel.name;
    const guildName = interaction.guild.name;
    const now = new Date();
    const yearMonth = now.toISOString().slice(0, 7);
    const approverRoles = getApproverRoles(guildId);

    // 🔷 スレッドに送るエンベッド
    const threadEmbed = new EmbedBuilder()
      .setTitle('📄 経費申請')
      .setColor(0x00bfff)
      .addFields(
        { name: '申請者', value: `<@${userId}>`, inline: true },
        { name: '金額', value: `¥${amount.toLocaleString()}`, inline: true },
        { name: '内容', value: item },
        { name: '詳細', value: detail }
      )
      .setFooter({ text: '承認が必要です' })
      .setTimestamp(now);

    // 🔶 ログ送信用のエンベッド
    const logEmbed = new EmbedBuilder()
      .setTitle('🆕 経費申請ログ')
      .setColor(0x2ecc71)
      .addFields(
        { name: '項目', value: item, inline: true },
        { name: '金額', value: `¥${amount.toLocaleString()}`, inline: true },
        { name: '備考', value: detail },
        { name: '申請者', value: `<@${userId}>` }
      )
      .setTimestamp(now);

    // ✅ ボタン定義
    const approveButton = new ButtonBuilder()
      .setCustomId('approve_button')
      .setLabel('✅ 承認する')
      .setStyle(ButtonStyle.Success);

    const editButton = new ButtonBuilder()
      .setCustomId('edit_button')
      .setLabel('🖊️ 修正する')
      .setStyle(ButtonStyle.Secondary);

    const cancelButton = new ButtonBuilder()
      .setCustomId('cancel_button')
      .setLabel('🗑️ 取り消す')
      .setStyle(ButtonStyle.Danger);

    const rowWithButton = new ActionRowBuilder().addComponents(
      approveButton,
      editButton,
      cancelButton
    );

    // 📂 スレッド作成（または既存再利用）
    const allEntries = getExpenseEntries(guildId, yearMonth);
    const threadBase = `経費申請-${yearMonth}`;
    const threadName = getThreadName(threadBase, allEntries.length);

    const threads = await interaction.channel.threads.fetchActive();
    let targetThread = threads.threads.find(t => t.name === threadName);

    if (!targetThread) {
      const msg = await interaction.channel.send({ content: `📂 スレッド「${threadName}」を作成中...` });
      targetThread = await msg.startThread({
        name: threadName,
        autoArchiveDuration: 1440
      });
    }

    // 📩 スレッドに申請内容を送信（ボタンなし）
    const threadMessage = await targetThread.send({
      content: '📝 以下の内容で申請されました：',
      embeds: [threadEmbed]
    });

    // 📄 スプレッドシート作成
    const spreadsheetTitle = `${channelName}_${guildName}_${yearMonth}`;
    const spreadsheetUrl = await createSpreadsheetAndGetUrl(guildId, spreadsheetTitle);

    // 📃 ログチャンネルに送信（ボタン付き）
    await interaction.channel.send({
      content: '🆕 経費申請を受け付けました：',
      embeds: [logEmbed],
      components: [rowWithButton]
    });

    // 📌 ログファイル保存
    appendExpenseLog(guildId, yearMonth, {
      userId,
      userName,
      item,
      amount,
      detail,
      timestamp: now.toISOString(),
      threadMessageId: threadMessage.id,
      spreadsheetUrl,
      approvedBy: []
    });

    // 📬 申請者にスプレッドシートURLを表示
    await interaction.reply({
      content: `✅ 経費申請を受け付けました。\n📎 あなた専用の履歴URLはこちら：\n${spreadsheetUrl}`,
      flags: 64
    });

  } catch (err) {
    console.error('❌ モーダル送信処理エラー:', err);
    await interaction.reply({
      content: '⚠️ 経費申請の送信中にエラーが発生しました。',
      flags: 64
    });
  }
};

