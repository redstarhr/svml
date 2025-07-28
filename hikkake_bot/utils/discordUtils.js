// utils/discordUtils.js

const { StringSelectMenuBuilder, ActionRowBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { client } = require('../../client');

/**
 * ギルドをキャッシュ優先で取得し、なければAPIからフェッチ
 * @param {string} guildId
 * @returns {Promise<import('discord.js').Guild|null>}
 */
async function getGuild(guildId) {
  if (!client || !client.isReady()) {
    console.warn('[getGuild] clientが準備できていません。');
    return null;
  }

  try {
    // キャッシュにあれば即返す
    const cachedGuild = client.guilds.cache.get(guildId);
    if (cachedGuild) return cachedGuild;

    // キャッシュになければAPIから取得
    const fetchedGuild = await client.guilds.fetch(guildId);
    return fetchedGuild ?? null;
  } catch (error) {
    console.warn(`[getGuild] Failed to fetch guild (${guildId}): ${error.message}`);
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
    return Array.from({ length: count }, (_, i) => {
        const value = i + start;
        return new StringSelectMenuOptionBuilder().setLabel(`${value}${unit}`).setValue(String(value));
    });
}

module.exports = { getGuild, createSelectMenuRow, createNumericOptions };
