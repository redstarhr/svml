const logger = require('@common/logger');
const { updateState } = require('../../../utils/syuttaikinStateManager');

/**
 * 時間登録モーダルの共通処理
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 * @param {'arrival' | 'departure'} type
 */
async function handleTimeModalSubmit(interaction, type) {
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.guildId;
    const timeValue = interaction.fields.getTextInputValue('time_input');

    // HH:mm形式のより厳密なバリデーション
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(timeValue)) {
        await interaction.editReply({ content: '⚠️ 時間の形式が正しくありません。`HH:mm` (例: `20:30`) 形式で入力してください。' });
        return;
    }

    try {
        let updated = false;
        await updateState(guildId, (currentState) => {
            const config = currentState.syuttaikin || {};
            const timeArray = type === 'arrival' ? (config.arrivalTimes || []) : (config.departureTimes || []);

            if (timeArray.includes(timeValue)) {
                return currentState; // No change
            }

            timeArray.push(timeValue);
            timeArray.sort(); // 時間を昇順にソート

            if (type === 'arrival') config.arrivalTimes = timeArray;
            else config.departureTimes = timeArray;

            currentState.syuttaikin = config;
            updated = true;
            return currentState;
        });

        await interaction.editReply({ content: updated ? `✅ ${type === 'arrival' ? '出勤' : '退勤'}時間「${timeValue}」を登録しました。` : `✅ 時間「${timeValue}」は既に登録されています。` });
        if (updated) logger.info(`[syuttaikin-config] Guild ${guildId} に ${type} 時間「${timeValue}」を登録しました。`);
    } catch (error) {
        logger.error(`[syuttaikin-config] 時間の登録処理中にエラーが発生しました (Guild: ${guildId})`, { error });
        await interaction.editReply({ content: 'エラーが発生し、時間を登録できませんでした。' });
    }
}

module.exports = { handleTimeModalSubmit };