// e:\共有フォルダ\svml_zimu_bot-main\svml_zimu_bot-main\uriage_bot\uriage_handler.js

const {
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    StringSelectMenuBuilder,
    AttachmentBuilder,
} = require('discord.js');
const { readJsonFromGCS, saveJsonToGCS, listFilesInGCS } = require('../common/gcs/gcsUtils');
const { DateTime } = require('luxon');
const logger = require('@common/logger');

const SETTINGS_FILE_PATH = (guildId) => `data/${guildId}/uriage/config.json`;

/**
 * ロール選択メニューの操作を処理
 * @param {import('discord.js').RoleSelectMenuInteraction} interaction
 */
async function handleRoleSelectMenu(interaction) {
    await interaction.deferUpdate();

    const guildId = interaction.guildId;
    const selectedRoleIds = interaction.values;
    const settingsPath = SETTINGS_FILE_PATH(guildId);

    try {
        const currentSettings = await readJsonFromGCS(settingsPath) || {};
        const newSettings = {
            ...currentSettings,
            approvalRoleIds: selectedRoleIds,
        };

        await saveJsonToGCS(settingsPath, newSettings);

        const embed = new EmbedBuilder()
            .setTitle('✅ 設定完了')
            .setColor(0x57F287);

        if (selectedRoleIds.length > 0) {
            const roleMentions = selectedRoleIds.map(id => `<@&${id}>`).join(', ');
            embed.setDescription(`売上報告の承認ロールを以下に設定しました。\n${roleMentions}`);
        } else {
            embed.setDescription('売上報告の承認ロールをすべて解除しました。');
        }

        await interaction.editReply({ embeds: [embed], components: [] });

    } catch (error) {
        logger.error('❌ 承認ロール設定の保存中にエラー:', { error, guildId });
        await interaction.editReply({
            content: 'エラーが発生し、設定を保存できませんでした。',
            embeds: [],
            components: []
        });
    }
}

/**
 * CSVのフィールドをエスケープ処理します。
 * @param {string | number | null | undefined} field
 * @returns {string}
 */
