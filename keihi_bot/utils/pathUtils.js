const path = require('path');
require('dotenv').config();

/**
 * BASE_DIR を考慮したデータ保存パスを構築
 * @param  {...string} segments - guildId, ファイル名など
 * @returns {string} 絶対パス
 */
function getDataPath(...segments) {
  const baseDir = process.env.BASE_DIR || './data';
  return path.join(baseDir, ...segments);
}

module.exports = {
  getDataPath
};
