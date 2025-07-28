// keihi_config.js

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  RoleSelectMenuBuilder,
  ActionRowBuilder,
  ComponentType
} = require('discord.js');

const { setApproverRoles, setVisibleRoles } = require('../../keihi_bot/utils/fileStorage.js');

const MESSAGES = require('../../keihi_bot/constants/messages.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('経費申請設定')
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

      const row1 = new ActionRowBuilder().addComponents(approverMenu);
      const row2 = new ActionRowBuilder().addComponents(visibleMenu);

      await interaction.reply({
        content: MESSAGES.ROLE.PROMPT,  // メッセージのプロンプト
        components: [row1, row2],  // ボタンなどのコンポーネントを表示
        flags: 64
      });

      // ここでの interaction は、ボタンや選択メニューの処理
      const collector = interaction.channel.createMessageComponentCollector({
        componentType: ComponentType.RoleSelect,  // RoleSelect コンポーネントを利用
        time: 60_000,  // 1分間
        filter: i => i.user.id === interaction.user.id  // インタラクションしたユーザーに限定
      });

      const selected = {};  // 選択されたロールを保持

      collector.on('collect', async i => {
        if (i.customId === 'select_approver_roles') {
          selected.approverRoles = i.values;
          await i.reply({ content: '✅ 承認ロールを受け取りました。', flags: 64 });
        }

        if (i.customId === 'select_visible_roles') {
          selected.visibleRoles = i.values;
          await i.reply({ content: '👁 表示ロールを受け取りました。', flags: 64 });
        }

        // 両方揃ったらデータを保存して完了
        if (selected.approverRoles && selected.visibleRoles !== undefined) {
          setApproverRoles(interaction.guildId, selected.approverRoles);
          setVisibleRoles(interaction.guildId, selected.visibleRoles);

          const roleMentions = selected.approverRoles.map(id => `<@&${id}>`).join(', ');
          const visibleMentions = selected.visibleRoles.length > 0
            ? selected.visibleRoles.map(id => `<@&${id}>`).join(', ')
            : '（なし）';

          await interaction.editReply({
            content: `${MESSAGES.ROLE.SET(roleMentions)}\n👁 表示ロール: ${visibleMentions}`,
            components: []  // コンポーネント削除
          });

          collector.stop();
        }
      });

      collector.once('end', collected => {
        if (!selected.approverRoles) {
          interaction.editReply({
            content: MESSAGES.ROLE.TIMEOUT,
            components: []
          }).catch(console.error);
        }
      });

    } catch (err) {
      console.error('❌ ロール設定エラー:', err);
      await interaction.reply({
        content: MESSAGES.GENERAL.ERROR,
        flags: 64
      });
    }
  }
};
