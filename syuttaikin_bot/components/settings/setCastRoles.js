const { updateState } = require('@root/syuttaikin_bot/utils/syuttaikinStateManager');
const { updateSettingsMessage } = require('./_updateSettingsMessage');
const logger = require('@common/logger');

module.exports = {
  customId: 'setting_set_cast_roles',
  /**
   * @param {import('discord.js').RoleSelectMenuInteraction} interaction
   */
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const selectedRoles = interaction.values; // Role IDs

    try {
      await updateState(guildId, (currentState) => {
        if (!currentState.syuttaikin) currentState.syuttaikin = {};
        currentState.syuttaikin.castRoles = selectedRoles;
        return currentState;
      });

      // 設定パネルの埋め込みを更新して、ユーザーに即座にフィードバック
      await updateSettingsMessage(interaction);
      logger.info(`[syuttaikin-settings] Guild ${guildId} のキャストロールを更新しました。`);
    } catch (error) {
      logger.error(`[syuttaikin-settings] キャストロールの更新中にエラーが発生しました (Guild: ${guildId})`, { error });
      if (!interaction.replied && !interaction.deferred) await interaction.reply({ content: '設定の更新中にエラーが発生しました。', ephemeral: true });
    }
  },
};