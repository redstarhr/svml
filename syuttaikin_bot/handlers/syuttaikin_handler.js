const logger = require('@common/logger');
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { readState, writeState } = require('../utils/syuttaikiStateManager');

/**
 * 出退勤時間の登録モーダルを表示します。
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {'arrival' | 'departure'} type - 'arrival' または 'departure'
 */
async function handleAddTimeButton(interaction, type) {
    const modal = new ModalBuilder()
        .setCustomId(`modal_add_time_${type}`)
        .setTitle(`${type === 'arrival' ? '出勤' : '退勤'}時間登録`);

    const timeInput = new TextInputBuilder()
        .setCustomId('time_input')
        .setLabel('時間 (HH:mm形式, 例: 20:30)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('20:30');

    const row = new ActionRowBuilder().addComponents(timeInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
}

/**
 * 時間登録モーダルの送信を処理します。
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 */
async function handleTimeModalSubmit(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guildId = interaction.guildId;
    const type = interaction.customId.includes('arrival') ? 'arrival' : 'departure';
    const timeValue = interaction.fields.getTextInputValue('time_input');

    // HH:mm 形式のバリデーション
    if (!/^\d{2}:\d{2}$/.test(timeValue)) {
        await interaction.editReply({ content: '⚠️ 時間の形式が正しくありません。`HH:mm` (例: `20:30`) 形式で入力してください。' });
        return;
    }

    try {
        const state = await readState(guildId);
        const timeArray = type === 'arrival' ? state.syuttaikin.arrivalTimes : state.syuttaikin.departureTimes;

        if (timeArray.includes(timeValue)) {
            await interaction.editReply({ content: `✅ 時間「${timeValue}」は既に登録されています。` });
            return;
        }

        timeArray.push(timeValue);
        await writeState(guildId, state);

        await interaction.editReply({ content: `✅ ${type === 'arrival' ? '出勤' : '退勤'}時間「${timeValue}」を登録しました。` });

    } catch (error) {
        logger.error('時間の登録処理中にエラーが発生しました。', { guildId, error });
        await interaction.editReply({ content: 'エラーが発生し、時間を登録できませんでした。' });
    }
}

async function handleNotImplemented(interaction) {
    // 今後の実装のために、未実装であることをユーザーに伝える
    await interaction.reply({
        content: `機能「${interaction.component?.label ?? 'この機能'}」は現在開発中です。`,
        flags: MessageFlags.Ephemeral,
    });
}


module.exports = {
    /**
     * syuttaikin_bot関連のコンポーネントインタラクションを処理します。
     * @param {import('discord.js').Interaction} interaction
     * @param {import('discord.js').Client} client
     * @returns {Promise<boolean>} - インタラクションを処理した場合はtrue、それ以外はfalse
     */
    async execute(interaction, client) {
        if (!interaction.isMessageComponent() && !interaction.isModalSubmit()) {
            return false;
        }

        const { customId } = interaction;

        // 設定ボタンの処理
        if (customId === 'config_add_arrival_time') {
            await handleAddTimeButton(interaction, 'arrival');
            return true;
        }
        if (customId === 'config_add_departure_time') {
            await handleAddTimeButton(interaction, 'departure');
            return true;
        }

        // 時間登録モーダルの処理
        if (customId.startsWith('modal_add_time_')) {
            await handleTimeModalSubmit(interaction);
            return true;
        }

        // その他の未実装機能
        if (
            customId.startsWith('config_') ||
            customId.startsWith('arrival_time_') ||
            customId.startsWith('departure_time_')
        ) {
            await handleNotImplemented(interaction);
            return true;
        }

        // このハンドラでは処理されなかった
        return false;
    }
};