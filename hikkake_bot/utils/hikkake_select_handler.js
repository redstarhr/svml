// hikkake_bot/utils/hikkake_select_handler.js
const { readState, writeState } = require('./hikkakeStateManager');
const { updateAllHikkakePanels } = require('./hikkakePanelManager');
const { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require('discord.js');
const { DateTime } = require('luxon');
const { createSelectMenuRow, createNumericOptions } = require('./discordUtils');

/**
 * Handles select menu interactions for the hikkake_bot.
 * @param {import('discord.js').AnySelectMenuInteraction} interaction
 * @returns {Promise<boolean>}
 */
async function execute(interaction) {
  // --- プラ釜スタッフ数設定 (ステップ1: プラ人数選択) ---
  const plakamaStep1Match = interaction.customId.match(/^hikkake_plakama_step1_(quest|tosu|horse)$/);
  if (plakamaStep1Match) {
    const [, type] = plakamaStep1Match;
    const puraCount = interaction.values[0];
    const row = createSelectMenuRow(`hikkake_plakama_step2_${type}_${puraCount}`, 'カマの人数を選択 (0-24)', createNumericOptions(25, '人', 0));
    await interaction.update({ content: `次にカマの人数を選択してください。`, components: [row] });
    return true;
  }

  // --- プラ釜スタッフ数設定 (ステップ2: カマ人数選択 & 保存) ---
  const plakamaStep2Match = interaction.customId.match(/^hikkake_plakama_step2_(quest|tosu|horse)_(\d+)$/);
  if (plakamaStep2Match) {
    await interaction.deferUpdate();
    const [, type, puraCount] = plakamaStep2Match;
    const kamaCount = interaction.values[0];
    const guildId = interaction.guild.id;
    const state = await readState(guildId);

    state.staff = state.staff || {};
    state.staff[type] = state.staff[type] || {};
    state.staff[type].pura = parseInt(puraCount, 10);
    state.staff[type].kama = parseInt(kamaCount, 10);
    await writeState(guildId, state);
    await updateAllHikkakePanels(interaction.client, guildId, state);
    return true;
  }

  // --- 人数選択メニューの処理 (プラ釜以外) ---
  const step1Match = interaction.customId.match(/^hikkake_(order|arrival)_step1_(quest|tosu|horse)$/);
  if (step1Match) {
    await interaction.deferUpdate();
    const [, command, type] = step1Match;
    const guildId = interaction.guild.id;
    const state = await readState(guildId);
    const selectedValue = interaction.values[0];

    state.orders = state.orders || { quest: [], tosu: [], horse: [] };
    state.staff = state.staff || {};
    state.staff[interaction.user.id] = state.staff[interaction.user.id] || { name: interaction.member.displayName, orders: [] };

    const order = {
      id: `${type}-${Date.now()}`,
      type: command,
      user: { id: interaction.user.id, username: interaction.user.username },
      people: parseInt(selectedValue, 10),
      bottles: 0,
      joinTimestamp: DateTime.now().toISO(),
      leaveTimestamp: null,
    };

    state.orders[type].push(order);
    state.staff[interaction.user.id].orders.push(order.id);

    await writeState(guildId, state);
    await updateAllHikkakePanels(interaction.client, guildId, state);
    return true;
  }

  // --- 同伴キャスト選択メニューの処理 ---
  const douhanMatch = interaction.customId.match(/^hikkake_douhan_step1_user_(quest|tosu|horse)$/);
  if (douhanMatch) {
    const [, type] = douhanMatch;
    const castUserId = interaction.values[0];

    const modal = new ModalBuilder()
      .setCustomId(`hikkake_douhan_submit_${type}_${castUserId}`)
      .setTitle('同伴情報の入力');

    const guestCountInput = new TextInputBuilder().setCustomId('guest_count').setLabel('お客様の人数').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('例: 2');
    const durationInput = new TextInputBuilder().setCustomId('duration').setLabel('同伴時間（分）').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('例: 60');
    const arrivalTimeInput = new TextInputBuilder().setCustomId('arrival_time').setLabel('お店への到着予定時間').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('例: 21:00');

    modal.addComponents(
      new ActionRowBuilder().addComponents(guestCountInput),
      new ActionRowBuilder().addComponents(durationInput),
      new ActionRowBuilder().addComponents(arrivalTimeInput)
    );

    await interaction.showModal(modal);
    return true;
  }

  // --- ひっかけ予定の解決 (確定/失敗) ---
  const resolveMatch = interaction.customId.match(/^hikkake_resolve_log_(confirm|fail)_(quest|tosu|horse)$/);
  if (resolveMatch) {
    await interaction.deferUpdate();
    const [, status, type] = resolveMatch;
    const orderId = interaction.values[0];
    const guildId = interaction.guild.id;
    const state = await readState(guildId);

    const order = state.orders?.[type]?.find(o => o.id === orderId);
    if (order) {
      order.status = status; // 'confirmed' or 'failed'
      order.leaveTimestamp = DateTime.now().toISO(); // 解決した時点で完了とみなす
      await writeState(guildId, state);
      await updateAllHikkakePanels(interaction.client, guildId, state);
    }
    return true;
  }

  // --- ログの完了 (退店) ---
  const retireMatch = interaction.customId.match(/^hikkake_retire_log_(quest|tosu|horse)$/);
  if (retireMatch) {
    await interaction.deferUpdate();
    const [, type] = retireMatch;
    const orderId = interaction.values[0];
    const guildId = interaction.guild.id;
    const state = await readState(guildId);

    const order = state.orders?.[type]?.find(o => o.id === orderId);
    if (order) {
      order.leaveTimestamp = DateTime.now().toISO();
      await writeState(guildId, state);
      await updateAllHikkakePanels(interaction.client, guildId, state);
    }
    return true;
  }

  return false;
}

module.exports = { execute };