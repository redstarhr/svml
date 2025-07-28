const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { saveJsonToGCS, copyGCSFile, readJsonFromGCS } = require('../../../utils/gcs');
const { parseAndValidateReportData } = require('../../../utils/salesReportUtils');

module.exports = {
  // このIDは、売上報告パネルのボタンを押したときに表示されるモーダルのIDと一致させる必要があります。
  customId: 'sales_report_modal', 
  async execute(interaction) {
    const { data, error } = parseAndValidateReportData(interaction);
    if (error) { return interaction.reply({ content: error, ephemeral: true }); }
    const { normalizedDate, totalNum, cashNum, cardNum, expenseNum, balance } = data;

    const embed = new EmbedBuilder()
      .setTitle('📈 売上報告')
      .setColor(0x0099ff)
      .setDescription(`${interaction.user} さんからの報告です。`)
      .addFields(
        { name: '日付', value: normalizedDate, inline: true },
        { name: '総売り', value: `¥${totalNum.toLocaleString()}`, inline: true },
        { name: '現金', value: `¥${cashNum.toLocaleString()}`, inline: true },
        { name: 'カード', value: `¥${cardNum.toLocaleString()}`, inline: true },
        { name: '諸経費', value: `¥${expenseNum.toLocaleString()}`, inline: true },
        { name: '残金', value: `¥${balance.toLocaleString()}`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: `報告者: ${interaction.user.username}` });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('sales_report') // 次の報告用ボタン
        .setLabel('次の売上を報告')
        .setStyle(ButtonStyle.Success)
    );

    const settingsPath = `data/${interaction.guildId}/${interaction.guildId}.json`;
    const settings = await readJsonFromGCS(settingsPath) || {};
    const approvalRoleIds = settings.approvalRoleIds || [];
    let totalConfirmers = 0;
    // (承認者数取得ロジックは省略)

    const category = interaction.channel.parent;
    const categoryName = category?.name || 'カテゴリなし';
    const userId = interaction.user.id;
    const guildId = interaction.guildId;
    const filePath = `data/sales_reports/${guildId}/uriage-houkoku-${normalizedDate}-${userId}.json`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logPath = `logs/sales_reports/${guildId}/uriage-houkoku-${normalizedDate}-${userId}_${timestamp}.json`;

    const salesData = {
      入力者: interaction.user.username,
      userId: userId,
      日付: normalizedDate,
      総売り: totalNum,
      現金: cashNum,
      カード: cardNum,
      諸経費: expenseNum,
      残金: balance,
      登録日時: new Date().toISOString(),
      messageId: null,
    };

    await copyGCSFile(filePath, logPath);
    await saveJsonToGCS(filePath, salesData);

    const replyContent = `💮 <@${interaction.user.id}>さん💮が『${categoryName}』の売上報告。\n申請日：${normalizedDate} ✅『承認 (0/${totalConfirmers})』`;
    const replyMessage = await interaction.reply({
      content: replyContent,
      embeds: [embed],
      components: [buttons],
      fetchReply: true,
    });

    salesData.messageId = replyMessage.id;
    await saveJsonToGCS(filePath, salesData);
  },
};