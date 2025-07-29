// syuttaiki_bot/commands/cast-settings.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, MessageFlags } = require('discord.js');
const { readState } = require('../utils/syuttaikiStateManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cast-settings')
    .setDescription('出退勤Botの各種設定を行います。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guildId = interaction.guild.id;
    const state = await readState(guildId);
    const config = state.syuttaikin;

    const embed = new EmbedBuilder()
      .setTitle('⚙️ 出退勤Bot 設定パネル')
      .setDescription('各種設定をここで行います。')
      .setColor(0xFEE75C)
      .addFields(
        { name: 'キャストロール', value: config.castRoles?.length > 0 ? config.castRoles.map(id => `<@&${id}>`).join(', ') : '未設定' },
        { name: 'パネル投稿チャンネル', value: config.panelChannelId ? `<#${config.panelChannelId}>` : '未設定' },
        { name: 'ログ通知チャンネル', value: config.logChannelId ? `<#${config.logChannelId}>` : '未設定' }
      );

    const roleSelect = new RoleSelectMenuBuilder()
      .setCustomId('setting_set_cast_roles')
      .setPlaceholder('出退勤ボタンを押せるキャストロールを選択')
      .setMinValues(0)
      .setMaxValues(10);

    const panelChannelSelect = new ChannelSelectMenuBuilder()
      .setCustomId('setting_set_panel_channel')
      .setPlaceholder('出退勤パネルを投稿するチャンネルを選択')
      .addChannelTypes(ChannelType.GuildText)
      .setMinValues(1)
      .setMaxValues(1);

    const logChannelSelect = new ChannelSelectMenuBuilder()
      .setCustomId('setting_set_log_channel')
      .setPlaceholder('出退勤ログを通知するチャンネルを選択')
      .addChannelTypes(ChannelType.GuildText)
      .setMinValues(1)
      .setMaxValues(1);

    await interaction.editReply({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(roleSelect),
        new ActionRowRowBuilder().addComponents(panelChannelSelect),
        new ActionRowBuilder().addComponents(logChannelSelect),
      ],
    });
  },
};