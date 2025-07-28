const { readState, writeState } = require('../../../utils/hikkakeStateManager');
const { updateAllHikkakePanels } = require('../../../utils/hikkakePanelManager');

module.exports = {
  customId: /^leave_(quest|tosu|horse)$/,
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const type = interaction.customId.split('_')[1];
    const guildId = interaction.guildId;
    const user = interaction.user;

    const state = await readState(guildId);

    const initialLength = state.members[type]?.length || 0;
    state.members[type] = state.members[type]?.filter(member => member.id !== user.id) || [];

    if (state.members[type].length === initialLength) {
      return interaction.editReply('あなたは入店していません。');
    }

    await writeState(guildId, state);
    await updateAllHikkakePanels(client, guildId, state);
    await interaction.editReply('退店しました。');
  },
};