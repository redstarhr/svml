const path = require('path');
const fs = require('fs');

function getExpenseSheetUrl(guildId, userId) {
  const baseDir = path.join(__dirname, '..', 'data', guildId);
  if (!fs.existsSync(baseDir)) return null;

  // 直近の年月フォルダを探す（降順）
  const files = fs.readdirSync(baseDir)
    .filter(f => f.endsWith('.json') || f.endsWith('.txt') || f.endsWith('.url'))
    .sort()
    .reverse();

  for (const file of files) {
    const filepath = path.join(baseDir, file);
    if (fs.statSync(filepath).isFile() && file.endsWith('.url')) {
      const content = fs.readFileSync(filepath, 'utf8');
      if (content.includes(userId)) {
        return content.split('\n')[0]; // 1行目にURLがあると仮定
      }
    }
  }

  return null;
}
module.exports = {
  // 既存の createExpenseSheet() と併せてエクスポート
  createExpenseSheet: require('./createExpenseSheet.js'), // 仮
  getExpenseSheetUrl
};
