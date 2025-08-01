// keihi_bot/commands/keihi_config.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  ActionRowBuilder,
  ChannelType,
  EmbedBuilder,
} = require('discord.js');

const { updateState, readState } = require('../utils/keihiStateManager.js');
const logger = require('@common/logger');
const MESSAGES = require('@root/keihi_bot/constants/messages.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('keihi_config')
    .setDescription('経費Botの各種設定を行います。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('role')
        .setDescription('承認ロールと閲覧ロールを設定します。')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('channel')
        .setDescription('申請通知を送信するチャンネルを設定します。')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('show')
        .setDescription('現在の設定内容を表示します。')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      await interaction.deferReply({ ephemeral: true });

      if (subcommand === 'role') {
        await handleRoleConfig(interaction);
      } else if (subcommand === 'channel') {
        await handleChannelConfig(interaction);
      } else if (subcommand === 'show') {
        await handleShowConfig(interaction);
      }
    } catch (error) {
      logger.error('❌ keihi_config コマンドの実行中にエラーが発生しました。', { error, guildId: interaction.guildId, subcommand });
      await interaction.editReply({ content: MESSAGES.GENERAL.ERROR });
    }
  }
};

async function handleRoleConfig(interaction) {
  const currentState = await readState(interaction.guildId);
  const approverMenu = new RoleSelectMenuBuilder()
    .setCustomId('keihi_config_approver_roles')
    .setPlaceholder('✅ 承認ロールを選択（複数可）')
    .setMinValues(0)
    .setMaxValues(10)
    .setDefaultRoles(currentState.approverRoles);

  const visibleMenu = new RoleSelectMenuBuilder()
    .setCustomId('keihi_config_visible_roles')
    .setPlaceholder('👁 履歴閲覧ロールを選択（複数可）')
    .setMinValues(0)
    .setMaxValues(10)
    .setDefaultRoles(currentState.visibleRoles);

  await interaction.editReply({
    content: '経費申請を承認できるロールと、履歴を閲覧できるロールを設定してください。',
    components: [new ActionRowBuilder().addComponents(approverMenu), new ActionRowBuilder().addComponents(visibleMenu)],
  });
}

async function handleChannelConfig(interaction) {
  const currentState = await readState(interaction.guildId);
  const logChannelMenu = new ChannelSelectMenuBuilder()
    .setCustomId('keihi_config_log_channel')
    .setPlaceholder('📜 申請通知チャンネルを選択')
    .addChannelTypes(ChannelType.GuildText)
    .setMinValues(0)
    .setMaxValues(1)
    .setDefaultChannels(currentState.logChannelId ? [currentState.logChannelId] : []);

  await interaction.editReply({
    content: '経費申請が提出された際に通知を送信するチャンネルを設定してください。',
    components: [new ActionRowBuilder().addComponents(logChannelMenu)],
  });
}

async function handleShowConfig(interaction) {
  const state = await readState(interaction.guildId);
  const approverRoles = state.approverRoles.map(id => `<@&${id}>`).join(', ') || '未設定';
  const visibleRoles = state.visibleRoles.map(id => `<@&${id}>`).join(', ') || '未設定';
  const logChannel = state.logChannelId ? `<#${state.logChannelId}>` : '未設定';

  const embed = new EmbedBuilder()
    .setTitle('⚙️ 経費Bot 現在の設定')
    .addFields(
      { name: '承認ロール', value: approverRoles },
      { name: '閲覧ロール', value: visibleRoles },
      { name: '申請通知チャンネル', value: logChannel }
    )
    .setColor(0x3498DB);

  await interaction.editReply({ embeds: [embed] });
}
