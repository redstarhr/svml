// components/selects/hikkakeConfirmSelectHandler.js
const { readState, writeState } = require('../../utils/hikkakeStateManager');
const { updateAllHikkakePanels } = require('../../utils/hikkakePanelManager');

module.exports = {
  customId: 'hikkake_confirm_select',
  async execute(interaction, client) {
    await interaction.deferUpdate();

    const [action, type, orderId] = interaction.values[0].split('_');
    const guildId = interaction.guildId;

    const state = await readState(guildId);
    const order = state.orders[type]?.find(o => o.id === orderId);

    if (!order) return;

    if (action === 'confirm') {
        order.status = 'confirmed';
    } else if (action === 'fail') {
        order.status = 'failed';
    }
    order.leaveTimestamp = new Date().toISOString(); // Mark time of resolution

    await writeState(guildId, state);
    await updateAllHikkakePanels(client, guildId, state);
  },
};