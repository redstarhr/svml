const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { DateTime } = require('luxon');
const { getActiveStaffAllocation } = require('./hikkakeStateManager');

/**
 * 店内状況パネル（Embedとボタン）を構築します。
 * @param {string} type - 'quest', 'tosu', 'horse'
 * @param {object} state - 現在の状態オブジェクト
 * @returns {{embeds: EmbedBuilder[], components: ActionRowBuilder[]}}
 */
function buildStatusPanel(type, state) {
    const { staff } = state;

    const typeNameMap = {
        quest: '📜｜クエスト依頼',
        tosu: '🔭｜凸スナ',
        horse: '🐴｜トロイの木馬-旧店況',
    };
    const typeName = typeNameMap[type] || type.toUpperCase();

    const { allocatedPura, allocatedKama } = getActiveStaffAllocation(state, type);
    const totalPura = staff?.[type]?.pura ?? 0;
    const totalKama = staff?.[type]?.kama ?? 0;
    const availablePura = totalPura - allocatedPura;
    const availableKama = totalKama - allocatedKama;

    const embed = new EmbedBuilder()
        .setTitle(typeName)
        .setColor(0x3498DB)
        .addFields(
            { name: 'プラ', value: `**${availablePura}** / ${totalPura}`, inline: true },
            { name: 'カマ', value: `**${availableKama}** / ${totalKama}`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: '店内状況' });

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`hikkake_${type}_plakama`).setLabel('プラカマ設定').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`hikkake_${type}_order`).setLabel('ひっかけた').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`hikkake_${type}_arrival`).setLabel('ふらっと来た').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`hikkake_${type}_douhan`).setLabel('同伴').setStyle(ButtonStyle.Primary)
    );

    return { embeds: [embed], components: [buttons] };
}

/**
 * ひっかけ一覧パネル（Embedとボタン）を構築します。
 * @param {string} type - 'quest', 'tosu', 'horse'
 * @param {object} state - 現在の状態オブジェクト
 * @returns {{embeds: EmbedBuilder[], components: ActionRowBuilder[]}}
 */
function buildOrdersPanel(type, state) {
    const orders = state.orders?.[type]?.filter(o => !o.leaveTimestamp) || [];

    const embed = new EmbedBuilder()
        .setTitle(`ひっかけ一覧 (${type.toUpperCase()})`)
        .setColor(0x9B59B6)
        .setTimestamp();

    if (orders.length === 0) {
        embed.setDescription('現在、受注はありません。');
    } else {
        const description = orders.map(order => {
            const time = DateTime.fromISO(order.joinTimestamp).setZone('Asia/Tokyo').toFormat('HH:mm');
            const user = order.user.username;
            const orderTypeLabel = {
                order: '予定',
                arrival: '来店',
                douhan: '同伴',
            }[order.type] || '不明';

            let details = '';
            if (order.type === 'douhan') {
                details = `キャスト <@${order.castUserId}>, ${order.people}人, ${order.duration}分, ${order.arrivalTime}着`;
            } else {
                details = `${order.people}人, ${order.bottles}本, プラ${order.castPura}/カマ${order.castKama}`;
            }
            
            const statusEmoji = order.status === 'confirmed' ? '✅' : order.status === 'failed' ? '❌' : '⏳';
            const statusText = order.type === 'order' ? `${statusEmoji} ` : '';

            return `${statusText}[${time}] **${orderTypeLabel}** by ${user}\n> ${details}`;
        }).join('\n\n');
        embed.setDescription(description);
    }

    const hasPendingOrders = orders.some(o => o.type === 'order' && !o.status);
    const hasActiveLogs = orders.length > 0;

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`hikkake_${type}_confirm`).setLabel('ひっかけ確定').setStyle(ButtonStyle.Success).setDisabled(!hasPendingOrders),
        new ButtonBuilder().setCustomId(`hikkake_${type}_fail`).setLabel('ひっかけ失敗').setStyle(ButtonStyle.Danger).setDisabled(!hasPendingOrders),
        new ButtonBuilder().setCustomId(`hikkake_${type}_leave`).setLabel('ログ完了(退店)').setStyle(ButtonStyle.Secondary).setDisabled(!hasActiveLogs)
    );

    return { embeds: [embed], components: [buttons] };
}

/**
 * A generic panel builder that dispatches to the correct specific builder.
 * This matches the expected signature from hikkakePanelManager.
 * @param {'status' | 'orders'} panelType
 * @param {string} storeType - 'quest', 'tosu', 'horse'
 * @param {object} state
 * @returns {{embeds: EmbedBuilder[], components: ActionRowBuilder[]}}
 */
function buildPanelEmbed(panelType, storeType, state) {
    if (panelType === 'status') {
        return buildStatusPanel(storeType, state);
    }
    if (panelType === 'orders') {
        return buildOrdersPanel(storeType, state);
    }
    throw new Error(`Unknown panel type: ${panelType}`);
}

module.exports = {
    buildStatusPanel,
    buildOrdersPanel,
    buildPanelEmbed,
};
