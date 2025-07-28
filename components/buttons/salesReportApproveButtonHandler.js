// components/buttons/salesReportApproveButtonHandler.js
const { readJsonFromGCS, saveJsonToGCS } = require('../../utils/gcs');

module.exports = {
  customId: /^approve_sales_report_(\d{4}-\d{2}-\d{2})_(\d+)$/,
  async execute(interaction) {
    await interaction.deferUpdate(); // ボタンの応答を保留し、"インタラクションに失敗しました"と表示されるのを防ぐ

    const match = interaction.customId.match(this.customId);
    const [, date, userId] = match;
    const guildId = interaction.guildId;
    const approverId = interaction.user.id;

    const filePath = `data/sales_reports/${guildId}/uriage-houkoku-${date}-${userId}.json`;
    const settingsPath = `data/${guildId}/${guildId}.json`;

    try {
      const [reportData, settings] = await Promise.all([
        readJsonFromGCS(filePath),
        readJsonFromGCS(settingsPath)
      ]);

      if (!reportData) {
        return interaction.followUp({ content: '対象の報告データが見つかりませんでした。', ephemeral: true });
      }

      const approvalRoleIds = settings?.approvalRoleIds || [];
      const member = await interaction.guild.members.fetch(approverId);
      const hasApprovalRole = member.roles.cache.some(role => approvalRoleIds.includes(role.id));

      if (!hasApprovalRole && !member.permissions.has('Administrator')) {
        return interaction.followUp({ content: 'この報告を承認する権限がありません。', ephemeral: true });
      }

      reportData.approvers = reportData.approvers || [];
      if (reportData.approvers.includes(approverId)) {
        return interaction.followUp({ content: 'あなたは既にこの報告を承認済みです。', ephemeral: true });
      }

      reportData.approvers.push(approverId);
      await saveJsonToGCS(filePath, reportData);

      const originalMessage = interaction.message;
      let totalConfirmers = 0;
      if (approvalRoleIds.length > 0) {
        await interaction.guild.members.fetch();
        const membersWithAnyRole = new Set();
        for (const roleId of approvalRoleIds) {
          const role = await interaction.guild.roles.fetch(roleId);
          if (role) role.members.forEach(m => membersWithAnyRole.add(m.id));
        }
        totalConfirmers = membersWithAnyRole.size;
      }

      const newContent = originalMessage.content.replace(/✅『承認 \(\d+\/\d+\)』|⚠️『修正済・再承認待ち』|💮.*が『.*』の売上報告。/, `💮 <@${reportData.userId}>さん💮が『${reportData.categoryName || 'カテゴリなし'}』の売上報告。\n申請日：${reportData.日付} ✅『承認 (${reportData.approvers.length}/${totalConfirmers})』`);
      await originalMessage.edit({ content: newContent });

    } catch (error) {
      console.error(`❌ 売上報告の承認処理中にエラー (File: ${filePath}):`, error);
      await interaction.followUp({ content: '承認処理中にエラーが発生しました。', ephemeral: true });
    }
  },
};