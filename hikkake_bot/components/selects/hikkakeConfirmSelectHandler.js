// components/selects/hikkakeConfirmSelectHandler.js
const { readState, writeState } = require('../../utils/hikkakeStateManager');
const { updateAllHikkakePanels } = require('../../utils/hikkakePanelManager');
const { logToThread } = require('../../utils/threadLogger');
const logger = require('@common/logger');
const { EmbedBuilder } = require('discord.js');
const { DateTime } = require('luxon');

module.exports = {
  customId: 'hikkake_confirm_select',
  async execute(interaction, client) {
    try {
      await interaction.deferReply({ ephemeral: true });

      if (!interaction.values || interaction.values.length === 0) {
        return interaction.editReply({ content: '❌ 選択項目がありません。' });
      }

      const [action, type, orderId] = interaction.values[0].split('_');
      const guildId = interaction.guildId;

      if (!action || !type || !orderId) {
        logger.warn(`[HikkakeResolveSelect] 無効な選択値です: ${interaction.values[0]}`);
        return interaction.editReply({ content: '❌ 無効な選択です。' });
      }

      const state = await readState(guildId);
      const order = state.orders?.[type]?.find(o => o.id === orderId);

      if (!order) {
        return interaction.editReply({ content: '❌ 指定された注文が見つかりませんでした。他の方が処理した可能性があります。' });
      }

      if (order.status !== '受付') {
        return interaction.editReply({ content: `ℹ️ この注文は既に「${order.status}」です。` });
      }

      const isConfirm = action === 'confirm';
      order.status = isConfirm ? '完了' : '失敗';
      order.completedTimestamp = new Date().toISOString();
      order.completedBy = { id: interaction.user.id, name: interaction.user.displayName };

      await writeState(guildId, state);
      updateAllHikkakePanels(client, guildId, state).catch(err => {
        logger.error('パネルの更新に失敗しました', { error: err, guildId });
      });

      const startTime = DateTime.fromISO(order.timestamp);
      const endTime = DateTime.fromISO(order.completedTimestamp);
      const duration = endTime.diff(startTime, ['minutes', 'seconds']);
      const durationString = `${Math.floor(duration.minutes)}分${Math.round(duration.seconds)}秒`;

      const logEmbed = new EmbedBuilder()
        .setColor(isConfirm ? 'Green' : 'Red')
        .setTitle(isConfirm ? 'ひっかけ成功' : 'ひっかけ失敗')
        .setDescription(`${interaction.user.displayName} が ${type.toUpperCase()} のひっかけを処理しました。`)
        .addFields(
          { name: '注文者', value: order.user.name, inline: true },
          { name: '所要時間', value: durationString, inline: true },
          { name: '注文ID', value: `\`${order.id}\`` },
        )
        .setTimestamp()
        .setFooter({ text: `操作者: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

      await logToThread(client, guildId, { embeds: [logEmbed] });
      logger.info(`[HikkakeResolveSelect] ${interaction.user.tag}が注文${order.id}を「${order.status}」として処理しました。`);

      await interaction.message.edit({ content: `**${interaction.user.displayName}** が対応しました。`, components: [] });
      await interaction.editReply({ content: `✅ 注文を「${order.status}」として処理しました。` });
    } catch (error) {
      logger.error('ひっかけ確定/失敗処理中にエラーが発生しました。', { error, customId: interaction.customId, guildId: interaction.guildId });
      if (interaction.deferred && !interaction.replied) {
        await interaction.editReply({ content: '❌ 処理中にエラーが発生しました。' }).catch(() => {});
      }
    }
  },
};