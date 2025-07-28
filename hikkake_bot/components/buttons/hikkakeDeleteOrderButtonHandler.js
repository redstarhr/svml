const { readState, writeState } = require('../../../utils/hikkakeStateManager');
const { updateAllHikkakePanels } = require('../../../utils/hikkakePanelManager');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  customId: /^delete_order_(quest|tosu|horse)_(.+)$/,
  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'この操作を実行する権限がありません。', ephemeral: true });
    }
    await interaction.deferUpdate();
    const [, type, orderId] = interaction.customId.match(this.customId);
    const guildId = interaction.guildId;

    const state = await readState(guildId);
    const orderIndex = state.orders[type]?.findIndex(o => o.id === orderId);

    if (orderIndex === -1 || !state.orders[type]) {
      return;
    }

    state.orders[type].splice(orderIndex, 1);

    await writeState(guildId, state);
    await updateAllHikkakePanels(client, guildId, state);
  },
};