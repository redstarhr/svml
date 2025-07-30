// syuttaiki_bot/components/settings/setCastRoles.js
const { readState, writeState } = require('../../utils/syuttaikiStateManager');
const { MessageFlags } = require('discord.js');

module.exports = {
  customId: 'setting_set_cast_roles',
  /**
   * @param {import('discord.js').RoleSelectMenuInteraction} interaction
   */
  async handle(interaction) {
    const guildId = interaction.guild.id;
    const selectedRoleIds = interaction.values;

    const state = await readState(guildId);
    state.syuttaikin.castRoles = selectedRoleIds;
    await writeState(guildId, state);

    await interaction.reply({
      content: `✅ キャストロールを更新しました。選択されたロールを持つメンバーのみが出退勤ボタンを使用できます。`,
      flags: [MessageFlags.Ephemeral],
    });
  },
};