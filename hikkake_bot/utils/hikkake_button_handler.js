// hikkake_bot/utils/hikkake_button_handler.js
const { readState, writeState } = require('./hikkakeStateManager');
const { updateAllHikkakePanels } = require('./hikkakePanelManager');
const { createSelectMenuRow, createNumericOptions } = require('./discordUtils');
const { StringSelectMenuOptionBuilder } = require('discord.js');

// Helper to find members with a specific role
async function findMembersWithRole(guild, roleName) {
    if (!guild) return [];
    const role = guild.roles.cache.find(r => r.name === roleName);
    if (!role) return [];
    await guild.members.fetch();
    return role.members
        .filter(member => !member.user.bot)
        .map(member => ({
            label: member.displayName,
            value: member.id,
        }));
}

module.exports = {
    async execute(interaction) {
        if (!interaction.isButton()) return false;

        const { customId, client, guild } = interaction;
        const guildId = guild.id;

        // --- Main Panel Buttons ---
        const panelButtonMatch = customId.match(/^hikkake_(quest|tosu|horse)_(plakama|order|arrival|douhan)$/);
        if (panelButtonMatch) {
            await interaction.deferReply({ ephemeral: true });
            const [, type, action] = panelButtonMatch;

            if (action === 'plakama') {
                const row = createSelectMenuRow(`hikkake_plakama_step1_${type}`, 'プラの人数を選択 (1-25)', createNumericOptions(25, '人'));
                await interaction.editReply({ content: `【${type.toUpperCase()}】の基本スタッフ数を設定します。まずプラの人数を選択してください。`, components: [row] });
            } else if (action === 'order') {
                const row = createSelectMenuRow(`hikkake_order_step1_${type}`, '担当プラの人数を選択 (1-25)', createNumericOptions(25, '人'));
                await interaction.editReply({ content: `【${type.toUpperCase()}】でひっかけました。担当したプラの人数を選択してください。`, components: [row] });
            } else if (action === 'arrival') {
                const row = createSelectMenuRow(`hikkake_arrival_step1_${type}`, '担当プラの人数を選択 (0-24)', createNumericOptions(25, '人', 0));
                await interaction.editReply({ content: `【${type.toUpperCase()}】にお客様がふらっと来ました。担当したプラの人数を選択してください。`, components: [row] });
            } else if (action === 'douhan') {
                const castOptions = await findMembersWithRole(guild, 'キャスト'); // Assuming a 'キャスト' role exists
                if (castOptions.length === 0) {
                    return interaction.editReply({ content: '同伴可能なキャストが見つかりませんでした。「キャスト」ロールを確認してください。' });
                }
                const row = createSelectMenuRow(`hikkake_douhan_step1_user_${type}`, '同伴するキャストを選択', castOptions);
                await interaction.editReply({ content: '同伴するキャストを選択してください。', components: [row] });
            }
            return true;
        }

        // --- Order Management Buttons ---
        const manageButtonMatch = customId.match(/^hikkake_(quest|tosu|horse)_(confirm|fail|leave)$/);
        if (manageButtonMatch) {
            await interaction.deferReply({ ephemeral: true });
            const [, type, action] = manageButtonMatch;
            const state = await readState(guildId);

            const targetOrders = state.orders[type].filter(o => o.type === 'order' && !o.status && !o.leaveTimestamp);
            if (targetOrders.length === 0) {
                return interaction.editReply({ content: '対象の「ひっかけ予定」ログが見つかりません。' });
            }

            const options = targetOrders.map(order => new StringSelectMenuOptionBuilder()
                .setLabel(`[${order.people}人/${order.bottles}本] by ${order.user.username}`)
                .setValue(order.id)
            ).slice(0, 25);

            const actionMap = {
                confirm: { customId: `hikkake_resolve_log_confirm_${type}`, placeholder: '確定する「ひっかけ予定」を選択' },
                fail: { customId: `hikkake_resolve_log_fail_${type}`, placeholder: '失敗した「ひっかけ予定」を選択' },
                leave: { customId: `hikkake_retire_log_${type}`, placeholder: '完了（退店）したログを選択' },
            };
            const { customId: selectCustomId, placeholder } = actionMap[action];
            const row = createSelectMenuRow(selectCustomId, placeholder, options);
            await interaction.editReply({ components: [row] });
            return true;
        }

        // --- Cancel Order Button ---
        const cancelButtonMatch = customId.match(/^cancel_order_(quest|tosu|horse)_(.+)$/);
        if (cancelButtonMatch) {
            await interaction.deferUpdate();
            const [, type, orderId] = cancelButtonMatch;
            const state = await readState(guildId);
            const orderIndex = state.orders[type]?.findIndex(o => o.id === orderId);

            if (orderIndex !== -1 && state.orders[type]) {
                state.orders[type].splice(orderIndex, 1);
                await writeState(guildId, state);
                await updateAllHikkakePanels(client, guildId, state);
            }
            return true;
        }

        return false;
    }
};