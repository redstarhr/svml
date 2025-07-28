// utils/uriage_buttons.js

const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    StringSelectMenuBuilder,
} = require('discord.js');
const { listFilesInGCS, readJsonFromGCS } = require('./gcs');

module.exports = {
    async execute(interaction) {
        if (interaction.isButton()) {
            // 「売上報告」ボタン
            if (interaction.customId === 'sales_report') {
                const modal = new ModalBuilder()
                    .setCustomId('sales_report_modal')
                    .setTitle('売上報告');

                const dateInput = new TextInputBuilder()
                    .setCustomId('report_date')
                    .setLabel('日付 (例: 7/23)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const totalInput = new TextInputBuilder()
                    .setCustomId('report_total')
                    .setLabel('総売り（半角数字）')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const cashInput = new TextInputBuilder()
                    .setCustomId('report_cash')
                    .setLabel('現金（半角数字）')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const cardInput = new TextInputBuilder()
                    .setCustomId('report_card')
                    .setLabel('カード（半角数字）')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const expenseInput = new TextInputBuilder()
                    .setCustomId('report_expense')
                    .setLabel('諸経費（半角数字）')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(dateInput),
                    new ActionRowBuilder().addComponents(totalInput),
                    new ActionRowBuilder().addComponents(cashInput),
                    new ActionRowBuilder().addComponents(cardInput),
                    new ActionRowBuilder().addComponents(expenseInput),
                );

                await interaction.showModal(modal);
                return true;
            }

            // 「報告を修正」ボタン
            if (interaction.customId === 'sales_report_edit') {
                await interaction.deferReply({ ephemeral: true });

                const guildId = interaction.guildId;
                const userId = interaction.user.id;
                const prefix = `data/sales_reports/${guildId}/`;

                const files = await listFilesInGCS(prefix);
                const userFiles = files.filter(file => file.name.endsWith(`-${userId}.json`));

                if (userFiles.length === 0) {
                    await interaction.editReply({ content: '修正対象の報告が見つかりませんでした。', ephemeral: true });
                    return true;
                }

                // ファイル名から日付を抽出し、セレクトメニューのオプションを作成
                const options = userFiles.map(file => {
                    const fileName = file.name.split('/').pop();
                    const datePart = fileName.replace(`uriage-houkoku-`, '').replace(`-${userId}.json`, '');
                    return {
                        label: datePart, // YYYY-MM-DD
                        value: datePart, // YYYY-MM-DD
                    };
                }).slice(0, 25);

                if (options.length === 0) {
                    await interaction.editReply({ content: '修正対象の報告が見つかりませんでした。', ephemeral: true });
                    return true;
                }

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('select_edit_report')
                    .setPlaceholder('修正したい報告の日付を選択してください')
                    .addOptions(options);

                const row = new ActionRowBuilder().addComponents(selectMenu);

                await interaction.editReply({
                    content: '修正したい報告を選択してください。',
                    components: [row],
                    ephemeral: true
                });
                return true;
            }
        }

        if (interaction.isStringSelectMenu()) {
            // 修正対象の報告を選択したセレクトメニュー
            if (interaction.customId === 'select_edit_report') {
                const selectedDate = interaction.values[0];
                const guildId = interaction.guildId;
                const userId = interaction.user.id;
                const filePath = `data/sales_reports/${guildId}/uriage-houkoku-${selectedDate}-${userId}.json`;

                const reportData = await readJsonFromGCS(filePath);

                if (!reportData) {
                    await interaction.reply({ content: '選択された報告データの読み込みに失敗しました。', ephemeral: true });
                    return true;
                }

                // 修正用モーダルを作成
                const modal = new ModalBuilder()
                    .setCustomId(`edit_sales_report_modal_${selectedDate}_${userId}`)
                    .setTitle(`${selectedDate} の売上報告を修正`);

                // YYYY-MM-DD を M/D 形式に変換して表示
                const [, month, day] = selectedDate.split('-').map(Number);
                const displayDate = `${month}/${day}`;

                const dateInput = new TextInputBuilder()
                    .setCustomId('report_date')
                    .setLabel('日付 (例: 7/23)')
                    .setStyle(TextInputStyle.Short)
                    .setValue(displayDate)
                    .setRequired(true);

                const totalInput = new TextInputBuilder()
                    .setCustomId('report_total')
                    .setLabel('総売り（半角数字）')
                    .setStyle(TextInputStyle.Short)
                    .setValue(String(reportData.総売り))
                    .setRequired(true);

                const cashInput = new TextInputBuilder()
                    .setCustomId('report_cash')
                    .setLabel('現金（半角数字）')
                    .setStyle(TextInputStyle.Short)
                    .setValue(String(reportData.現金))
                    .setRequired(true);

                const cardInput = new TextInputBuilder()
                    .setCustomId('report_card')
                    .setLabel('カード（半角数字）')
                    .setStyle(TextInputStyle.Short)
                    .setValue(String(reportData.カード))
                    .setRequired(true);

                const expenseInput = new TextInputBuilder()
                    .setCustomId('report_expense')
                    .setLabel('諸経費（半角数字）')
                    .setStyle(TextInputStyle.Short)
                    .setValue(String(reportData.諸経費))
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(dateInput),
                    new ActionRowBuilder().addComponents(totalInput),
                    new ActionRowBuilder().addComponents(cashInput),
                    new ActionRowBuilder().addComponents(cardInput),
                    new ActionRowBuilder().addComponents(expenseInput),
                );

                await interaction.showModal(modal);
                return true;
            }
        }

        return false;
    }
};
