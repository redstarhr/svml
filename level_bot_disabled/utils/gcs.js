const { saveJsonToGCS, readJsonFromGCS } = require('@common/gcs/gcsUtils');

/**
 * GCSにレベル設定を保存
 * @param {string} guildId - DiscordギルドID
 * @param {object} config - 保存する設定オブジェクト
 */
async function saveLevelConfig(guildId, config) {
  const path = `data-svml/${guildId}/level/config.json`;
  await saveJsonToGCS(path, config);
}

/**
 * GCSからレベル設定を読み込み
 * @param {string} guildId - DiscordギルドID
 * @returns {Promise<object>} - 読み込んだ設定オブジェクト（存在しなければデフォルトを返す）
 */
async function readLevelConfig(guildId) {
  const path = `data-svml/${guildId}/level/config.json`;
  try {
    return await readJsonFromGCS(path);
  } catch (err) {
    // 初期デフォルトを返す
    return {
      stamps: [],
      ignoreRoles: []
    };
  }
}

module.exports = {
  saveLevelConfig,
  readLevelConfig,
};
