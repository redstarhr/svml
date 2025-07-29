// hikkake_bot/utils/hikkake_select_handler.js
const { readState, writeState, getActiveStaffAllocation } = require('./hikkakeStateManager');
const { updateAllHikkakePanels } = require('../utils/hikkakePanelManager');
const { logToThread } = require('./threadLogger');
const { createSelectMenuRow, createNumericOptions } = require('./discordUtils');
const { readReactions, getRandomReaction, writeReactions } = require('./hikkakeReactionManager');
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  async execute(interaction) {
    if (!interaction.isAnySelectMenu()) return false;

    const { customId, client, guildId } = interaction;

    // --- Plakama 設定 ---
    if (customId.startsWith('hikkake_plakama_step')) {
      await interaction.deferUpdate();
      const match = customId.match(/^hikkake_plakama_step(1|2)_(quest|tosu|horse)/);
      if (!match) return false;

      const step = parseInt(match[1], 10);
      const type = match[2];

      if (step === 1) {
        const puraCount = interaction.values[0];
        const newCustomId = `hikkake_plakama_step2_${type}_${puraCount}`;
        const row = createSelectMenuRow(newCustomId, 'カマの人数を選択 (1-25)', createNumericOptions(25, '人'));
        await interaction.editReply({
          content: `【${type.toUpperCase()}】プラ: ${puraCount}人。次にカマの人数を選択してください。`,
          components: [row],
        });
      } else if (step === 2) {
        const puraCount = parseInt(customId.split('_')[4], 10);
        const kamaCount = parseInt(interaction.values[0], 10);
        if (isNaN(puraCount) || isNaN(kamaCount)) {
          return interaction.editReply({ content: 'エラー: 人数の解析に失敗しました。', components: [] });
        }

        const state = await readState(guildId);
        state.staff[type].pura = puraCount;
        state.staff[type].kama = kamaCount;
        await writeState(guildId, state);
        await updateAllHikkakePanels(client, guildId, state);
        await logToThread(guildId, client, {
          user: interaction.user,
          logType: 'プラカマ設定',
          details: { type, pura: puraCount, kama: kamaCount },
          channelName: interaction.channel.name,
        });
        await interaction.editReply({
          content: `✅ 【${type.toUpperCase()}】の基本スタッフを プラ: ${puraCount}人, カマ: ${kamaCount}人 に設定しました。`,
          components: [],
        });
      }
      return true;
    }

    // --- Order 受注 ---
    if (customId.startsWith('hikkake_order_step')) {
      await interaction.deferUpdate();
      const match = customId.match(/^hikkake_order_step(1|2|3)_(quest|tosu|horse)/);
      if (!match) return false;

      const step = parseInt(match[1], 10);
      const type = match[2];

      if (step === 1) {
        const castPura = interaction.values[0];
        const newCustomId = `hikkake_order_step2_${type}_${castPura}`;
        const row = createSelectMenuRow(newCustomId, '担当カマの人数を選択 (0-24)', createNumericOptions(25, '人', 0));
        await interaction.editReply({
          content: `【${type.toUpperCase()}】担当プラ: ${castPura}人。次に担当したカマの人数を選択してください。`,
          components: [row],
        });
      } else if (step === 2) {
        const castPura = customId.split('_')[4];
        const castKama = interaction.values[0];
        const newCustomId = `hikkake_order_step3_${type}_${castPura}_${castKama}`;
        const row = createSelectMenuRow(newCustomId, 'ボトルの本数を選択 (0-24)', createNumericOptions(25, '本', 0));
        await interaction.editReply({
          content: `【${type.toUpperCase()}】担当プラ: ${castPura}人, カマ: ${castKama}人。次にボトルの本数を選択してください。`,
          components: [row],
        });
      } else if (step === 3) {
        const parts = customId.split('_');
        const castPura = parseInt(parts[4], 10);
        const castKama = parseInt(parts[5], 10);
        const bottles = parseInt(interaction.values[0], 10);

        if ([castPura, castKama, bottles].some(isNaN)) {
          return interaction.editReply({ content: 'エラー: 数値の解析に失敗しました。', components: [] });
        }

        const state = await readState(guildId);
        const { allocatedPura, allocatedKama } = getActiveStaffAllocation(state, type);
        const availablePura = (state.staff[type].pura || 0) - allocatedPura;
        const availableKama = (state.staff[type].kama || 0) - allocatedKama;

        if (castPura > availablePura || castKama > availableKama) {
          return interaction.editReply({
            content: `❌ スタッフが不足しています。\n現在利用可能 - プラ: ${availablePura}人, カマ: ${availableKama}人`,
            components: [],
          });
        }

        const newOrder = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          type: 'order',
          people: castPura + castKama,
          bottles,
          castPura,
          castKama,
          timestamp: new Date().toISOString(),
          user: { id: interaction.user.id, username: interaction.user.username },
          logUrl: null,
        };

        const logMessage = await logToThread(guildId, client, {
          user: interaction.user,
          logType: '受注',
          details: { type, ...newOrder },
          channelName: interaction.channel.name,
        });
        if (logMessage) newOrder.logUrl = logMessage.url;

        state.orders[type].push(newOrder);
        await writeState(guildId, state);
        await updateAllHikkakePanels(client, guildId, state);

        const reactions = await readReactions(guildId);
        const reactionParts = [
          getRandomReaction(reactions, type, 'num', newOrder.people),
          getRandomReaction(reactions, type, 'count', newOrder.bottles),
        ].filter(Boolean);

        await interaction.editReply({
          content: `✅ 【${type.toUpperCase()}】受注を登録しました。\n${reactionParts.join(' ')}`,
          components: [],
        });
      }
      return true;
    }

    // --- Douhan Flow ---
    if (customId.startsWith('hikkake_douhan_step')) {
        await interaction.deferUpdate();
        const match = customId.match(/^hikkake_douhan_step(1_user|2_guests|3_duration)_(quest|tosu|horse)/);
        const step = match[1];
        const type = match[2];

        if (step === '1_user') {
            const selectedUserId = interaction.values[0];
            const newCustomId = `hikkake_douhan_step2_guests_${type}_${selectedUserId}`;
            const row = createSelectMenuRow(newCustomId, '客数を選択 (0-24)', createNumericOptions(25, '人', 0));
            await interaction.editReply({ content: `キャスト <@${selectedUserId}> を選択しました。次にお客様の人数を選択してください。`, components: [row] });
        } else if (step === '2_guests') {
            const [, , , , , selectedUserId] = customId.split('_');
            const guestCount = interaction.values[0];
            const newCustomId = `hikkake_douhan_step3_duration_${type}_${selectedUserId}_${guestCount}`;
            const durationOptions = Array.from({ length: 8 }, (_, i) => { const minutes = 30 * (i + 1); const h = Math.floor(minutes / 60); const m = minutes % 60; let l = ''; if (h > 0) l += `${h}時間`; if (m > 0) l += `${m}分`; return { label: l, value: String(minutes) }; });
            const row = createSelectMenuRow(newCustomId, '同伴時間を選択', durationOptions);
            await interaction.editReply({ content: `客数: ${guestCount}人。次に同伴時間を選択してください。`, components: [row] });
        } else if (step === '3_duration') {
            const [, , , , , selectedUserId, guestCount] = customId.split('_');
            const duration = interaction.values[0];
            const modal = new ModalBuilder().setCustomId(`hikkake_douhan_submit_${type}_${selectedUserId}_${guestCount}_${duration}`).setTitle('来店予定時間の入力');
            const arrivalTimeInput = new TextInputBuilder().setCustomId('arrival_time').setLabel('来店予定時間').setStyle(TextInputStyle.Short).setPlaceholder('例: 21:30 or 2130').setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(arrivalTimeInput));
            await interaction.showModal(modal);
        }
        return true;
    }

    // --- Resolve/Fail Log ---
    if (customId.startsWith('hikkake_resolve_log_')) {
        await interaction.deferUpdate();
        const [, , , action, type] = customId.split('_');
        const logIdToResolve = interaction.values[0];
        const state = await readState(guildId);
        const logToUpdate = state.orders[type].find(log => log.id === logIdToResolve);
        if (!logToUpdate) return interaction.editReply({ content: '❌ エラー: 対象のログが見つかりませんでした。', components: [] });

        logToUpdate.status = action === 'confirm' ? 'confirmed' : 'failed';
        logToUpdate.leaveTimestamp = new Date().toISOString();
        await writeState(guildId, state);
        await updateAllHikkakePanels(client, guildId, state);
        const logType = action === 'confirm' ? 'ひっかけ確定' : 'ひっかけ失敗';
        await logToThread(guildId, client, { user: interaction.user, logType, details: { type, resolvedLog: logToUpdate }, channelName: interaction.channel.name });
        const replyMessage = action === 'confirm' ? '✅ 選択された「ひっかけ予定」を **確定** しました。' : '✅ 選択された「ひっかけ予定」を **失敗** として記録しました。';
        await interaction.editReply({ content: `${replyMessage} 10分後に自動で削除されます。`, components: [] });
        return true;
    }

    // --- Retire Log ---
    if (customId.startsWith('hikkake_retire_log_')) {
        await interaction.deferUpdate();
        const type = customId.split('_')[3];
        const logIdToRetire = interaction.values[0];
        const state = await readState(guildId);
        const logToUpdate = state.orders[type].find(log => log.id === logIdToRetire);
        if (!logToUpdate) return interaction.editReply({ content: '❌ エラー: 対象のログが見つかりませんでした。', components: [] });

        logToUpdate.leaveTimestamp = new Date().toISOString();
        await writeState(guildId, state);
        await updateAllHikkakePanels(client, guildId, state);
        await logToThread(guildId, client, { user: interaction.user, logType: 'ログ退店', details: { type, retiredLog: logToUpdate }, channelName: interaction.channel.name });
        await interaction.editReply({ content: '✅ 選択されたログを退店済みにしました。10分後に自動で削除されます。', components: [] });
        return true;
    }

    // --- Delete Reaction ---
    if (customId === 'hikkake_reaction_delete') {
        await interaction.deferUpdate();
        const [type, key, value, indexStr] = interaction.values[0].split(':');
        const index = parseInt(indexStr, 10);
        if (!type || !key || !value || isNaN(index)) return interaction.followUp({ content: 'エラー: 削除情報の解析に失敗しました。', flags: 64 });

        const reactions = await readReactions(guildId);
        const targetArray = reactions?.[type]?.[key]?.[value];
        if (!targetArray) {
  return interaction.followUp({ content: 'エラー: 削除対象が存在しません。', flags: 64 });
}

targetArray.splice(index, 1);
await writeReactions(guildId, reactions);
await updateAllHikkakePanels(client, guildId, await readState(guildId));
await interaction.editReply({ content: '✅ 反応文を削除しました。', components: [] });

return true;  }
  },
};
