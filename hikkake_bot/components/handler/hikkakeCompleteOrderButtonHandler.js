const { readState, writeState } = require('../../utils/hikkakeStateManager');
const { updateAllHikkakePanels } = require('../../utils/hikkakePanelManager');
const { logToThread } = require('../../utils/threadLogger');
const logger = require('@common/logger');
const { EmbedBuilder } = require('discord.js');
const { DateTime } = require('luxon');

module.exports = {
  customId: /^complete_order_(quest|tosu|horse)_(.+)$/,
  async execute(interaction, client) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const match = interaction.customId.match(this.customId);
      if (!match) return;
      const [, type, orderId] = match;
      const guildId = interaction.guildId;

      const state = await readState(guildId);
      const order = state.orders?.[type]?.find(o => o.id === orderId);

      if (!order) {
        return interaction.editReply({ content: '❌ 指定された注文が見つかりませんでした。' });
      }

      if (order.status === '完了') {
        return interaction.editReply({ content: 'ℹ️ この注文は既に完了しています。' });
      }

      order.status = '完了';
      order.completedTimestamp = new Date().toISOString();
      order.completedBy = { id: interaction.user.id, name: interaction.user.displayName };

      await writeState(guildId, state);
      await updateAllHikkakePanels(client, guildId, state);

      // Logging
      const startTime = DateTime.fromISO(order.timestamp);
      const endTime = DateTime.fromISO(order.completedTimestamp);
      const duration = endTime.diff(startTime, ['minutes', 'seconds']);
      const durationString = `${Math.floor(duration.minutes)}分${Math.round(duration.seconds)}秒`;

      const logEmbed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('注文完了')
        .setDescription(`${interaction.user.displayName} が ${type.toUpperCase()} の注文を完了しました。`)
        .addFields(
          { name: '注文者', value: order.user.name, inline: true },
          { name: '所要時間', value: durationString, inline: true },
          { name: '注文ID', value: `\`${order.id}\`` }
        )
        .setTimestamp()
        .setFooter({ text: `操作者: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

      logger.info(`[HikkakeCompleteOrder] ${interaction.user.tag} completed order ${order.id} for ${type