function escapeCsvField(field) {
    const str = String(field ?? ''); // nullやundefinedを空文字に変換
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        // ダブルクォートで囲み、内部のダブルクォートは2つにエスケープ
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * 月次CSV出力ボタンの処理
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleCsvExportMonthlyButton(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const guildId = interaction.guildId;

    try {
        const prefix = `data/${guildId}/`;
        const allReportFiles = await listFilesInGCS(prefix);

        const yearMonths = new Set();
        for (const file of allReportFiles) {
            const dateMatch = file.name.match(/uriagehoukoku_(\d{4}-\d{2})-\d{2}\.json$/);
            if (dateMatch) {
                yearMonths.add(dateMatch[1]); // YYYY-MM
            }
        }

        if (yearMonths.size === 0) {
            await interaction.editReply({ content: 'CSV出力対象の売上報告データがありません。' });
            return;
        }

        const sortedMonths = Array.from(yearMonths).sort().reverse();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('csv_select_month')
            .setPlaceholder('出力したい月を選択してください（複数選択可）')
            .setMinValues(1)
            .setMaxValues(sortedMonths.length > 25 ? 25 : sortedMonths.length) // Discordのセレクトメニューオプション上限は25
            .addOptions(
                sortedMonths.slice(0, 25).map(month => ({
                    label: `${month.replace('-', '年')}月`,
                    value: month,
                }))
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.editReply({
            content: '以下のメニューからCSVとして出力したい月を選択してください。',
            components: [row],
        });

    } catch (error) {
        logger.error('❌ 月次CSV出力の準備中にエラー:', { error, guildId });
        await interaction.editReply({ content: 'データの読み込み中にエラーが発生しました。', components: [] });
    }
}

/**
 * 月次CSV出力の月選択メニューの処理
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 */
async function handleCsvSelectMonth(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const guildId = interaction.guildId;
    const selectedMonths = interaction.values; // ['2024-07', '2024-06']

    try {
        let filesSent = 0;
        for (const month of selectedMonths) {
            const prefix = `data/${guildId}/uriagehoukoku_${month}-`;
            const monthReportFiles = await listFilesInGCS(prefix);

            if (monthReportFiles.length === 0) {
                await interaction.followUp({ content: `⚠️ ${month}には処理対象のデータがありませんでした。`, ephemeral: true });
                continue;
            }

            const reports = [];
            for (const file of monthReportFiles) {
                const data = await readJsonFromGCS(file.name);
                if (data) reports.push(data);
            }

            if (reports.length === 0) {
                await interaction.followUp({ content: `⚠️ ${month}のデータ読み込みに失敗しました。`, ephemeral: true });
                continue;
            }

            reports.sort((a, b) => new Date(a.date) - new Date(b.date));

            const csvHeader = ['日付', '総売り', '現金', 'カード', '諸経費', '現金残', '報告者', '報告日時', '承認ステータス', '承認者', '承認日時'].join(',');
            const csvRows = reports.map(r => [
                r.date,
                r.totalSales,
                r.cashSales,
                r.cardSales,
                r.expenses,
                (r.cashSales - r.expenses), // 現金残
                r.reporterTag,
                r.reportedAt ? DateTime.fromISO(r.reportedAt).setZone('Asia/Tokyo').toFormat('yyyy-MM-dd HH:mm') : '',
                r.approval?.status ?? '未処理',
                r.approval?.approverTag ?? '',
                r.approval?.approvedAt ? DateTime.fromISO(r.approval.approvedAt).setZone('Asia/Tokyo').toFormat('yyyy-MM-dd HH:mm') : ''
            ].map(escapeCsvField).join(','));

            const csvContent = [csvHeader, ...csvRows].join('\n');
            const csvBuffer = Buffer.from('\uFEFF' + csvContent, 'utf8'); // Add BOM for Excel

            const attachment = new AttachmentBuilder(csvBuffer, { name: `【月次】売上報告_${month}.csv` });

            await interaction.followUp({
                content: `✅ ${month}の売上報告CSVファイルです。`,
                files: [attachment],
                ephemeral: true
            });
            filesSent++;
        }

        if (filesSent > 0) {
            await interaction.editReply({ content: `✅ 選択された月のCSVファイルを送信しました。`, components: [] });
        } else {
            await interaction.editReply({ content: '処理対象のデータが見つかりませんでした。', components: [] });
        }

    } catch (error) {
        logger.error('❌ 月次CSVの生成中にエラー:', { error, guildId });
        await interaction.editReply({ content: 'CSVファイルの生成中にエラーが発生しました。', components: [] });
    }
}

/**
 * 売上報告用のUI（EmbedとButton）を再生成します。
 * @param {import('discord.js').TextChannel} channel
 */
async function regenerateReportUI(channel) {
    // チャンネル内の古いUIを検索して削除
    try {
        const messages = await channel.messages.fetch({ limit: 50 });
        const oldUIMessage = messages.find(m =>
            m.author.id === channel.client.user.id &&
            m.components.some(row =>
                row.components.some(comp => comp.customId === 'show_sales_report_modal')
            )
        );
        if (oldUIMessage) {
            await oldUIMessage.delete();
        }
    } catch (error) {
        logger.warn('古い報告UIの削除中にエラーが発生しました（無視します）', { error, channelId: channel.id });
    }

    // 新しいUIを作成して送信 (uriage_houkoku.jsから流用)
    const embed = new EmbedBuilder()
        .setTitle('📊 売上報告')
        .setDescription('下の「報告」ボタンを押して、本日の売上を入力してください。')
        .addFields(
            { name: '日付', value: '例 7/7', inline: true },
            { name: '総売り', value: '例 300,000', inline: true },
            { name: '現金', value: '例 150,000', inline: true },
            { name: 'カード', value: '例 150,000', inline: true },
            { name: '諸経費', value: '例 150,000', inline: true },
        )
        .setColor(0x3498DB)
        .setFooter({ text: 'SVML事務Bot' });

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('show_sales_report_modal').setLabel('報告').setStyle(ButtonStyle.Primary)
    );

    await channel.send({ embeds: [embed], components: [buttons] });
}

/**
 * 数値を3桁区切りの文字列にフォーマットします
 * @param {number} num - フォーマットする数値
 * @returns {string} - フォーマット後の文字列
 */
function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return new Intl.NumberFormat('ja-JP').format(num);
}

