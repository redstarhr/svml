// utils/driveUtils.js
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const drive = google.drive('v3');
const FOLDER_FILE = path.join(__dirname, '../data/guild_drive_folders.json');

// JSONファイルからキャッシュを読み込み
function loadFolderCache() {
  try {
    if (!fs.existsSync(FOLDER_FILE)) return {};
    return JSON.parse(fs.readFileSync(FOLDER_FILE, 'utf-8'));
  } catch (err) {
    console.error('❌ フォルダキャッシュ読み込み失敗:', err);
    return {};
  }
}

// JSONファイルに保存
function saveFolderCache(cache) {
  try {
    fs.writeFileSync(FOLDER_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (err) {
    console.error('❌ フォルダキャッシュ保存失敗:', err);
  }
}

/**
 * 指定 guildId に対応する Google Drive フォルダIDを取得または作成
 * 初回作成時に「誰でも閲覧可」の共有権限を付与
 * @param {string} guildId
 * @returns {Promise<string>} folderId
 */
async function getOrCreateGuildFolder(guildId) {
  const cache = loadFolderCache();
  if (cache[guildId]) return cache[guildId];

  try {
    const res = await drive.files.create({
      requestBody: {
        name: `keihi_logs_${guildId}`,
        mimeType: 'application/vnd.google-apps.folder'
      }
    });

    const folderId = res.data.id;
    cache[guildId] = folderId;
    saveFolderCache(cache);

    console.log(`📁 フォルダ作成完了: ${folderId} for ${guildId}`);

    // ✅ 初回作成時に「誰でも閲覧可能」に設定
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        type: 'anyone',
        role: 'reader'
      }
    });
    console.log(`🔓 フォルダ公開設定完了 (reader)`);

    return folderId;
  } catch (err) {
    console.error('❌ Drive フォルダ作成失敗:', err);
    throw err;
  }
}

module.exports = {
  getOrCreateGuildFolder
};
