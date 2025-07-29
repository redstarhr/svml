// commands/levelSetup.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  RoleSelectMenuBuilder,
  MessageFlags,
} = require('discord.js');
const { readJsonFromGCS, saveJsonToGCS } = require('@common/gcs/gcsUtils');

const CONFIG_PATH = (guildId) => `level_bot/${guildId}/config.json`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('レベル設定')
    .setDescription('レベルアップ機能の設定パネルを表示します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const guildId = interaction.guild.id;
    const configPath = CONFIG_PATH(guildId);
    let config = await readJsonFromGCS(configPath);

    // If no config exists, create and save a default one.
    if (!config) {
      config = {
        enabled: true,
        xpPerMessage: 5,
        cooldownSec: 30,
        notifyChannelId: null,
        disabledRoles: [], // Corresponds to 'ignoreRoles'
        levelStamps: [],   // Corresponds to 'stamps'
      };
      await saveJsonToGCS(configPath, config);
    }

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

    const stampAddBtn = new ButtonBuilder()
      .setCustomId('addLevelStamp')
      .setLabel('スタンプ追加')
      .setStyle(ButtonStyle.Success);

    const stampRemoveBtn = new ButtonBuilder()
      .setCustomId('removeLevelStamp')
      .setLabel('スタンプ削除')
      .setStyle(ButtonStyle.Danger);

    await interaction.editReply({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(roleSelect),
        new ActionRowBuilder().addComponents(stampAddBtn, stampRemoveBtn),
      ],
    });
  },
};
