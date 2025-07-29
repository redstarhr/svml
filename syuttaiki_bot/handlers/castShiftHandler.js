// syuttaiki_bot/castShiftHandler.js

const castStateManager = require('../utils/castShift/castStateManager');
const { createOrUpdateCastShiftEmbed } = require('../utils/castShift/castPanelManager');
const { DateTime } = require('luxon');

/**
 * キャストの出退勤ボタンが押された際の処理
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleCastShiftButton(interaction) {
    const [_, type, time] = interaction.customId.split('_'); // e.g., cast_work_20:00
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const userDisplayName = interaction.member.displayName;
    const today = DateTime.now().setZone('Asia/Tokyo').toISODate();

    await interaction.deferUpdate();

    const state = await castStateManager.loadOrInitState(guildId, today, interaction.channel.id);

    // ユーザーを他のスロットから一旦削除
    Object.values(state.workMap).forEach(users => {
        const index = users.findIndex(u => u.id === userId);
        if (index > -1) users.splice(index, 1);
    });
    Object.values(state.leaveMap).forEach(users => {
        const index = users.findIndex(u => u.id === userId);
        if (index > -1) users.splice(index, 1);
    });

    // 新しいスロットにユーザーを追加
    const mapToUpdate = type === 'work' ? state.workMap : state.leaveMap;
    if (!mapToUpdate[time]) {
        mapToUpdate[time] = [];
    }
    mapToUpdate[time].push({ id: userId, name: userDisplayName });

    await castStateManager.saveState(guildId, today, state);

    // パネルのEmbedを更新
    await createOrUpdateCastShiftEmbed({
        guildId,
        date: today,
        state,
        channel: interaction.channel,
        messageId: interaction.message.id,
    });
}

module.exports = {
    /**
     * キャストシフト管理機能関連のインタラクションを処理します。
     * @param {import('discord.js').Interaction} interaction
     * @returns {Promise<boolean>}
     */
    async execute(interaction) {
        if (interaction.isButton() && (interaction.customId.startsWith('cast_work_') || interaction.customId.startsWith('cast_leave_'))) {
            await handleCastShiftButton(interaction);
            return true;
        }
        return false;
    }
};