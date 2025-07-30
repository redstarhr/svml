// hikkake_bot/utils/hikkake_select_handler.js
const { readState, writeState, getActiveStaffAllocation } = require('./hikkakeStateManager');
const { updateAllHikkakePanels } = require('./hikkakePanelManager');
const { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require('discord.js');
const { DateTime } = require('luxon');
const { createSelectMenuRow, createNumericOptions } = require('./discordUtils');
const { logHikkakeEvent } = require('./hikkakeCsvLogger');

/**
 * Handles select menu interactions for the hikkake_bot.
 * @param {import('discord.js').AnySelectMenuInteraction} interaction
 * @returns {Promise<boolean>}
 */
async function execute(interaction) {
  if (!interaction.isAnySelectMenu()) return false;

  const { customId, guildId, client } = interaction;

  // --- プラ釜スタッフ数設定 (ステップ1: プラ人数選択) ---
  const plakamaStep1Match = customId.match(/^hikkake_plakama_step1_(quest|tosu|horse)$/);
  if (plakamaStep1Match) {
    const [, type] = plakamaStep1Match;
    const puraCount = interaction.values[0];
    const row = createSelectMenuRow(`hikkake_plakama_step2_${type}_${puraCount}`, 'カマの人数を選択 (0-24)', createNumericOptions(25, '人', 0));
    await interaction.update({ content: `次にカマの人数を選択してください。`, components: [row] });
    return true;
  }

  // --- プラ釜スタッフ数設定 (ステップ2: カマ人数選択 & 保存) ---
  const plakamaStep2Match = customId.match(/^hikkake_plakama_step2_(quest|tosu|horse)_(\d+)$/);
  if (plakamaStep2Match) {
    await interaction.deferUpdate();
    const [, type, puraCount] = plakamaStep2Match;
    const kamaCount = interaction.values[0];
    const state = await readState(guildId);

    state.staff = state.staff || {};
    state.staff[type] = state.staff[type] || {};
    state.staff[type].pura = parseInt(puraCount, 10);
    state.staff[type].kama = parseInt(kamaCount, 10);

    await writeState(guildId, state);
    await logHikkakeEvent(guildId, {
      type: 'plakama_set',
      user: interaction.user,
      details: { store: type, pura: parseInt(puraCount, 10), kama: parseInt(kamaCount, 10) }
    });
    await updateAllHikkakePanels(client, guildId, state);
    await interaction.editReply({ content: `✅ **${type.toUpperCase()}** のスタッフ数を **プラ: ${puraCount}人, カマ: ${kamaCount}人** に設定しました。`, components: [] });
    return true;
  }

  // --- ひっかけ/ふらっと来店フロー (ステップ1: お客様人数選択) ---
  const guestCountMatch = customId.match(/^hikkake_(order|arrival)_guest_count_(quest|tosu|horse)$/);
  if (guestCountMatch) {
    const [, command, type] = guestCountMatch;
    const guestCount = interaction.values[0];
    const row = createSelectMenuRow(`hikkake_${command}_pura_count_${type}_${guestCount}`, '担当プラの人数を選択 (0-25)', createNumericOptions(25, '人', 0));
    await interaction.update({ content: '次に対応したプラの人数を選択してください。', components: [row] });
    return true;
  }

  // --- ひっかけ/ふらっと来店フロー (ステップ2: プラ人数選択) ---
  const puraCountMatch = customId.match(/^hikkake_(order|arrival)_pura_count_(quest|tosu|horse)_(\d+)$/);
  if (puraCountMatch) {
    const [, command, type, guestCount] = puraCountMatch;
    const puraCount = interaction.values[0];
    const row = createSelectMenuRow(`hikkake_${command}_kama_count_${type}_${guestCount}_${puraCount}`, '担当カマの人数を選択 (0-24)', createNumericOptions(25, '人', 0));
    await interaction.update({ content: '最後に対応したカマの人数を選択してください。', components: [row] });
    return true;
  }

  // --- ひっかけ/ふらっと来店フロー (ステップ3: カマ人数選択) ---
  const kamaCountMatch = customId.match(/^hikkake_(order|arrival)_kama_count_(quest|tosu|horse)_(\d+)_(\d+)$/);
  if (kamaCountMatch) {
    const [, command, type, guestCount, puraCount] = kamaCountMatch;
    const kamaCount = interaction.values[0];
    const row = createSelectMenuRow(`hikkake_${command}_bottle_count_${type}_${guestCount}_${puraCount}_${kamaCount}`, 'ボトル本数を選択 (0-24)', createNumericOptions(25, '本', 0));
    await interaction.update({ content: '最後にボトル本数を選択してください。', components: [row] });
    return true;
  }

  // --- ひっかけ/ふらっと来店フロー (ステップ4: ボトル本数選択 & 保存) ---
  const bottleCountMatch = customId.match(/^hikkake_(order|arrival)_bottle_count_(quest|tosu|horse)_(\d+)_(\d+)_(\d+)$/);
  if (bottleCountMatch) {
    await interaction.deferUpdate();
    const [, command, type, guestCount, puraCount, kamaCount] = bottleCountMatch;
    const bottleCount = interaction.values[0];
    const state = await readState(guildId);

    // Add staff availability check
    const { allocatedPura, allocatedKama } = getActiveStaffAllocation(state, type);
    const availablePura = (state.staff?.[type]?.pura || 0) - allocatedPura;
    const availableKama = (state.staff?.[type]?.kama || 0) - allocatedKama;

    if (parseInt(puraCount, 10) > availablePura || parseInt(kamaCount, 10) > availableKama) {
        await interaction.editReply({ content: `❌ スタッフが不足しています。\n現在利用可能 - プラ: ${availablePura}人, カマ: ${availableKama}人`, components: [] });
        return true;
    }

    state.orders = state.orders || { quest: [], tosu: [], horse: [] };
    state.staff = state.staff || {};
    state.staff[interaction.user.id] = state.staff[interaction.user.id] || { name: interaction.member.displayName, orders: [] };

    const order = {
      id: `${type}-${Date.now()}`,
      type: command, // 'order' or 'arrival'
      user: { id: interaction.user.id, username: interaction.user.username },
      people: parseInt(guestCount, 10),
      castPura: parseInt(puraCount, 10),
      castKama: parseInt(kamaCount, 10),
      bottles: parseInt(bottleCount, 10),
      joinTimestamp: DateTime.now().toISO(),
      leaveTimestamp: null,
    };

    state.orders[type].push(order);
    state.staff[interaction.user.id].orders.push(order.id);

    await writeState(guildId, state);
    const summary = `お客様: ${guestCount}人, プラ: ${puraCount}人, カマ: ${kamaCount}人, ボトル: ${bottleCount}本`;
    await logHikkakeEvent(guildId, {
      type: command, // 'order' or 'arrival'
      user: interaction.user,
      details: {
        store: type,
        people: parseInt(guestCount, 10),
        castPura: parseInt(puraCount, 10),
        castKama: parseInt(kamaCount, 10),
        bottles: parseInt(bottleCount, 10),
      }
    });
    await updateAllHikkakePanels(client, guildId, state);
    await interaction.editReply({ content: `✅ 記録しました: ${summary}`, components: [] });
    return true;
  }

  // --- 同伴 (キャスト選択) ---
  const douhanMatch = customId.match(/^hikkake_douhan_step1_user_(quest|tosu|horse)$/);
  if (douhanMatch) {
    const [, type] = douhanMatch;
    const castUserId = interaction.values[0];

    const modal = new ModalBuilder()
      .setCustomId(`hikkake_douhan_submit_${type}_${castUserId}`) // Simplified ID
      .setTitle('同伴情報の入力');

    const guestCountInput = new TextInputBuilder().setCustomId('guest_count').setLabel('お客様の人数').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('例: 2');
    const puraCountInput = new TextInputBuilder().setCustomId('pura_count').setLabel('担当プラの人数').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('例: 1');
    const kamaCountInput = new TextInputBuilder().setCustomId('kama_count').setLabel('担当カマの人数').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('例: 0');
    const bottleCountInput = new TextInputBuilder().setCustomId('bottle_count').setLabel('ボトル本数').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('例: 0');
    const durationInput = new TextInputBuilder().setCustomId('duration').setLabel('同伴時間（分）').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('例: 60');
    const arrivalTimeInput = new TextInputBuilder().setCustomId('arrival_time').setLabel('お店への到着予定時間').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('例: 21:00');

    modal.addComponents(
      new ActionRowBuilder().addComponents(guestCountInput),
      new ActionRowBuilder().addComponents(puraCountInput),
      new ActionRowBuilder().addComponents(kamaCountInput),
      new ActionRowBuilder().addComponents(bottleCountInput),
      new ActionRowBuilder().addComponents(durationInput),
      new ActionRowBuilder().addComponents(arrivalTimeInput)
    );

    await interaction.showModal(modal);
    return true;
  }

  // --- ログ解決 (確定/失敗) ---
  const resolveMatch = customId.match(/^hikkake_resolve_log_(confirm|fail)_(quest|tosu|horse)$/);
  if (resolveMatch) {
    await interaction.deferUpdate();
    const [, status, type] = resolveMatch;
    const orderId = interaction.values[0];
    const state = await readState(guildId);

    const order = state.orders?.[type]?.find(o => o.id === orderId);
    if (order) {
      order.status = status; // 'confirm' or 'fail'
      order.leaveTimestamp = DateTime.now().toISO(); // Resolve = complete
      await writeState(guildId, state);
      await logHikkakeEvent(guildId, {
        type: `log_${status}`, // log_confirm or log_fail
        user: interaction.user,
        details: { store: type, orderId: order.id, originalUser: order.user.username }
      });
      await updateAllHikkakePanels(client, guildId, state);
      await interaction.editReply({ content: `✅ ログを「${status === 'confirm' ? '確定' : '失敗'}」に更新しました。`, components: [] });
    } else {
      await interaction.editReply({ content: '❌ 対象のログが見つかりませんでした。', components: [] });
    }
    return true;
  }

  // --- ログ完了 (退店) ---
  const retireMatch = customId.match(/^hikkake_retire_log_(quest|tosu|horse)$/);
  if (retireMatch) {
    await interaction.deferUpdate();
    const [, type] = retireMatch;
    const orderId = interaction.values[0];
    const state = await readState(guildId);

    const order = state.orders?.[type]?.find(o => o.id === orderId);
    if (order) {
      order.leaveTimestamp = DateTime.now().toISO();
      await writeState(guildId, state);
      await logHikkakeEvent(guildId, {
        type: 'log_leave',
        user: interaction.user,
        details: { store: type, orderId: order.id, originalUser: order.user.username }
      });
      await updateAllHikkakePanels(client, guildId, state);
      await interaction.editReply({ content: '✅ ログを「退店済み」に更新しました。', components: [] });
    } else {
      await interaction.editReply({ content: '❌ 対象のログが見つかりませんでした。', components: [] });
    }
    return true;
  }

  return false; // No handler matched
}

module.exports = { execute };