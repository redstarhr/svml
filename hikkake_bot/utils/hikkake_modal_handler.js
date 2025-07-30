// hikkake_bot/utils/hikkake_modal_handler.js
const { MessageFlags } = require('discord.js');
const { readState, writeState, getActiveStaffAllocation } = require('./hikkakeStateManager');
const { updateAllHikkakePanels } = require('../utils/hikkakePanelManager');
const { logToThread } = require('./threadLogger');
const { logHikkakeEvent } = require('./hikkakeCsvLogger');

module.exports = {
    async execute(interaction) {
        if (!interaction.isModalSubmit()) return false;

        const { customId } = interaction;

        // --- Douhan Submission ---
        const douhanMatch = customId.match(/^hikkake_douhan_submit_(quest|tosu|horse)_(\d+)$/);
        if (douhanMatch) {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const [, type, castUserId] = douhanMatch;
            const guestCount = parseInt(interaction.fields.getTextInputValue('guest_count'), 10);
            const duration = parseInt(interaction.fields.getTextInputValue('duration'), 10);
            const arrivalTime = interaction.fields.getTextInputValue('arrival_time');

            const guildId = interaction.guildId;
            const state = await readState(guildId);

            const castPura = 1; // Assuming the selected cast is 'pura'
            const castKama = 0;

            const { allocatedPura } = getActiveStaffAllocation(state, type);
            const availablePura = (state.staff?.[type]?.pura || 0) - allocatedPura;

            if (castPura > availablePura) {
                return interaction.editReply({ content: `❌ スタッフが不足しています。\n現在利用可能 - プラ: ${availablePura}人` });
            }

            const newLog = {
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                type: 'douhan',
                people: guestCount,
                bottles: 0,
                castPura,
                castKama,
                douhanData: { castUserId, duration, arrivalTime },
                timestamp: new Date().toISOString(),
                user: { id: interaction.user.id, username: interaction.user.username },
                logUrl: null,
            };

            const logMessage = await logToThread(guildId, interaction.client, { user: interaction.user, logType: '同伴', details: { type, ...newLog }, channelName: interaction.channel.name });
            if (logMessage) newLog.logUrl = logMessage.url;

            state.orders[type].push(newLog);
            await writeState(guildId, state);
            await logHikkakeEvent(guildId, {
                type: 'douhan',
                user: interaction.user,
                details: {
                    store: type,
                    castUserId: castUserId,
                    guestCount: guestCount,
                    duration: duration,
                    arrivalTime: arrivalTime
                }
            });
            await updateAllHikkakePanels(interaction.client, guildId, state);
            await interaction.editReply({ content: '✅ 同伴情報を記録しました。' });
            return true;
        }

        // --- Reaction Submission ---
        const reactionMatch = customId.match(/^hikkake_reaction_submit_(quest|tosu|horse)_(num|count)$/);
        if (reactionMatch) {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const [, type, key] = reactionMatch;
            const targetValueRaw = interaction.fields.getTextInputValue('target_value');
            const newMessagesRaw = interaction.fields.getTextInputValue('reaction_messages');
            const newMessages = newMessagesRaw.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            const parsedValue = parseInt(targetValueRaw, 10);

            if (isNaN(parsedValue)) return interaction.editReply({ content: `エラー: 「${targetValueRaw}」から数値を読み取れませんでした。半角数字で始めてください。` });
            if (newMessages.length === 0) return interaction.editReply({ content: '追加する反応文が入力されていません。' });

            const valueKey = String(parsedValue);
            const guildId = interaction.guildId;
            const reactions = await readReactions(guildId);

            if (!reactions[type]) reactions[type] = {};
            if (!reactions[type][key]) reactions[type][key] = {};
            if (!reactions[type][key][valueKey]) reactions[type][key][valueKey] = [];

            const existingMessages = new Set(reactions[type][key][valueKey]);
            newMessages.forEach(msg => existingMessages.add(msg));
            reactions[type][key][valueKey] = Array.from(existingMessages);

            await writeReactions(guildId, reactions);
            await interaction.editReply({ content: `✅ 設定を保存しました。\n**対象:** ${type.toUpperCase()} / ${key === 'num' ? '人数' : '本数'} / ${parsedValue}\n**追加された反応文:**\n- ${newMessages.join('\n- ')}` });
            return true;
        }
        return false;
    }
};