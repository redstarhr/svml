// hikkake_bot/utils/hikkake_select_handler.js
const { readState, writeState } = require('./hikkakeStateManager');
const { updateAllHikkakePanels } = require('./hikkakePanelManager');
const { DateTime } = require('luxon');

/**
 * Handles select menu interactions for the hikkake_bot.
 * @param {import('discord.js').AnySelectMenuInteraction} interaction
 * @returns {Promise<boolean>}
 */
async function execute(interaction) {
  const [prefix, command, step, type, ...params] = interaction.customId.split('_');

  // 'hikkake_xxx_step1_yyy' 形式のIDを処理するように汎用化
  if (prefix !== 'hikkake' || step !== 'step1') {
    return false;
  }

  await interaction.deferUpdate();

  const guildId = interaction.guild.id;
  const state = await readState(guildId);
  const selectedValue = interaction.values[0];

  // --- FIX: Ensure state properties exist before use ---
  // The error "Cannot read properties of null (reading 'staff')" or similar TypeErrors
  // happen when a part of the state object is assumed to exist but is undefined.
  // By initializing them here with default values, we prevent such errors.
  state.orders = state.orders || { quest: [], tosu: [], horse: [] };
  state.staff = state.staff || {}; // Initialize staff object
  state.staff[interaction.user.id] = state.staff[interaction.user.id] || { name: interaction.member.displayName, orders: [] };

  const order = {
    id: `${type}-${Date.now()}`,
    type: command, // 'plakama', 'order', 'arrival' などのコマンド名をタイプとして記録
    user: {
      id: interaction.user.id,
      username: interaction.user.username, // 他のハンドラが期待する形式に合わせる
    },
    people: parseInt(selectedValue, 10), // プロパティ名を'people'に修正し、数値に変換
    bottles: 0, // 他のハンドラが期待するため、デフォルト値を追加
    joinTimestamp: DateTime.now().toISO(),
    leaveTimestamp: null,
  };

  state.orders[type].push(order);
  // スタッフ個人の注文リストにも注文IDを追加して、データを一貫させます。
  state.staff[interaction.user.id].orders.push(order.id);

  await writeState(guildId, state);
  await updateAllHikkakePanels(interaction.client, guildId, state);

  return true; // Interaction was handled.
}

module.exports = { execute };