// utils/uriage_modals.js

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { normalizeDate } = require('./date');
const { saveJsonToGCS, copyGCSFile, readJsonFromGCS, deleteGCSFile } = require('./gcs');
const path = require('path');

/**
 * モーダルから送信されたデータを検証し、数値に変換するヘルパー関数
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 * @returns {{data: object, error: string|null}}
 */
function parseAndValidateReportData(interaction) {
  const dateInput = interaction.fields.getTextInputValue('report_date');
  const total = interaction.fields.getTextInputValue('report_total');
  const cash = interaction.fields.getTextInputValue('report_cash');
  const card = interaction.fields.getTextInputValue('report_card');
  const expense = interaction.fields.getTextInputValue('report_expense');

  const isValid = [total, cash, card, expense].every(v => /^-?\d+$/.test(v));
  if (!isValid) {
    return { data: null, error: '金額はすべて半角数字で入力してください。' };
  }

  const normalizedDate = normalizeDate(dateInput);
  if (!normalizedDate) {
    return { data: null, error: '日付の形式が正しくありません。「月/日」の形式で入力してください。(例: 7/18)' };
  }

  const totalNum = parseInt(total, 10);
  const cashNum = parseInt(cash, 10);
  const cardNum = parseInt(card, 10);
  const expenseNum = parseInt(expense, 10);
  const balance = totalNum - (cardNum + expenseNum);

  return {
    data: { normalizedDate, totalNum, cashNum, cardNum, expenseNum, balance },
    error: null,
  };
}

