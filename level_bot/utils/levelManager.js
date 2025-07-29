const { readJsonFromGCS, saveJsonToGCS } = require('@common/gcs/gcsUtils');
const { getConfig } = require('./levelConfigManager');
const logger = require('@common/logger');

const getUserDataPath = (guildId, userId) => `level_bot/${guildId}/users/${userId}.json`;

const defaultUserData = {
  xp: 0,
  level: 0,
  lastMessageTimestamp: 0,
};

/**
 * ユーザーのレベルデータを取得します。
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<typeof defaultUserData>}
 */
async function getUserData(guildId, userId) {
  const filePath = getUserDataPath(guildId, userId);
  const data = await readJsonFromGCS(filePath);
  return { ...defaultUserData, ...(data || {}) };
}

/**
 * ユーザーのレベルデータを保存します。
 * @param {string} guildId
 * @param {string} userId
 * @param {object} data
 * @returns {Promise<void>}
 */
async function saveUserData(guildId, userId, data) {
  const filePath = getUserDataPath(guildId, userId);
  await saveJsonToGCS(filePath, data);
}

/**
 * ユーザーの現在のレベルを計算します。
 * @param {number} xp
 * @param {object} xpTable
 * @returns {number}
 */
function calculateLevel(xp, xpTable) {
  let level = 0;
  // XPテーブルをレベルの昇順でソート
  const sortedLevels = Object.keys(xpTable).sort((a, b) => xpTable[a] - xpTable[b]);
  for (const lvl of sortedLevels) {
    if (xp >= xpTable[lvl]) {
      level = parseInt(lvl, 10);
    } else {
      break;
    }
  }
  return level;
}

/**
 * ユーザーにXPを追加し、レベルアップ処理を行います。
 * @param {import('discord.js').GuildMember} member
 * @param {number} xpToAdd
 */
async function addXp(member, xpToAdd) {
  const { guild, user } = member;
  const userData = await getUserData(guild.id, user.id);
  userData.xp += xpToAdd;

  const config = await getConfig(guild.id);
  const newLevel = calculateLevel(userData.xp, config.xpTable);

  if (newLevel > userData.level) {
    userData.level = newLevel;
    logger.info(`[LevelUp] ${user.tag} がレベル ${newLevel} にアップしました！ (Guild: ${guild.name})`);
    // TODO: レベルアップ通知をチャンネルに送信する機能をここに追加できます。

    // ロール報酬の付与
    const rewardRoleId = config.roleRewards[newLevel.toString()];
    if (rewardRoleId) {
      const role = await guild.roles.fetch(rewardRoleId).catch(() => null);
      if (role && !member.roles.cache.has(role.id)) {
        await member.roles.add(role).catch(err => logger.error(`ロールの付与に失敗しました: ${role.name}`, { error: err }));
      }
    }
  }

  await saveUserData(guild.id, user.id, userData);
}

module.exports = { getUserData, addXp, calculateLevel };