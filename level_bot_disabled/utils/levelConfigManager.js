const { readJsonFromGCS, saveJsonToGCS } = require('@common/gcs/gcsUtils');

const getConfigPath = (guildId) => `level_bot/${guildId}/config.json`;

const defaultConfig = {
  // キー: レベル, 値: そのレベルに到達するために必要な合計XP
  xpTable: {
    '1': 100,
    '2': 300,
    '3': 600,
    '4': 1000,
    '5': 1500,
  },
  xpPerMessage: {
    min: 5,
    max: 15,
  },
  // キー: レベル, 値: ロールID
  roleRewards: {},
};

/**
 * ギルドのレベル設定を取得します。
 * @param {string} guildId
 * @returns {Promise<typeof defaultConfig>}
 */
async function getConfig(guildId) {
  const filePath = getConfigPath(guildId);
  const config = await readJsonFromGCS(filePath);
  // デフォルト値とマージして、不足しているキーを補完する
  return {
    ...defaultConfig,
    ...(config || {}),
    xpTable: { ...defaultConfig.xpTable, ...(config?.xpTable || {}) },
    xpPerMessage: { ...defaultConfig.xpPerMessage, ...(config?.xpPerMessage || {}) },
    roleRewards: { ...defaultConfig.roleRewards, ...(config?.roleRewards || {}) },
  };
}

/**
 * ギルドのレベル設定を保存します。
 * @param {string} guildId
 * @param {object} config
 * @returns {Promise<void>}
 */
async function saveConfig(guildId, config) {
  const filePath = getConfigPath(guildId);
  await saveJsonToGCS(filePath, config);
}

module.exports = { getConfig, saveConfig };