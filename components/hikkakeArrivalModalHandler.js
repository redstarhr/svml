// components/modals/hikkakeArrivalModalHandler.js
const { readState, writeState } = require('../../../utils/hikkakeStateManager');
const { updateAllHikkakePanels } = require('../../../utils/hikkakePanelManager');
const { randomUUID } = require('crypto');

module.exports = {
  customId: /^arrival_modal_(quest|tosu|horse)$/,
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const [, type] = interaction.customId.match(this.customId);
    