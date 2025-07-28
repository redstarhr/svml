// utils/storage.js
const { Storage } = require('@google-cloud/storage');

// GCSクライアントを初期化
const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME;

if (!bucketName) {
  throw new Error('環境変数 GCS_BUCKET_NAME が設定されていません。');
}

/**
 * GCSにJSONデータを保存する
  }
}

/**
 * GCSに文字列データを保存する
 * @param {string} filePath - GCS上のファイルパス
 * @param {string} content - 保存する文字列
 */
async function saveStringToGCS(filePath, content) {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath);
  await file.save(content, {
    contentType: 'text/csv; charset=utf--8',
  });
  console.log(`[GCS] 📝 ${filePath} に文字列を保存しました。`);
}

/**
 * GCSから文字列データを読み込む
 * @param {string} filePath - GCS上のファイルパス
 * @returns {Promise<string|null>} - 読み込んだ文字列データ、ファイルが存在しない場合はnull
 */
/**
 * JSONデータを指定のパスに保存
 * @param {string} filePath - GCS上の保存先パス（例: data/sales_reports/guildId/filename.json）
 * @param {object} data - 保存するJSONオブジェクト
 * @throws ファイル保存に失敗した場合は例外をスローします
 */
async function saveJsonToGCS(filePath, data) {
  try {
    const file = storage.bucket(bucketName).file(filePath);
    const content = JSON.stringify(data, null, 2);
    await file.save(content, {
      contentType: 'application/json',
      resumable: false,
      metadata: {
        metadata: {
          updated_by: data.入力者 || 'N/A',
          updated_at: new Date().toISOString(),
        }
      }
    });
  } catch (error) {
    console.error(`❌ GCSへのJSON保存エラー: ${filePath}`, error);
    throw error;
  }
}

/**
 * 特定のprefixにマッチするファイル一覧を取得
 * @param {string} prefix - ファイルパスの先頭部分（例: data/sales_reports/guildId/）
 * @returns {Promise<Array>} - 該当するファイルオブジェクトの配列
 * @throws ファイル一覧取得に失敗した場合は例外をスローします
 */
async function listFilesInGCS(prefix) {
  try {
    const [files] = await storage.bucket(bucketName).getFiles({ prefix });
    return files;
  } catch (error) {
    console.error(`❌ GCSのファイル一覧取得エラー: ${prefix}`, error);
    throw error;
  }
}

/**
 * GCSファイルの署名付きURLを生成
 * @param {string} filePath - 対象ファイルのGCSパス
 * @param {number} expiresInMinutes - 有効期限（分）
 * @returns {Promise<string>} - 署名付きURL
 * @throws 署名付きURL生成に失敗した場合は例外をスローします
 */
async function generateSignedUrl(filePath, expiresInMinutes = 15, action = 'read') {
  try {
    const options = {
      version: 'v4',
      action: action,
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    };

    const [url] = await storage.bucket(bucketName).file(filePath).getSignedUrl(options);
    return url;
  } catch (error) {
    console.error(`❌ GCS署名付きURL生成エラー: ${filePath}`, error);
    throw error;
  }
}

/**
 * GCS上のファイルをコピーする
 * @param {string} sourcePath - コピー元ファイルパス
 * @param {string} destinationPath - コピー先ファイルパス
 * @throws ファイルコピーに失敗した場合は例外をスローします
 */
async function copyGCSFile(sourcePath, destinationPath) {
  try {
    const bucket = storage.bucket(bucketName);
    const sourceFile = bucket.file(sourcePath);
    const destinationFile = bucket.file(destinationPath);

    const [exists] = await sourceFile.exists();
    if (exists) {
      await sourceFile.copy(destinationFile);
    }
  } catch (error) {
    console.error(`❌ GCSファイルコピーエラー: ${sourcePath} -> ${destinationPath}`, error);
    throw error;
  }
}

/**
 * GCSからJSONファイルを読み込む
 * @param {string} filePath - 対象ファイルのGCSパス
 * @returns {Promise<object|null>} - 読み込んだJSONオブジェクト。ファイルが存在しない場合はnull。
 * @throws ファイル読み込みに失敗した場合は例外をスローします
 */
async function readJsonFromGCS(filePath) {
  try {
    const file = storage.bucket(bucketName).file(filePath);
    const [exists] = await file.exists();
    if (!exists) {
      return null;
    }
    const [content] = await file.download();
    return JSON.parse(content.toString());
  } catch (error) {
    console.error(`❌ GCSからのJSON読み込みエラー: ${filePath}`, error);
    throw error;
  }
}

/**
 * GCS上のファイルを削除する
 * @param {string} filePath - 削除対象ファイルのGCSパス
 * @throws ファイル削除に失敗した場合は例外をスローします
 */
async function deleteGCSFile(filePath) {
  try {
    await storage.bucket(bucketName).file(filePath).delete();
  } catch (error) {
    // ファイルが存在しないエラー(code: 404)は無視して良い場合が多い
    if (error.code !== 404) {
      console.error(`❌ GCSファイル削除エラー: ${filePath}`, error);
      throw error;
    }
  }
}

module.exports = {
  saveJsonToGCS,
  listFilesInGCS,
  generateSignedUrl,
  copyGCSFile,
  readJsonFromGCS,
  deleteGCSFile,
};
