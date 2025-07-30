// hikkake_bot/utils/hikkake_modal_handler.js
const { MessageFlags } = require('discord.js');
const { readState, writeState, getActiveStaffAllocation } = require('./hikkakeStateManager');
const { updateAllHikkakePanels } = require('../utils/hikkakePanelManager');
const { logToThread } = require('./threadLogger');
const { readReactions, writeReactions } = require('./hikkakeReactionManager');
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

            // --- Input Parsing and Validation ---
            const inputs = {
                guestCount: parseInt(interaction.fields.getTextInputValue('guest_count'), 10),
                castPura: parseInt(interaction.fields.getTextInputValue('pura_count'), 10),
                castKama: parseInt(interaction.fields.getTextInputValue('kama_count'), 10),
                bottles: parseInt(interaction.fields.getTextInputValue('bottle_count'), 10),
                duration: parseInt(interaction.fields.getTextInputValue('duration'), 10),
            };

            for (const [key, value] of Object.entries(inputs)) {
                if (isNaN(value) || value < 0) {
                    return interaction.editReply({ content: `❌ 入力値「${key}」が無効です。0以上の半角数字で入力してください。` });
                }
            }
            const arrivalTime = interaction.fields.getTextInputValue('arrival_time');

            const guildId = interaction.guildId;
            const state = await readState(guildId);

            const { allocatedPura, allocatedKama } = getActiveStaffAllocation(state, type);
            const availablePura = (state.staff?.[type]?.pura || 0) - allocatedPura;
            const availableKama = (state.staff?.[type]?.kama || 0) - allocatedKama;

            if (inputs.castPura > availablePura || inputs.castKama > availableKama) {
                return interaction.editReply({ content: `❌ スタッフが不足しています。\n現在利用可能 - プラ: ${availablePura}人, カマ: ${availableKama}人` });
            }

            // --- Data Construction ---
            const newLog = {
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                type: 'douhan',
                people: inputs.guestCount,
                bottles: inputs.bottles,
                castPura: inputs.castPura,
                castKama: inputs.castKama,
                castUserId: castUserId,
                duration: inputs.duration,
                arrivalTime: arrivalTime,
                joinTimestamp: new Date().toISOString(),
                leaveTimestamp: null,
                user: { id: interaction.user.id, username: interaction.user.username },
                logUrl: null,
            };

            // --- State and Log Updates ---
            const logMessage = await logToThread(guildId, interaction.client, { user: interaction.user, logType: '同伴', details: { type, ...newLog }, channelName: interaction.channel.name });
            if (logMessage) newLog.logUrl = logMessage.url;

            state.orders[type].push(newLog);
            await writeState(guildId, state);

            await logHikkakeEvent(guildId, {
                type: 'douhan',
                user: interaction.user,
                details: { store: type, ...inputs, castUserId, arrivalTime }
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

            if (isNaN(parsedValue) || parsedValue < 0) return interaction.editReply({ content: `エラー: 「${targetValueRaw}」は無効な値です。0以上の半角数字を入力してください。` });
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