// syuttaiki_bot/tasks/dailyPanelTask.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { readState } = require('../utils/syuttaikinStateManager');
const logger = require('@common/logger');
const { DateTime } = require('luxon');

/**
 * Creates the content for the daily attendance panel.
 * This should be consistent with the `/cast-panel` command.
 * @returns {{embeds: EmbedBuilder[], components: ActionRowBuilder[]}}
 */
function createDailyPanel() {
    const embed = new EmbedBuilder()
        .setTitle('キャスト出退勤パネル')
        .setDescription('該当するボタンを押して出勤・退勤を記録してください。')
        .setColor(0x3498DB);

    // These custom IDs must match the ones handled by the syuttaikin_button handler.
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('syuttaikin_clock-in_normal').setLabel('通常出勤').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('syuttaikin_clock-out_normal').setLabel('通常退勤').setStyle(ButtonStyle.Danger)
    );
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('syuttaikin_clock-in_help').setLabel('ヘルプ出勤').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('syuttaikin_clock-out_help').setLabel('ヘルプ退勤').setStyle(ButtonStyle.Danger)
    );

    return { embeds: [embed], components: [row1, row2] };
}

async function postDailyPanel(client, guild) {
    try {
        const state = await readState(guild.id);
        const panelChannelId = state.syuttaikin?.panelChannelId;

        if (!panelChannelId) return;

        const channel = await client.channels.fetch(panelChannelId).catch(() => null);
        if (!channel || !channel.isTextBased()) {
            logger.error(`[DailyPanelTask] 出退勤パネル用のチャンネルが見つかりません (Guild: ${guild.name}, ChannelID: ${panelChannelId})`);
            return;
        }

        const panelContent = createDailyPanel();
        await channel.send(panelContent);
        logger.info(`[DailyPanelTask] 出退勤パネルを投稿しました (Guild: ${guild.name})`);

    } catch (error) {
        logger.error(`[DailyPanelTask] 出退勤パネルの投稿に失敗しました (Guild: ${guild.name})`, { error });
    }
}

function scheduleDailyPanelTask(client) {
    const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1時間ごとにチェック
    const POST_HOUR_JST = 18; // JST 18時 (午後6時) に投稿

    let lastPostDate = null;

    setInterval(async () => {
        const nowJST = DateTime.now().setZone('Asia/Tokyo');
        const todayStr = nowJST.toISODate();

        if (nowJST.hour === POST_HOUR_JST && lastPostDate !== todayStr) {
            logger.info('[DailyPanelTask] 出退勤パネルの投稿時間です。');
            lastPostDate = todayStr;

            for (const guild of client.guilds.cache.values()) {
                await postDailyPanel(client, guild);
            }
        }
    }, CHECK_INTERVAL_MS);
}

module.exports = { scheduleDailyPanelTask };