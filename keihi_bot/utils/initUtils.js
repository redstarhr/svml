// utils/initUtils.js
const fs = require('fs');
const path = require('path');
const { getDataPath } = require('./pathUtils.js');

/**
 * ギルドごとの data フォルダを確認・作成
 */
function ensureDataFolder(guildId) {
  const guildDir = getDataPath(guildId);
  if (!fs.existsSync(guildDir)) {
    fs.mkdirSync(guildDir, { recursive: true });
    console.log(`📁 データフォルダ作成: ${guildDir}`);
  }
}

/**
 * data フォルダ全体をバックアップ（data_backup_YYYYMMDD）
 */
function backupDataFiles() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const srcDir = process.env.BASE_DIR || './data';
  const backupDir = `${srcDir}_backup_${dateStr}`;

  if (!fs.existsSync(srcDir)) return;

  fs.cpSync(srcDir, backupDir, { recursive: true });
  console.log(`🗄️ データバックアップ作成: ${backupDir}`);
}

module.exports = {
  ensureDataFolder,
  backupDataFiles
};

