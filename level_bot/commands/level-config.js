const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getConfig, saveConfig } = require('../utils/levelConfigManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level-config')
    .setDescription('レベルアップ機能の設定を行います。')
    .setNameLocalization('ja', 'レベルアップ設定')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('show')
        .setDescription('現在の設定を表示します。')
        .setNameLocalization('ja', '表示')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('set-message-xp')
        .setDescription('1メッセージあたりの獲得XP範囲を設定します。')
        .setNameLocalization('ja', 'メッセージxp設定')
        .addIntegerOption(option => option.setName('min').setDescription('最小獲得XP').setRequired(true))
        .addIntegerOption(option => option.setName('max').setDescription('最大獲得XP').setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('add-role-reward')
        .setDescription('特定のレベルに到達した際のロール報酬を追加・更新します。')
        .setNameLocalization('ja', 'ロール報酬追加')
        .addIntegerOption(option => option.setName('level').setDescription('対象レベル').setRequired(true))
        .addRoleOption(option => option.setName('role').setDescription('付与するロール').setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove-role-reward')
        .setDescription('ロール報酬を削除します。')
        .setNameLocalization('ja', 'ロール報酬削除')
        .addIntegerOption(option => option.setName('level').setDescription('削除する報酬のレベル').setRequired(true))
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const config = await getConfig(interaction.guild.id);

    if (subcommand === 'show') {
      const embed = new EmbedBuilder()
        .setTitle('レベルアップ機能 設定')
        .setColor(0x5865f2)
        .addFields(
          {
            name: 'メッセージごとの獲得XP',
            value: `最小: ${config.xpPerMessage.min}, 最大: ${config.xpPerMessage.max}`,
          },
          {
            name: 'ロール報酬',
            value: Object.keys(config.roleRewards).length > 0
              ? Object.entries(config.roleRewards)
                  .map(([level, roleId]) => `LV ${level}: <@&${roleId}>`)
                  .join('\n')
              : '未設定',
          }
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === 'set-message-xp') {
      const min = interaction.options.getInteger('min');
      const max = interaction.options.getInteger('max');
      if (min > max) {
        return interaction.reply({ content: '最小XPは最大XPより大きい値にできません。', ephemeral: true });
      }
      config.xpPerMessage = { min, max };
      await saveConfig(interaction.guild.id, config);
      return interaction.reply({ content: `✅ メッセージごとの獲得XPを ${min}～${max} に設定しました。`, ephemeral: true });
    }

    if (subcommand === 'add-role-reward') {
      const level = interaction.options.getInteger('level');
      const role = interaction.options.getRole('role');
      config.roleRewards[level.toString()] = role.id;
      await saveConfig(interaction.guild.id, config);
      return interaction.reply({
        content: `✅ LV ${level} のロール報酬を <@&${role.id}> に設定しました。`,
        ephemeral: true,
      });
    }

    if (subcommand === 'remove-role-reward') {
      const level = interaction.options.getInteger('level');
      if (!config.roleRewards[level.toString()]) {
        return interaction.reply({ content: `LV ${level} にはロール報酬が設定されていません。`, ephemeral: true });
      }
      delete config.roleRewards[level.toString()];
      await saveConfig(interaction.guild.id, config);
      return interaction.reply({ content: `✅ LV ${level} のロール報酬を削除しました。`, ephemeral: true });
    }
  },
};