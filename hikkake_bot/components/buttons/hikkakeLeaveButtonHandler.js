const { readState, writeState } = require('../../../utils/hikkakeStateManager');
const { updateAllHikkakePanels } = require('../../../utils/hikkakePanelManager');

module.exports = {
  customId: /^enter_(quest|tosu|horse)$/,
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const type = interaction.customId.split('_')[1];
    const guildId = interaction.guildId;
    const user = interaction.user;

    const state = await readState(guildId);

    if (state.members[type]?.some(member => member.id === user.id)) {
      return interaction.editReply('すでに入店済みです。');
    }

    state.members[type] = state.members[type] || [];
    state.members[type].push({
      id: user.id,
      name: user.displayName,
      enterTimestamp: new Date().toISOString(),
    });

    await writeState(guildId, state);
    await updateAllHikkakePanels(client, guildId, state);
    await interaction.editReply('入店しました。');
  },
};