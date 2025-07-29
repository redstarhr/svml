// uriage_bot/utils/salesReportUtils.js
const { DateTime } = require('luxon');

/**
 * Parses and validates data from a sales report modal interaction.
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 * @returns {{data: object|null, error: string|null}}
 */
function parseAndValidateReportData(interaction) {
    const dateStr = interaction.fields.getTextInputValue('report_date');
    const totalStr = interaction.fields.getTextInputValue('report_total');
    const cashStr = interaction.fields.getTextInputValue('report_cash');
    const cardStr = interaction.fields.getTextInputValue('report_card');
    const expenseStr = interaction.fields.getTextInputValue('report_expense');

    // Date normalization (e.g., '7/23' -> '2024-07-23')
    const now = DateTime.now().setZone('Asia/Tokyo');
    let reportDate = DateTime.fromFormat(dateStr, 'M/d', { zone: 'Asia/Tokyo' });
    if (!reportDate.isValid) {
        reportDate = DateTime.fromFormat(dateStr, 'M-d', { zone: 'Asia/Tokyo' });
    }
    if (!reportDate.isValid) {
        return { data: null, error: '日付の形式が正しくありません。「7/23」のように入力してください。' };
    }
    // If the parsed date is in the future, assume it's for the previous year
    if (reportDate > now) {
        reportDate = reportDate.minus({ years: 1 });
    }
    const normalizedDate = reportDate.toFormat('yyyy-MM-dd');

    // Number validation
    const totalNum = parseInt(totalStr.replace(/,/g, ''), 10);
    const cashNum = parseInt(cashStr.replace(/,/g, ''), 10);
    const cardNum = parseInt(cardStr.replace(/,/g, ''), 10);
    const expenseNum = parseInt(expenseStr.replace(/,/g, ''), 10);

    if ([totalNum, cashNum, cardNum, expenseNum].some(isNaN)) {
        return { data: null, error: '金額は半角数字で入力してください。' };
    }

    // Calculation
    const balance = totalNum - cardNum - expenseNum;

    return {
        data: { normalizedDate, totalNum, cashNum, cardNum, expenseNum, balance },
        error: null,
    };
}

module.exports = { parseAndValidateReportData };