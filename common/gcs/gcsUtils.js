// common/gcs/gcsUtils.js
const { Storage } = require('@google-cloud/storage');

const bucketName = process.env.GCS_BUCKET_NAME;
if (!bucketName) {
  throw new Error('[gcsUtils] 環境変数 GCS_BUCKET_NAME が設定されていません。');
}

const storage = new Storage();
const bucket = storage.bucket(bucketName);

/**
 * 指定したファイルがGCSに存在するか確認する
 * @param {string} filePath 
 * @returns {Promise<boolean>}
 */
async function exists(filePath) {
  try {
    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    console.error(`[gcsUtils.exists] ファイル存在チェックエラー: ${filePath}`, error);
    throw error;
  }
}

/**
 * GCSにJSONデータを保存する
 * @param {string} filePath GCS上のファイルパス
 * @param {object} data JSONオブジェクト
 * @returns {Promise<boolean>} 成功したらtrue
 * @throws エラー時に例外スロー
 */
async function saveJsonToGCS(filePath, data) {
  try {
    const file = bucket.file(filePath);
    const content = JSON.stringify(data, null, 2);
    await file.save(content, {
      contentType: 'application/json',
      resumable: false,
    });
    console.log(`[gcsUtils.saveJsonToGCS] 💾 ${filePath} にJSONを保存しました。`);
    return true;
  } catch (error) {
    console.error(`[gcsUtils.saveJsonToGCS] ❌ 保存エラー: ${filePath}`, error);
    throw error;
  }
}

/**
 * GCSからJSONファイルを読み込む
 * @param {string} filePath GCSのファイルパス
 * @returns {Promise<object|null>} JSONオブジェクト。存在しなければnull
 * @throws エラー時に例外スロー（404はnull返し）
 */
async function readJsonFromGCS(filePath) {
  try {
    const file = bucket.file(filePath);
    const [existsFlag] = await file.exists();
    if (!existsFlag) return null;

    const [content] = await file.download();
    return JSON.parse(content.toString('utf8'));
  } catch (error) {
    if (error.code === 404) {
      return null;
    }
    console.error(`[gcsUtils.readJsonFromGCS] ❌ 読み込みエラー: ${filePath}`, error);
    throw error;
  }
}

/**
 * GCSでprefixにマッチするファイル一覧を取得
 * @param {string} prefix ファイルパスのプレフィックス
 * @returns {Promise<Array>} ファイルオブジェクト配列
 * @throws 例外スロー
 */
async function listFilesInGCS(prefix) {
  try {
    const [files] = await bucket.getFiles({ prefix });
    return files;
  } catch (error) {
    console.error(`[gcsUtils.listFilesInGCS] ❌ ファイル一覧取得エラー: ${prefix}`, error);
    throw error;
  }
}

/**
 * GCS上の指定ファイルを削除
 * @param {string} filePath 削除対象ファイルパス
 * @returns {Promise<boolean>} 削除成功でtrue
 * @throws 例外スロー（404は無視）
 */
async function deleteGCSFile(filePath) {
  try {
    await bucket.file(filePath).delete();
    console.log(`[gcsUtils.deleteGCSFile] 🗑️ ${filePath} を削除しました。`);
    return true;
  } catch (error) {
    if (error.code === 404) {
      // ファイルなしは削除成功とみなす
      return true;
    }
    console.error(`[gcsUtils.deleteGCSFile] ❌ 削除エラー: ${filePath}`, error);
    throw error;
  }
}

module.exports = {
  exists,
  saveJsonToGCS,
  readJsonFromGCS,
  listFilesInGCS,
  deleteGCSFile,
};
