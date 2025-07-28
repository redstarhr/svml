// components/modals/hikkakeOrderModalHandler.js
const { readState, writeState } = require('../../utils/hikkakeStateManager');
const { updateAllHikkakePanels } = require('../../utils/hikkakePanelManager');
const { randomUUID } = require('crypto');

module.exports = {
  customId: /^hikkake_order_modal_(quest|tosu|horse)$/,
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const [, type] = interaction.customId.match(this.customId);
    const guildId = interaction.guildId;

    const people = parseInt(interaction.fields.getTextInputValue('order_people'), 10);
    const bottles = parseInt(interaction.fields.getTextInputValue('order_bottles'), 10);
    const castPura = parseInt(interaction.fields.getTextInputValue('order_cast_pura'), 10);
    const castKama = parseInt(interaction.fields.getTextInputValue('order_cast_kama'), 10);

    if ([people, bottles, castPura, castKama].some(isNaN)) {
        return interaction.editReply({ content: '入力はすべて半角数字である必要があります。' });
    }

    const state = await readState(guildId);

    state.orders[type] = state.orders[type] || [];
    state.orders[type].push({
      id: randomUUID(),
      type: 'order',
      status: 'pending',
      user: { id: interaction.user.id, name: interaction.user.username },
      people,
      bottles,
      castPura,
      castKama,
      timestamp: new Date().toISOString(),
    });

    await writeState(guildId, state);
    await updateAllHikkakePanels(client, guildId, state);

    await interaction.editReply({ content: 'ひっかけ予定を記録しました。' });
  },
};