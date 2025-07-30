// utils/discordUtils.js

const { StringSelectMenuBuilder, ActionRowBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const logger = require('@common/logger');

/**
 * ギルドをキャッシュ優先で取得し、なければAPIからフェッチ
 * @param {import('discord.js').Client} client
 * @param {string} guildId
 * @returns {Promise<import('discord.js').Guild|null>}
 */
async function getGuild(client, guildId) {
  if (!client || !client.isReady()) return null;

  try {
    // キャッシュにあれば即返す
    const cachedGuild = client.guilds.cache.get(guildId);
    if (cachedGuild) return cachedGuild;

    // キャッシュになければAPIから取得
    const fetchedGuild = await client.guilds.fetch(guildId);
    return fetchedGuild ?? null;
  } catch (error) {
    logger.warn(`[getGuild] ギルドの取得に失敗しました (${guildId}): ${error.message}`);
    return null;
  }
}

/**
 * セレクトメニューを含むActionRowを生成する
 * @param {string} customId
 * @param {string} placeholder
 * @param {import('discord.js').StringSelectMenuOptionBuilder[]} options
 * @returns {ActionRowBuilder<StringSelectMenuBuilder>}
 */
function createSelectMenuRow(customId, placeholder, options) {
  const selectMenu = new StringSelectMenuBuilder().setCustomId(customId).setPlaceholder(placeholder).addOptions(options);
  return new ActionRowBuilder().addComponents(selectMenu);
}

/**
 * 数値の選択肢を生成する
 * @param {number} count
 * @param {string} unit
 * @param {number} start
 * @returns {StringSelectMenuOptionBuilder[]}
 */
function createNumericOptions(count, unit, start = 1) {
    // Discordのセレクトメニューは最大25個の選択肢しか持てないため、上限を設定
    const safeCount = Math.min(count, 25);
    return Array.from({ length: safeCount }, (_, i) => {
        const value = i + start;
        return new StringSelectMenuOptionBuilder().setLabel(`${value}${unit}`).setValue(String(value));
    });
}

module.exports = { getGuild, createSelectMenuRow, createNumericOptions };