/**
 * 売上報告モーダルの送信を処理します
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 */
async function handleModalSubmit(interaction) {
    const isEdit = interaction.customId.startsWith('sales_report_edit_modal_');
    let originalMessageId = null;
    if (isEdit) {
        originalMessageId = interaction.customId.split('_').pop();
    }

    await interaction.deferReply({ ephemeral: true });

    try {
        const guildId = interaction.guildId;
        const channel = interaction.channel;

        // モーダルからデータを取得
        const salesDateStr = interaction.fields.getTextInputValue('sales_date');
        const totalSalesStr = interaction.fields.getTextInputValue('total_sales');
        const cashSalesStr = interaction.fields.getTextInputValue('cash_sales');
        const cardSalesStr = interaction.fields.getTextInputValue('card_sales');
        const expensesStr = interaction.fields.getTextInputValue('expenses');

        // 入力値のパースとバリデーション
        const totalSales = parseInt(totalSalesStr.replace(/,/g, ''), 10);
        const cashSales = parseInt(cashSalesStr.replace(/,/g, ''), 10);
        const cardSales = parseInt(cardSalesStr.replace(/,/g, ''), 10);
        const expenses = parseInt(expensesStr.replace(/,/g, ''), 10);

        if ([totalSales, cashSales, cardSales, expenses].some(val => isNaN(val))) {
            await interaction.editReply({ content: '⚠️ 金額は半角数字で入力してください。' });
            return;
        }

        // 日付のパース (例: "7/7" -> "2024-07-07")
        let salesDate = DateTime.fromFormat(salesDateStr, 'M/d', { zone: 'Asia/Tokyo' }).set({ year: DateTime.now().year });
        if (!salesDate.isValid) {
            await interaction.editReply({ content: '⚠️ 日付の形式が正しくありません。(例: 7/7)' });
            return;
        }
        const dateForFilename = salesDate.toFormat('yyyy-MM-dd');

        // GCSに保存するデータを作成
        const reportDataPayload = {
            date: salesDate.toISODate(),
            totalSales,
            cashSales,
            cardSales,
            expenses,
            reporterId: interaction.user.id,
            reporterTag: interaction.user.tag,
            reportedAt: DateTime.now().toISO(),
        };

        const dataPath = `data/${guildId}/uriagehoukoku_${dateForFilename}.json`;

        // 既存データがあればバックアップ
        try {
            const existingData = await readJsonFromGCS(dataPath);
            if (existingData && existingData.reportedAt) {
                const backupTimestamp = DateTime.fromISO(existingData.reportedAt).toFormat('yyyyMMddHHmmss');
                const backupPath = `logs/${guildId}/uriagehoukoku_${dateForFilename}_${backupTimestamp}.json`;
                await saveJsonToGCS(backupPath, existingData);
            }
        } catch (error) {
            if (error.code !== 404) logger.warn(`GCSからの既存ファイル読み込み中に無視できないエラー:`, { error, guildId });
        }

        // 新しいデータを保存
        await saveJsonToGCS(dataPath, reportDataPayload);

        // Embedを作成
        const remainder = cashSales - expenses; // 現金残高の計算
        const embed = new EmbedBuilder()
            .setTitle(`📊 売上報告 (${salesDate.toFormat('M/d')})`)
            .setColor(0x0099FF)
            .addFields(
                { name: '総売り', value: `¥${formatNumber(totalSales)}`, inline: true },
                { name: '現金', value: `¥${formatNumber(cashSales)}`, inline: true },
                { name: 'カード', value: `¥${formatNumber(cardSales)}`, inline: true },
                { name: '諸経費', value: `¥${formatNumber(expenses)}`, inline: true },
                { name: '現金残', value: `¥${formatNumber(remainder)}`, inline: true },
            )
            .setFooter({ text: `報告者: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        // 承認/却下/修正ボタンを作成
        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`uriage_approve_${dateForFilename}`)
                    .setLabel('承認')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`uriage_reject_${dateForFilename}`)
                    .setLabel('却下')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('sales_report_edit') // 修正ボタンは既存のハンドラを再利用
                    .setLabel('修正')
                    .setStyle(ButtonStyle.Secondary)
            );

        if (isEdit) {
            // 編集の場合
            const originalMessage = await channel.messages.fetch(originalMessageId);
            if (originalMessage) {
                await originalMessage.edit({ embeds: [embed], components: [actionRow] });
                await interaction.editReply({ content: `✅ 報告を更新しました` });
            } else {
                await interaction.editReply({ content: '⚠️ 元のメッセージが見つからず、更新できませんでした。' });
            }
        } else {
            // 新規投稿の場合
            const reportMessage = await channel.send({ embeds: [embed], components: [actionRow] });
            await interaction.editReply({ content: `✅ 売上を報告しました` });

            // 仕様書通り、報告後にUIを再生成する
            await regenerateReportUI(channel);
        }
    } catch (error) {
        logger.error('❌ 売上報告モーダルの処理中にエラー:', { error, guildId: interaction.guildId });
        const errorMessage = 'エラーが発生し、報告を処理できませんでした。';
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: errorMessage, embeds: [], components: [] });
        }
    }
}

async function handleApproval(interaction, isApproved) {
    await interaction.deferUpdate();

    const guildId = interaction.guildId;
    const member = interaction.member;

    // 承認ロールを持っているか、または管理者かを確認
    const settingsPath = SETTINGS_FILE_PATH(guildId);
    const settings = await readJsonFromGCS(settingsPath) || {};
    const approvalRoleIds = settings.approvalRoleIds || [];

    let hasPermission = false;
    if (approvalRoleIds.length > 0) {
        hasPermission = member.roles.cache.some(role => approvalRoleIds.includes(role.id));
    } else {
        // ロール未設定の場合はサーバー管理者のみが操作可能
        hasPermission = member.permissions.has(PermissionFlagsBits.Administrator);
    }

    if (!hasPermission) {
        await interaction.followUp({ content: '⚠️ この操作を行う権限がありません。', ephemeral: true });
        return;
    }

    // customIdから日付を抽出
    const dateForFilename = interaction.customId.split('_').pop();
    const dataPath = `data/${guildId}/uriagehoukoku_${dateForFilename}.json`;

    try {
        const reportData = await readJsonFromGCS(dataPath);
        if (!reportData) {
            await interaction.editReply({ content: 'エラー: 元の報告データが見つかりませんでした。', components: [] });
            return;
        }

        // 承認情報をデータに追記
        reportData.approval = {
            status: isApproved ? 'approved' : 'rejected',
            approverId: interaction.user.id,
            approverTag: interaction.user.tag,
            approvedAt: DateTime.now().toISO(),
        };
        await saveJsonToGCS(dataPath, reportData);

        // Embedを更新
        const originalEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
        originalEmbed.setColor(isApproved ? 0x57F287 : 0xED4245) // Green: Approved, Red: Rejected
            .setFields(interaction.message.embeds[0].fields.filter(field => field.name !== 'ステータス')) // 既存のステータスを削除
            .addFields({
                name: 'ステータス',
                value: `${isApproved ? '✅ 承認済み' : '❌ 却下済み'} (by ${interaction.user.tag})`,
            });

        // ボタンを更新（承認・却下のみ無効化）
        const updatedButtons = new ActionRowBuilder();
        interaction.message.components[0].components.forEach(button => {
            const newButton = ButtonBuilder.from(button);
            if (button.customId.startsWith('uriage_approve_') || button.customId.startsWith('uriage_reject_')) {
                newButton.setDisabled(true);
            }
            updatedButtons.addComponents(newButton);
        });

        // DM通知を試みる
        try {
            const reporter = await interaction.client.users.fetch(reportData.reporterId);
            const dmEmbed = new EmbedBuilder()
                .setTitle(`あなたの売上報告が${isApproved ? '承認' : '却下'}されました`)
                .setColor(isApproved ? 0x57F287 : 0xED4245)
                .setURL(interaction.message.url) // 元のメッセージへのリンクを追加
                .addFields({ name: '日付', value: DateTime.fromISO(reportData.date).toFormat('M/d') })
                .setFooter({ text: `処理者: ${interaction.user.tag}` })
                .setTimestamp();
            await reporter.send({ embeds: [dmEmbed] });
        } catch (dmError) {
            logger.warn(`⚠️ 報告者(${reportData.reporterTag})へのDM送信に失敗しました:`, { message: dmError.message, guildId });
            // DMが送れなくても処理は続行する
        }

        await interaction.editReply({ embeds: [originalEmbed], components: [updatedButtons] });

    } catch (error) {
        logger.error(`❌ 報告の${isApproved ? '承認' : '却下'}処理中にエラー:`, { error, guildId });
        await interaction.followUp({ content: 'エラーが発生し、処理を完了できませんでした。', ephemeral: true });
    }
}

/**
 * 売上報告モーダルを表示します
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {object | null} [reportData=null] - 編集時にモーダルに事前入力するデータ
 * @param {string | null} [messageId=null] - 編集対象のメッセージID
 */
async function showSalesReportModal(interaction, reportData = null, messageId = null) {
    const isEdit = !!reportData;

    const modal = new ModalBuilder()
        .setCustomId(isEdit ? `sales_report_edit_modal_${messageId}` : 'sales_report_modal')
        .setTitle(isEdit ? '売上報告の修正' : '売上報告');

    // 各入力フィールドを定義
    const dateInput = new TextInputBuilder()
        .setCustomId('sales_date')
        .setLabel('日付 (例: 7/7)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder(isEdit ? '' : '7/7')
        .setValue(isEdit ? DateTime.fromISO(reportData.date).toFormat('M/d') : '');

    const totalSalesInput = new TextInputBuilder()
        .setCustomId('total_sales')
        .setLabel('総売り (半角数字)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder(isEdit ? '' : '300000')
        .setValue(isEdit ? String(reportData.totalSales) : '');

    const cashInput = new TextInputBuilder()
        .setCustomId('cash_sales')
        .setLabel('現金 (半角数字)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder(isEdit ? '' : '150000')
        .setValue(isEdit ? String(reportData.cashSales) : '');

    const cardInput = new TextInputBuilder()
        .setCustomId('card_sales')
        .setLabel('カード (半角数字)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder(isEdit ? '' : '150000')
        .setValue(isEdit ? String(reportData.cardSales) : '');

    const expensesInput = new TextInputBuilder()
        .setCustomId('expenses')
        .setLabel('諸経費 (半角数字)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder(isEdit ? '' : '10000')
        .setValue(isEdit ? String(reportData.expenses) : '');

    // モーダルに行として追加
    modal.addComponents(
        new ActionRowBuilder().addComponents(dateInput),
        new ActionRowBuilder().addComponents(totalSalesInput),
        new ActionRowBuilder().addComponents(cashInput),
        new ActionRowBuilder().addComponents(cardInput),
        new ActionRowBuilder().addComponents(expensesInput)
    );

    await interaction.showModal(modal);
}

/**
 * 売上報告の修正処理
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleEditSalesReport(interaction) {
    const message = interaction.message;
    const embed = message.embeds[0];

    if (!embed || !embed.title) {
        return interaction.reply({ content: '⚠️ 修正対象の報告埋め込みが見つかりません。', ephemeral: true });
    }

    // タイトルから日付を抽出: "📊 売上報告 (7/7)" -> "7/7"
    const dateMatch = embed.title.match(/\((\d{1,2}\/\d{1,2})\)/);
    if (!dateMatch || !dateMatch[1]) {
        return interaction.reply({ content: '⚠️ 報告埋め込みから日付を特定できませんでした。', ephemeral: true });
    }

    const salesDateStr = dateMatch[1];
    const salesDate = DateTime.fromFormat(salesDateStr, 'M/d', { zone: 'Asia/Tokyo' }).set({ year: DateTime.now().year });
    const dateForFilename = salesDate.toFormat('yyyy-MM-dd');
    const dataPath = `data/${interaction.guildId}/uriagehoukoku_${dateForFilename}.json`;

    try {
        const existingData = await readJsonFromGCS(dataPath);
        if (!existingData) {
            return interaction.reply({ content: '⚠️ GCSから元データが見つかりませんでした。新規で報告してください。', ephemeral: true });
        }

        // 既存データをセットしてモーダルを表示
        await showSalesReportModal(interaction, existingData, message.id);

    } catch (error) {
        logger.error('❌ 報告修正データの読み込み中にエラー:', { error, guildId: interaction.guildId });
        await interaction.reply({ content: 'エラーが発生し、修正を開始できませんでした。', ephemeral: true });
    }
}

module.exports = {
    /**
     * uriage_bot関連のコンポーネントインタラクションを処理します。
     * @param {import('discord.js').Interaction} interaction
     * @param {import('discord.js').Client} client
     * @returns {Promise<boolean>} - インタラクションを処理した場合はtrue、それ以外はfalse
     */
    async execute(interaction, client) {
        // このハンドラはコンポーネント操作のみを対象とします
        if (!interaction.isMessageComponent() && !interaction.isModalSubmit()) {
            return false;
        }

        const customId = interaction.customId;

        // customIdに応じて処理を振り分け
        if (customId === 'select_approval_roles') {
            await handleRoleSelectMenu(interaction);
            return true;
        }

        if (customId === 'show_sales_report_modal') {
            await showSalesReportModal(interaction);
            return true;
        }

        if (customId === 'sales_report_edit') {
            await handleEditSalesReport(interaction);
            return true;
        }

        if (customId.startsWith('uriage_approve_')) {
            await handleApproval(interaction, true);
            return true;
        }

        if (customId.startsWith('uriage_reject_')) {
            await handleApproval(interaction, false);
            return true;
        }

        if (customId === 'csv_export_monthly') {
            await handleCsvExportMonthlyButton(interaction);
            return true;
        }

        if (customId === 'csv_select_month') {
            await handleCsvSelectMonth(interaction);
            return true;
        }

        if (customId === 'csv_export_quarterly' || customId === 'csv_export_daily') {
            await interaction.reply({ content: 'この機能は現在開発中です。', ephemeral: true });
            return true;
        }

        if (interaction.isModalSubmit() && (customId === 'sales_report_modal' || customId.startsWith('sales_report_edit_modal'))) {
            await handleModalSubmit(interaction);
            return true;
        }

        // このハンドラでは処理されなかった
        return false;
    }
};