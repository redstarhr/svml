// hikkake_bot/utils/hikkakeReactionManager.js

const { readJsonFromGCS, saveJsonToGCS, listFilesInGCS, deleteGCSFile } = require('../../common/gcs/gcsUtils');

const basePath = 'hikkake';

/**
 * GCS 上のファイルパスを生成（例: hikkake/<GUILD_ID>/reactions.json）
 * @param {string} guildId 
 * @returns {string}
 */
function getReactionFilePath(guildId) {
  return `${basePath}/${guildId}/reactions.json`;
}

/**
 * リアクション初期構造
 * @returns {object}
 */
function getDefaultReactions() {
  return {
    quest: {},  // 例: quest["1人"] = ["ありがとう！", "助かる！"]
    tosu: {},
    horse: {}
  };
}

/**
 * リアクション設定を GCS から読み込み
 * @param {string} guildId 
 * @returns {Promise<object>}
 */
async function readReactions(guildId) {
  const filePath = getReactionFilePath(guildId);
  const reactions = await readJsonFromGCS(filePath);
  if (reactions === null) {
    console.log(`[GCS] 初期reactionファイル作成: ${filePath}`);
    return getDefaultReactions();
  }
  return reactions;
}

/**
 * リアクション設定を GCS に保存
 * @param {string} guildId 
 * @param {object} reactionsData 
 * @returns {Promise<void>}
 */
async function writeReactions(guildId, reactionsData) {
  await saveJsonToGCS(getReactionFilePath(guildId), reactionsData);
}

/**
 * リアクションをランダムに取得（存在しない場合は null）
 * @param {object} reactions 全体のリアクション設定
 * @param {'quest'|'tosu'|'horse'} type カテゴリ
 * @param {'num'|'count'} key 'num' (人数) or 'count' (本数)
 * @param {number} value 対象の人数や本数
 * @returns {string|null}
 */
function getRandomReaction(reactions, type, key, value) {
  const valueKey = String(value);
  const list = reactions?.[type]?.[key]?.[valueKey] || [];
  if (!Array.isArray(list) || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

module.exports = {
  readReactions,
  writeReactions,
  getRandomReaction,
};
