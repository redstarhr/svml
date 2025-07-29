// uriage_bot/commands/uriage_csv.js

const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const { listFilesInGCS, readJsonFromGCS } = require('../../common/gcs/gcsUtils');
const { DateTime } = require('luxon');

/**
 * CSVのフィールドをエスケープ処理します。
 * @param {string | number | null | undefined} field
 * @returns {string}
 */
function escapeCsvField(field) {
    const str = String(field ?? ''); // nullやundefinedを空文字に変換
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        // ダブルクォートで囲み、内部のダブルクォートは2つにエスケープ
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uriage_csv_export')
    .setDescription('指定した期間の売上報告をCSVファイルとして出力します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option => option.setName('開始日').setDescription('集計開始日 (YYYY-MM-DD)').setRequired(true))
    .addStringOption(option => option.setName('終了日').setDescription('集計終了日 (YYYY-MM-DD)').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.guildId;
    const startDateStr = interaction.options.getString('開始日');
    const endDateStr = interaction.options.getString('終了日');

    const startDate = DateTime.fromISO(startDateStr, { zone: 'Asia/Tokyo' });
    const endDate = DateTime.fromISO(endDateStr, { zone: 'Asia/Tokyo' });

    if (!startDate.isValid || !endDate.isValid) {
        return interaction.editReply('⚠️ 日付の形式が正しくありません。`YYYY-MM-DD`形式で入力してください。');
    }

    if (startDate > endDate) {
        return interaction.editReply('⚠️ 開始日は終了日より前の日付である必要があります。');
    }

    try {
        const prefix = `data/${guildId}/uriagehoukoku_`;
        const allReportFiles = await listFilesInGCS(prefix);

        const reports = [];
        for (const file of allReportFiles) {
            const dateMatch = file.name.match(/uriagehoukoku_(\d{4}-\d{2}-\d{2})\.json$/);
            if (!dateMatch) continue;

            const reportDate = DateTime.fromISO(dateMatch[1], { zone: 'Asia/Tokyo' });
            if (reportDate >= startDate && reportDate <= endDate) {
                const data = await readJsonFromGCS(file.name);
                if (data) reports.push(data);
            }
        }

        if (reports.length === 0) {
            return interaction.editReply('指定された期間に該当する売上報告データが見つかりませんでした。');
        }

        reports.sort((a, b) => new Date(a.date) - new Date(b.date));

        const csvHeader = ['日付', '総売り', '現金', 'カード', '諸経費', '残金', '報告者', '承認ステータス', '承認者', '承認日時'].join(',');
        const csvRows = reports.map(r => [
            r.date, r.totalSales, r.cashSales, r.cardSales, r.expenses,
            (r.totalSales - r.cashSales - r.expenses),
            r.reporterTag, r.approval?.status ?? '未処理', r.approval?.approverTag ?? '',
            r.approval?.approvedAt ? DateTime.fromISO(r.approval.approvedAt).setZone('Asia/Tokyo').toFormat('yyyy-MM-dd HH:mm') : ''
        ].map(escapeCsvField).join(','));

        const csvContent = [csvHeader, ...csvRows].join('\n');
        const csvBuffer = Buffer.from('\uFEFF' + csvContent, 'utf8'); // Add BOM for Excel

        const attachment = new AttachmentBuilder(csvBuffer, { name: `売上報告_${startDateStr}_to_${endDateStr}.csv` });

        await interaction.editReply({ content: `✅ ${startDateStr} から ${endDateStr} までの売上報告（${reports.length}件）をCSVファイルとして出力しました。`, files: [attachment] });

    } catch (error) {
        console.error('❌ CSV出力処理中にエラー:', error);
        await interaction.editReply('CSVファイルの生成中にエラーが発生しました。');
    }
  },
};
