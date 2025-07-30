const fs = require('node:fs').promises;
const path = require('node:path');
const { stringify } = require('csv-stringify/sync');

const DATA_DIR = path.join(__dirname, '..', '..', 'data-svml');

/**
 * 経費申請データをCSVファイルとして保存します。
 * @param {import('discord.js').Guild} guild - ギルドオブジェクト
 * @param {import('discord.js').User} user - ユーザーオブジェクト
 * @param {object} expenseData - 経費データ
 * @param {string} expenseData.date - 日付 (YYYY-MM-DD)
 * @param {string} expenseData.category - 項目
 * @param {string} expenseData.amount - 金額
 * @param {string} expenseData.note - 備考
 * @returns {Promise<string>} 保存されたファイルへのパス
 */
async function saveExpenseAsCsv(guild, user, expenseData) {
  const guildDir = path.join(DATA_DIR, guild.id, '経費申請');
  await fs.mkdir(guildDir, { recursive: true });

  // ファイル名の重複を避けるためにタイムスタンプを追加
  const timestamp = new Date().getTime();
  const fileName = `${expenseData.date}_${user.username}_${timestamp}_経費申請.csv`;
  const filePath = path.join(guildDir, fileName);

  const csvData = [
    ['申請日', '申請者ID', '申請者名', '支払日', '項目', '金額', '備考', 'ステータス'],
    [new Date().toLocaleDateString('ja-JP'), user.id, user.tag, expenseData.date, expenseData.category, expenseData.amount, expenseData.note, 'pending']
  ];

  const csvString = stringify(csvData);
  await fs.writeFile(filePath, csvString, 'utf-8');

  return filePath;
}

module.exports = { saveExpenseAsCsv };