module.exports = {
  async execute(interaction) {
    if (!interaction.isModalSubmit()) return false;

    if (interaction.customId === 'sales_report_modal') {
      const { data, error } = parseAndValidateReportData(interaction);
      if (error) { return interaction.reply({ content: error, ephemeral: true }); }
      const { normalizedDate, totalNum, cashNum, cardNum, expenseNum, balance } = data;

      // Embedメッセージを作成
      const embed = new EmbedBuilder()
        .setTitle('📈 売上報告')
        .setColor(0x0099ff)
        .setDescription(`${interaction.user} さんからの報告です。`)
        .addFields(
          { name: '日付', value: normalizedDate, inline: true },
          { name: '総売り', value: `¥${totalNum.toLocaleString()}`, inline: true },
          { name: '現金', value: `¥${cashNum.toLocaleString()}`, inline: true },
          { name: 'カード', value: `¥${cardNum.toLocaleString()}`, inline: true },
          { name: '諸経費', value: `¥${expenseNum.toLocaleString()}`, inline: true },
          { name: '残金', value: `¥${balance.toLocaleString()}`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `報告者: ${interaction.user.username}` });

      // ボタンを作成
      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('sales_report')
          .setLabel('次の売上を報告')
          .setStyle(ButtonStyle.Success)
      );

      // GCSから承認ロール設定を読み込み、メンバー数を取得
      const settingsPath = `data/${interaction.guildId}/${interaction.guildId}.json`;
      const settings = await readJsonFromGCS(settingsPath) || {};
      const approvalRoleIds = settings.approvalRoleIds || [];

      let totalConfirmers = 0;
      if (approvalRoleIds.length > 0) {
        try {
          await interaction.guild.members.fetch(); // 最新のメンバー情報を取得
          const membersWithAnyRole = new Set();
          for (const roleId of approvalRoleIds) {
            const role = await interaction.guild.roles.fetch(roleId);
            if (role) {
              role.members.forEach(member => membersWithAnyRole.add(member.id));
            }
          }
          totalConfirmers = membersWithAnyRole.size;
        } catch (error) {
          console.error('[uriage_modals] 確認ロールのメンバー数取得中にエラーが発生しました:', error);
        }
      } else {
        console.warn(`[uriage_modals] 承認ロールが設定されていません。「/売上報告設定」コマンドで設定してください。`);
      }

      const channel = interaction.channel;

      // カテゴリ名を取得（nullの可能性あり）
      const category = channel.parent;

      const categoryName = category?.name || 'カテゴリなし';
      const userId = interaction.user.id;

      // --- GCSへの保存処理 ---
      const guildId = interaction.guildId;
      const filePath = `data/sales_reports/${guildId}/uriage-houkoku-${normalizedDate}-${userId}.json`;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const logPath = `logs/sales_reports/${guildId}/uriage-houkoku-${normalizedDate}-${userId}_${timestamp}.json`;

      const salesData = {
        入力者: interaction.user.username, // 表示名はusernameのまま
        userId: userId,
        日付: normalizedDate,
        総売り: totalNum,
        現金: cashNum,
        カード: cardNum,
        諸経費: expenseNum,
        残金: balance,
        登録日時: new Date().toISOString(),
        messageId: null, // 返信後にIDをセットする
      };

      try {
        // 既存のファイルをバックアップ
        await copyGCSFile(filePath, logPath);
        // 新しいデータを保存
        await saveJsonToGCS(filePath, salesData);

        // TODO: 承認機能は未実装のため、承認数は '0' で固定
        const replyContent = `💮 <@${interaction.user.id}>さん💮が『${categoryName}』の売上報告。\n申請日：${normalizedDate} ✅『承認 (0/${totalConfirmers})』`;
        const replyMessage = await interaction.reply({
          content: replyContent,
          embeds: [embed],
          components: [buttons],
          fetchReply: true, // メッセージオブジェクトを取得するために必要
        });

        // 保存したデータにメッセージIDを追記して再保存
        salesData.messageId = replyMessage.id;
        await saveJsonToGCS(filePath, salesData);

      } catch (error) {
        console.error('❌ 売上報告の保存または返信中にエラー:', error);
        await interaction.reply({
          content: 'エラーが発生し、売上報告を保存できませんでした。',
          ephemeral: true,
        });
      }

      return true;
    }

    if (interaction.customId.startsWith('edit_sales_report_modal_')) {
      const [, originalDate, userId] = interaction.customId.split('_');

      const { data, error } = parseAndValidateReportData(interaction);
      if (error) { return interaction.reply({ content: error, ephemeral: true }); }
      const { normalizedDate, totalNum, cashNum, cardNum, expenseNum, balance } = data;

      // --- 新しいEmbedを作成 ---
      const embed = new EmbedBuilder()
        .setTitle('📈 売上報告 (修正済み)')
        .setColor(0x0099ff)
        .setDescription(`${interaction.user} さんからの報告です。`)
        .addFields(
          { name: '日付', value: normalizedDate, inline: true },
          { name: '総売り', value: `¥${totalNum.toLocaleString()}`, inline: true },
          { name: '現金', value: `¥${cashNum.toLocaleString()}`, inline: true },
          { name: 'カード', value: `¥${cardNum.toLocaleString()}`, inline: true },
          { name: '諸経費', value: `¥${expenseNum.toLocaleString()}`, inline: true },
          { name: '残金', value: `¥${balance.toLocaleString()}`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `報告者: ${interaction.user.username}` });

      // --- customIdを更新した新しいボタンを作成 ---
      const newButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('sales_report')
          .setLabel('次の売上を報告')
          .setStyle(ButtonStyle.Success)
      );

      // --- GCSとDiscordメッセージの更新処理 ---
      const guildId = interaction.guildId;

      // customIdからuserIdを取得しているので、それを使用する
      const originalFilePath = `data/sales_reports/${guildId}/uriage-houkoku-${originalDate}-${userId}.json`;
      const newFilePath = `data/sales_reports/${guildId}/uriage-houkoku-${normalizedDate}-${userId}.json`;

      try {
        // messageIdを取得するために元のデータを読み込む
        const originalData = await readJsonFromGCS(originalFilePath);
        if (!originalData || !originalData.messageId) {
          return interaction.reply({ content: '元の報告データが見つからないか、データが破損しているため、修正できませんでした。', ephemeral: true });
        }

        // 日付が変更された場合、古いファイルを削除
        if (originalFilePath !== newFilePath) {
          await deleteGCSFile(originalFilePath);
        }

        // 元のmessageIdと登録日時を保持して新しいデータを作成
        const newSalesData = {
          ...originalData,
          入力者: interaction.user.username, // 修正者のusernameに更新
          userId: userId,
          日付: normalizedDate,
          総売り: totalNum,
          現金: cashNum,
          カード: cardNum,
          諸経費: expenseNum,
          残金: balance,
        };

        // 新しいデータを保存
        await saveJsonToGCS(newFilePath, newSalesData);

        // 元のメッセージを取得
        const messageToEdit = await interaction.channel.messages.fetch(originalData.messageId);

        // 日付が変更された場合、メッセージのテキスト部分も更新
        let newContent = messageToEdit.content;
        if (originalDate !== normalizedDate) {
          newContent = newContent.replace(`申請日：${originalDate}`, `申請日：${normalizedDate}`);
        }

        // メッセージを更新
        await messageToEdit.edit({
          content: newContent,
          embeds: [embed],
          components: [newButtons]
        });

        await interaction.reply({ content: '報告を正常に修正しました。', ephemeral: true });

      } catch (error) {
        console.error('❌ 売上報告の修正中にエラー:', error);
        return interaction.reply({ content: 'エラーが発生し、報告を修正できませんでした。', ephemeral: true });
      }
      return true;
    }

    return false;
  },
};