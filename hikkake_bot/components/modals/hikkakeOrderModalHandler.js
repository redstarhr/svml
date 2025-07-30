// components/modals/hikkakeOrderModalHandler.js
const { readState, writeState } = require('../../utils/hikkakeStateManager');
const { updateAllHikkakePanels } = require('../../utils/hikkakePanelManager');
const { randomUUID } = require('crypto');
const logger = require('@common/logger');

module.exports = {
  customId: /^order_modal_(quest|tosu|horse)$/,
  async execute(interaction, client) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const match = interaction.customId.match(this.customId);
      if (!match) return;
      const [, type] = match;
      const guildId = interaction.guildId;

      const people = parseInt(interaction.fields.getTextInputValue('people'), 10);
      const bottles = parseInt(interaction.fields.getTextInputValue('bottles'), 10);
      const castPura = parseInt(interaction.fields.getTextInputValue('castPura'), 10);
      const castKama = parseInt(interaction.fields.getTextInputValue('castKama'), 10);

      if ([people, bottles, castPura, castKama].some(isNaN)) {
          return interaction.editReply({ content: '❌ 入力はすべて半角数字である必要があります。' });
      }

      const state = await readState(guildId);

      state.orders = state.orders || {};
      state.orders[type] = state.orders[type] || [];

      const newOrder = {
        id: randomUUID(),
        status: '受付',
        user: { id: interaction.user.id, name: interaction.user.displayName },
        people,
        bottles,
        castPura,
        castKama,
        timestamp: new Date().toISOString(),
      };

      state.orders[type].push(newOrder);

      await writeState(guildId, state);
      await updateAllHikkakePanels(client, guildId, state);

      logger.info(`[HikkakeOrderModal] ${type.toUpperCase()} のひっかけ予定を記録 (User: ${interaction.user.tag}, Guild: ${interaction.guild.name})`);
      await interaction.editReply({ content: '✅ ひっかけ予定を記録しました。' });
    } catch (error) {
      logger.error('ひっかけ予定の記録中にエラーが発生しました。', { error, customId: interaction.customId, guildId: interaction.guildId });
      if (interaction.deferred && !interaction.replied) {
        await interaction.editReply({ content: '❌ 処理中にエラーが発生しました。' }).catch(() => {});
      }
    }
  },
};
