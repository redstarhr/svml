const { readState, writeState } = require('../../utils/hikkakeStateManager');
const { updateAllHikkakePanels } = require('../../utils/hikkakePanelManager');
const { logToThread } = require('../../utils/threadLogger');
const logger = require('@common/logger');
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  customId: /^delete_order_(quest|tosu|horse)_(.+)$/,
  async execute(interaction, client) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ この操作を実行する権限がありません。', ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      const match = interaction.customId.match(this.customId);
      if (!match) return;
      const [, type, orderId] = match;
      const guildId = interaction.guildId;

      const state = await readState(guildId);
      const orderIndex = state.orders?.[type]?.findIndex(o => o.id === orderId);

      if (orderIndex === undefined || orderIndex === -1) {
        return interaction.editReply({ content: '❌ 指定された注文が見つかりませんでした。' });
      }

      const [deletedOrder] = state.orders[type].splice(orderIndex, 1);

      await writeState(guildId, state);
      await updateAllHikkakePanels(client, guildId, state);

      const logEmbed = new EmbedBuilder()
        .setColor('DarkRed')
        .setTitle('注文削除 (管理者)')
        .setDescription(`${interaction.user.displayName} が ${type.toUpperCase()} の注文を削除しました。`)
        .addFields({ name: '注文者', value: deletedOrder.user.name, inline: true }, { name: '注文ID', value: `\`${deletedOrder.id}\`` })
        .setTimestamp()
        .setFooter({ text: `操作者: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

      logger.info(`[HikkakeDeleteOrder] (Admin) ${interaction.user.tag} deleted order ${deletedOrder.id} for ${type.toUpperCase()} (Guild: ${interaction.guild.name})`);
      await logToThread(client, guildId, { embeds: [logEmbed] });

      await interaction.editReply({ content: '✅ 注文を削除しました。' });
    } catch (error) {
      logger.error('注文の削除処理中にエラーが発生しました。', { error, customId: interaction.customId, guildId: interaction.guildId });
      if (interaction.deferred && !interaction.replied) {
        await interaction.editReply({ content: '❌ 処理中にエラーが発生しました。' }).catch(() => {});
      }
    }
  },
};