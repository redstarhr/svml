// keihi_config.js

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  RoleSelectMenuBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require('discord.js');

const { setApproverRoles, setVisibleRoles } = require('../utils/fileStorage.js');

const MESSAGES = require('../../keihi_bot/constants/messages.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('keihi_config')
    .setDescription('承認・表示ロールを設定します')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),  // 管理者権限を必要とする

  async execute(interaction) {
    try {
      const approverMenu = new RoleSelectMenuBuilder()
        .setCustomId('select_approver_roles')  // 承認ロール選択メニューのカスタムID
        .setPlaceholder('✅ 承認ロールを選択（必須）')
        .setMinValues(1)
        .setMaxValues(5);

      const visibleMenu = new RoleSelectMenuBuilder()
        .setCustomId('select_visible_roles')  // 表示ロール選択メニューのカスタムID
        .setPlaceholder('👁 表示ロールを選択（任意）')
        .setMinValues(0)
        .setMaxValues(5);

      const actionButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('config_save')
          .setLabel('設定を保存')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('config_cancel')
          .setLabel('キャンセル')
          .setStyle(ButtonStyle.Secondary)
      );

      const row1 = new ActionRowBuilder().addComponents(approverMenu);
      const row2 = new ActionRowBuilder().addComponents(visibleMenu);

      const response = await interaction.reply({
        content: MESSAGES.ROLE.PROMPT,  // メッセージのプロンプト
        components: [row1, row2, actionButtons],
        ephemeral: true
      });

      const collector = response.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id,  // インタラクションしたユーザーに限定
        time: 120_000, // 2分間
      });

      const selected = {
        approverRoles: null,
        visibleRoles: [], // デフォルトは空配列
      };

      collector.on('collect', async i => {
        // ボタン/メニュー操作への応答を予約
        await i.deferUpdate();

        if (i.customId === 'select_approver_roles') {
          selected.approverRoles = i.values;
        }

        if (i.customId === 'select_visible_roles') {
          selected.visibleRoles = i.values;
        }

        if (i.customId === 'config_save') {
          if (!selected.approverRoles || selected.approverRoles.length === 0) {
            await i.followUp({ content: '⚠️ 承認ロールは最低1つ選択してください。', ephemeral: true });
            return;
          }

          await setApproverRoles(interaction.guildId, selected.approverRoles);
          await setVisibleRoles(interaction.guildId, selected.visibleRoles);

          const roleMentions = selected.approverRoles.map(id => `<@&${id}>`).join(', ');
          const visibleMentions = selected.visibleRoles.length > 0
            ? selected.visibleRoles.map(id => `<@&${id}>`).join(', ')
            : '（なし）';

          await i.editReply({
            content: `${MESSAGES.ROLE.SET(roleMentions)}\n👁 表示ロール: ${visibleMentions}`,
            components: []  // コンポーネント削除
          });
          collector.stop('saved');
        }

        if (i.customId === 'config_cancel') {
          await i.editReply({ content: 'ロール設定をキャンセルしました。', components: [] });
          collector.stop('cancelled');
        }
      });

      collector.on('end', async (collected, reason) => {
        if (reason !== 'saved' && reason !== 'cancelled') {
          await interaction.editReply({
            content: MESSAGES.ROLE.TIMEOUT,
            components: []
          }).catch(() => {}); // タイムアウト後にメッセージが消されていてもエラーを出さない
        }
      });

    } catch (err) {
      console.error('❌ ロール設定エラー:', err);
      await interaction.reply({
        content: MESSAGES.GENERAL.ERROR,
        ephemeral: true
      });
    }
  }
};
