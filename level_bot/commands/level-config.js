const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
  MessageFlags,
} = require('discord.js');
const { readConfig } = require('../utils/levelStateManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level-config')
    .setDescription('レベルアップ機能の設定を行います。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const guildId = interaction.guild.id;
    const config = await readConfig(guildId);

    const embed = new EmbedBuilder()
      .setTitle('📈 レベルアップ設定パネル')
      .setColor(0x00bfff)
      .addFields(
        { name: 'XP / 1メッセージ', value: `${config.xpPerMessage}`, inline: true },
        { name: 'クールダウン（秒）', value: `${config.cooldownSec}`, inline: true },
        { name: '通知チャンネル', value: config.notifyChannelId ? `<#${config.notifyChannelId}>` : '未設定', inline: true },
        { name: 'レベルアップ無効ロール', value: config.disabledRoles.length ? config.disabledRoles.map(id => `<@&${id}>`).join(', ') : '未設定' },
        { name: '登録済スタンプ', value: config.levelStamps.length ? config.levelStamps.join('\n') : '未登録' }
      );

    const roleSelect = new RoleSelectMenuBuilder()
      .setCustomId('selectDisabledRoles')
      .setPlaceholder('レベルアップ無効ロールを選択')
      .setMinValues(0)
      .setMaxValues(5);

    const channelSelect = new ChannelSelectMenuBuilder()
      .setCustomId('setNotifyChannelSelect')
      .setPlaceholder('通知を送信するチャンネルを選択')
      .addChannelTypes(ChannelType.GuildText)
      .setMinValues(0)
      .setMaxValues(1);

    const stampAddBtn = new ButtonBuilder().setCustomId('addLevelStamp').setLabel('スタンプ追加').setStyle(ButtonStyle.Success);
    const stampRemoveBtn = new ButtonBuilder().setCustomId('removeLevelStamp').setLabel('スタンプ削除').setStyle(ButtonStyle.Danger);
    const settingsBtn = new ButtonBuilder().setCustomId('editBasicSettings').setLabel('基本設定 (XP/クールダウン)').setStyle(ButtonStyle.Secondary);

    await interaction.editReply({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(roleSelect),
        new ActionRowBuilder().addComponents(channelSelect),
        new ActionRowBuilder().addComponents(stampAddBtn, stampRemoveBtn, settingsBtn),
      ],
    });
  },
};