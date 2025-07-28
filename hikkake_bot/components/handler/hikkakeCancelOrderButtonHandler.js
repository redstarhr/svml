const { readState, writeState } = require('../../../utils/hikkakeStateManager');
const { updateAllHikkakePanels } = require('../../../utils/hikkakePanelManager');

module.exports = {
  customId: /^cancel_order_(quest|tosu|horse)_(.+)$/,
  async execute(interaction, client) {
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