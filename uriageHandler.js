// uriage_bot/handlers/uriageHandler.js
const { updateState } = require('../utils/uriageStateManager');
const logger = require('@common/logger');

const APPROVAL_ROLES_MENU_ID = 'uriage_select_approval_roles';

module.exports = {
  filePath: __filename,
  async execute(interaction) {
    if (!interaction.isRoleSelectMenu() || interaction.customId !== APPROVAL_ROLES_MENU_ID) {
      return false;
    }

    await interaction.deferUpdate();

    const selectedRoleIds = interaction.values;

    try {
      await updateState(interaction.guildId, (state) => {
        state.approvalRoleIds = selectedRoleIds;
        return state;
      });

      const roleMentions = selectedRoleIds.length > 0
        ? selectedRoleIds.map(id => `<@&${id}>`).join(', ')
        : 'なし';

      await interaction.editReply({
        content: `✅ 売上報告の承認ロールを更新しました。\n新しい設定: ${roleMentions}`,
        components: [],
        embeds: [],
      });

      logger.info(`[UriageHandler] 売上報告の承認ロールが更新されました。`, {
        guildId: interaction.guildId,
        userId: interaction.user.id,
        newRoles: selectedRoleIds,
      });

    } catch (error) {
      logger.error('[UriageHandler] 承認ロールの保存中にエラーが発生しました。', { error, guildId: interaction.guildId });
      await interaction.editReply({
        content: '❌ 設定の保存中にエラーが発生しました。',
        components: [],
        embeds: [],
      });
    }

    return true;
  },
};