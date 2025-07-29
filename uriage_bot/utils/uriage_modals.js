// uriage_bot/utils/uriage_modals.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { readJsonFromGCS, saveJsonToGCS, deleteGCSFile, copyGCSFile } = require('../../common/gcs/gcsUtils');
const { parseAndValidateReportData } = require('./salesReportUtils');
const { DateTime } = require('luxon');

/**
 * Handles the submission of a new sales report.
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 */
async function handleNewSalesReport(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const { data, error } = parseAndValidateReportData(interaction);
    if (error) {
        return interaction.editReply({ content: error });
    }
    const { normalizedDate, totalNum, cashNum, cardNum, expenseNum, balance } = data;

    const guildId = interaction.guildId;
    const userId = interaction.user.id;
    const filePath = `data/sales_reports/${guildId}/uriage-houkoku-${normalizedDate}-${userId}.json`;

    const existingReport = await readJsonFromGCS(filePath);
    if (existingReport) {
        return interaction.editReply({ content: `⚠️ ${normalizedDate} の報告は既に存在します。修正する場合は「報告を修正」ボタンから操作してください。` });
    }

    const embed = new EmbedBuilder()
        .setTitle('📈 売上報告')
        .setColor(0x00ff00) // Green
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

    const reportMessage = await interaction.channel.send({ embeds: [embed] });

    const salesData = {
        入力者: interaction.user.username,
        userId: userId,
        日付: normalizedDate,
        総売り: totalNum,
        現金: cashNum,
        カード: cardNum,
        諸経費: expenseNum,
        残金: balance,
        登録日時: new Date().toISOString(),
        messageId: reportMessage.id
    };

    await saveJsonToGCS(filePath, salesData);
    await interaction.editReply({ content: '✅ 売上報告を記録しました。' });
}

/**
 * Handles the submission of an edited sales report.
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 */
async function handleEditSalesReport(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const match = interaction.customId.match(/^edit_sales_report_modal_(\d{4}-\d{2}-\d{2})_(\d+)$/);
    const [, originalDate, userId] = match;

    const { data, error } = parseAndValidateReportData(interaction);
    if (error) {
        return interaction.editReply({ content: error });
    }
    const { normalizedDate, totalNum, cashNum, cardNum, expenseNum, balance } = data;

    const guildId = interaction.guildId;
    const originalFilePath = `data/sales_reports/${guildId}/uriage-houkoku-${originalDate}-${userId}.json`;
    const newFilePath = `data/sales_reports/${guildId}/uriage-houkoku-${normalizedDate}-${userId}.json`;

    const originalData = await readJsonFromGCS(originalFilePath);
    if (!originalData || !originalData.messageId) {
        return interaction.editReply({ content: '元の報告データが見つからないか、データが破損しているため、修正できませんでした。' });
    }

    const timestamp = DateTime.now().toFormat('yyyyMMddHHmmss');
    const backupPath = `logs/sales_reports/${guildId}/uriage-houkoku-${originalDate}-${userId}_${timestamp}.json`;
    await copyGCSFile(originalFilePath, backupPath);

    if (originalFilePath !== newFilePath) {
        await deleteGCSFile(originalFilePath);
    }

    const newSalesData = { ...originalData, 入力者: interaction.user.username, userId: userId, 日付: normalizedDate, 総売り: totalNum, 現金: cashNum, カード: cardNum, 諸経費: expenseNum, 残金: balance, 修正日時: new Date().toISOString(), 修正者: interaction.user.username, 修正者ID: interaction.user.id };
    await saveJsonToGCS(newFilePath, newSalesData);

    const embed = new EmbedBuilder()
        .setTitle('📈 売上報告 (修正済み)')
        .setColor(0xffa500) // Orange
        .addFields(
            { name: '日付', value: normalizedDate, inline: true },
            { name: '総売り', value: `¥${totalNum.toLocaleString()}`, inline: true },
            { name: '現金', value: `¥${cashNum.toLocaleString()}`, inline: true },
            { name: 'カード', value: `¥${cardNum.toLocaleString()}`, inline: true },
            { name: '諸経費', value: `¥${expenseNum.toLocaleString()}`, inline: true },
            { name: '残金', value: `¥${balance.toLocaleString()}`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `修正者: ${interaction.user.username}` });

    try {
        const messageToEdit = await interaction.channel.messages.fetch(originalData.messageId);
        await messageToEdit.edit({ embeds: [embed] });
        await interaction.editReply({ content: '✅ 報告を正常に修正しました。' });
    } catch (e) {
        console.error('Failed to edit original sales report message:', e);
        await interaction.editReply({ content: '✅ 報告データの修正は完了しましたが、元のメッセージの更新に失敗しました。削除された可能性があります。' });
    }
}

module.exports = {
    async execute(interaction) {
        if (!interaction.isModalSubmit()) return false;
        if (interaction.customId === 'sales_report_modal') return await handleNewSalesReport(interaction), true;
        if (interaction.customId.startsWith('edit_sales_report_modal_')) return await handleEditSalesReport(interaction), true;
        return false;
    }
};