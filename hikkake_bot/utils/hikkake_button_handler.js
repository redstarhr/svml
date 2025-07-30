// hikkake_bot/utils/hikkake_button_handler.js
const { readState, writeState } = require('./hikkakeStateManager');
const { updateAllHikkakePanels } = require('./hikkakePanelManager');
const { createSelectMenuRow, createNumericOptions, findMembersWithRole } = require('./discordUtils');
const { StringSelectMenuOptionBuilder, MessageFlags, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require('discord.js');
const { readReactions } = require('./hikkakeReactionManager');
const { logToThread } = require('./threadLogger');
const { logHikkakeEvent } = require('./hikkakeCsvLogger');
const { DateTime } = require('luxon');

module.exports = {
    async execute(interaction) {
        if (!interaction.isButton()) return false;

        const { customId, client, guild } = interaction;
        const guildId = guild.id;

        // --- Main Panel Buttons ---
        const panelButtonMatch = customId.match(/^hikkake_(quest|tosu|horse)_(plakama|order|arrival|douhan)$/);
        if (panelButtonMatch) {
            const [, type, action] = panelButtonMatch;

            if (action === 'plakama') {
                const row = createSelectMenuRow(`hikkake_plakama_step1_${type}`, 'プラの人数を選択 (1-25)', createNumericOptions(25, '人'));
                await interaction.reply({ content: `【${type.toUpperCase()}】の基本スタッフ数を設定します。まずプラの人数を選択してください。`, components: [row], flags: [MessageFlags.Ephemeral] });
            } else if (action === 'order') {
                const row = createSelectMenuRow(`hikkake_order_guest_count_${type}`, 'お客様の人数を選択 (1-25)', createNumericOptions(25, '人'));
                await interaction.reply({ content: `【${type.toUpperCase()}】でひっかけました。まずお客様の人数を選択してください。`, components: [row], flags: [MessageFlags.Ephemeral] });
            } else if (action === 'arrival') {
                const row = createSelectMenuRow(`hikkake_arrival_guest_count_${type}`, 'お客様の人数を選択 (1-25)', createNumericOptions(25, '人'));
                await interaction.reply({ content: `【${type.toUpperCase()}】にお客様がふらっと来ました。まずお客様の人数を選択してください。`, components: [row], flags: [MessageFlags.Ephemeral] });
            } else if (action === 'douhan') {
                const castOptions = await findMembersWithRole(guild, 'キャスト'); // Assuming a 'キャスト' role exists
                if (castOptions.length === 0) {
                    return interaction.reply({ content: '同伴可能なキャストが見つかりませんでした。「キャスト」ロールを確認してください。', flags: [MessageFlags.Ephemeral] });
                }
                const row = createSelectMenuRow(`hikkake_douhan_step1_user_${type}`, '同伴するキャストを選択', castOptions);
                await interaction.reply({ content: '同伴するキャストを選択してください。', components: [row], flags: [MessageFlags.Ephemeral] });
            }
            return true;
        }

        // --- Order Management Buttons ---
        const manageButtonMatch = customId.match(/^hikkake_(quest|tosu|horse)_(confirm|fail|leave)$/);
        if (manageButtonMatch) {
            const [, type, action] = manageButtonMatch;
            const state = await readState(guildId);
            
            // Ensure the orders property exists to prevent crashes
            state.orders = state.orders || { quest: [], tosu: [], horse: [] };

            // Get all active (not left) orders for the store type
            let targetOrders = state.orders[type]?.filter(o => !o.leaveTimestamp) || [];

            // For 'confirm' and 'fail', only target 'order' types that haven't been resolved
            if (action === 'confirm' || action === 'fail') {
                targetOrders = targetOrders.filter(o => o.type === 'order' && !o.status);
            }

            if (targetOrders.length === 0) {
                return interaction.reply({ content: '対象のログが見つかりません。', flags: [MessageFlags.Ephemeral] });
            }

            const options = targetOrders.map(order => {
                const time = DateTime.fromISO(order.joinTimestamp).setZone('Asia/Tokyo').toFormat('HH:mm');
                const label = `[${time}] ${order.people}人 (${order.user.username})`;
                return new StringSelectMenuOptionBuilder().setLabel(label).setValue(order.id);
            }).slice(0, 25);

            const actionMap = {
                confirm: { customId: `hikkake_resolve_log_confirm_${type}`, placeholder: '確定する「ひっかけ予定」を選択' },
                fail: { customId: `hikkake_resolve_log_fail_${type}`, placeholder: '失敗した「ひっかけ予定」を選択' },
                leave: { customId: `hikkake_retire_log_${type}`, placeholder: '完了（退店）したログを選択' },
            };
            const { customId: selectCustomId, placeholder } = actionMap[action];
            const row = createSelectMenuRow(selectCustomId, placeholder, options);
            await interaction.reply({ components: [row], flags: [MessageFlags.Ephemeral] });
            return true;
        }

        // --- Cancel Order Button ---
        const cancelButtonMatch = customId.match(/^cancel_order_(quest|tosu|horse)_(.+)$/);
        if (cancelButtonMatch) {
            await interaction.deferUpdate();
            const [, type, orderId] = cancelButtonMatch;
            const state = await readState(guildId);
            const orderIndex = state.orders[type]?.findIndex(o => o.id === orderId);
            const orderToCancel = state.orders[type]?.[orderIndex];

            if (orderToCancel) {
                await logToThread(guildId, client, {
                    user: interaction.user,
                    logType: '注文キャンセル',
                    details: { type, ...orderToCancel },
                    channelName: interaction.channel.name
                });
                await logHikkakeEvent(guildId, {
                    type: 'log_cancel',
                    user: interaction.user,
                    details: { store: type, orderId: orderId, originalUser: orderToCancel.user.username }
                });
                state.orders[type].splice(orderIndex, 1);
                await writeState(guildId, state);
                await updateAllHikkakePanels(client, guildId, state);
            }
            return true;
        }

        // --- Reaction Admin Buttons ---
        const reactionAddMatch = customId.match(/^hikkake_reaction_add_(num|count)$/);
        if (reactionAddMatch) {
            const [, key] = reactionAddMatch;
            const modal = new ModalBuilder()
                .setCustomId(`hikkake_reaction_submit_quest_${key}`) // Default to quest, user can change if needed
                .setTitle(`反応の追加 (${key === 'num' ? '人数' : '本数'})`);

            const targetValueInput = new TextInputBuilder()
                .setCustomId('target_value')
                .setLabel(`対象の${key === 'num' ? '人数' : '本数'} (半角数字)`)
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const messagesInput = new TextInputBuilder()
                .setCustomId('reaction_messages')
                .setLabel('反応文 (複数行で複数登録)')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(targetValueInput),
                new ActionRowBuilder().addComponents(messagesInput)
            );
            await interaction.showModal(modal);
            return true;
        }

        if (customId === 'hikkake_reaction_remove') {
            const reactions = await readReactions(guildId);
            const options = [];
            for (const store of ['quest', 'tosu', 'horse']) {
                for (const key of ['num', 'count']) {
                    const config = reactions[store]?.[key];
                    if (config) {
                        for (const value of Object.keys(config)) {
                            const label = `[${store.toUpperCase()}/${key === 'num' ? '人数' : '本数'}] ${value}`;
                            options.push(new StringSelectMenuOptionBuilder().setLabel(label).setValue(`${store}_${key}_${value}`));
                        }
                    }
                }
            }

            if (options.length === 0) {
                return interaction.reply({ content: '削除できる反応設定がありません。', flags: [MessageFlags.Ephemeral] });
            }

            const row = createSelectMenuRow('hikkake_reaction_remove_select', '削除する反応設定を選択', options.slice(0, 25));
            await interaction.reply({ content: '削除する反応設定を選択してください。', components: [row], flags: [MessageFlags.Ephemeral] });
            return true;
        }

        return false;
    }
};