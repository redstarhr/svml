// components/modals/keihiModalHandler.js
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { readJsonFromGCS, saveJsonToGCS, copyGCSFile } = require('../../../utils/gcs');
const { normalizeDate } = require('../../../utils/date');

module.exports = {
    customId: 'keihi_modal',
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const dateInput = interaction.fields.getTextInputValue('keihi_date');
            const item = interaction.fields.getTextInputValue('keihi_item');
            const amount = interaction.fields.getTextInputValue('keihi_amount');
            const description = interaction.fields.getTextInputValue('keihi_description');

            const amountNum = parseInt(amount, 10);
            if (isNaN(amountNum)) {
                return interaction.editReply({ content: '金額は半角数字で入力してください。', ephemeral: true });
            }

            const normalizedDate = normalizeDate(dateInput);
            if (!normalizedDate) {
                return interaction.editReply({ content: '日付の形式が正しくありません。「月/日」の形式で入力してください。(例: 7/18)', ephemeral: true });
            }

            const guildId = interaction.guildId;
            const userId = interaction.user.id;
            const timestamp = new Date().toISOString();
            const fileName = `keihi-${normalizedDate}-${userId}-${Date.now()}.json`;
            const filePath = `data/keihi_reports/${guildId}/${fileName}`;
            const logPath = `logs/keihi_reports/${guildId}/${fileName}`;

            const keihiData = {
                申請者: interaction.user.username,
                userId: userId,
                日付: normalizedDate,
                品目: item,
                金額: amountNum,
                摘要: description,
                申請日時: timestamp,
                messageId: null,
                承認者: [],
            };

            await copyGCSFile(filePath, logPath);
            await saveJsonToGCS(filePath, keihiData);

            const embed = new EmbedBuilder()
                .setTitle('経費申請')
                .setDescription(`申請者: <@