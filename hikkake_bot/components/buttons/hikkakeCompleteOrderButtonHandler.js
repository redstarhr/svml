const { readState, writeState } = require('../../../utils/hikkakeStateManager');
const { updateAllHikkakePanels } = require('../../../utils/hikkakePanelManager');
const { DateTime } = require('luxon');

module.exports = {
  customId: /^complete_order_(quest|tosu|horse)_(.+)$/,
  async execute(interaction, client) {
    await interaction.deferUpdate();
    const [, type, orderId] = interaction.customId.match(this.customId);
    const guildId = interaction.guildId;

    const state = await readState(guildId);
    const order = state.orders[type]?.find(o => o.id === orderId);

    if (!order) {
      return;
    }

    order.status = '完了';
    order.leaveTimestamp = DateTime.now().toISO();

    await writeState(guildId, state);
    await updateAllHikkakePanels(client, guildId, state);
  },
};