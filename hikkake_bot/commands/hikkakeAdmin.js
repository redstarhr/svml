const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { buildAdminPanel } = require('../handlers/panelActionHandler');
const logger = require('@common/logger');
const { ADMIN_COMMAND, REACTION_SETTING_SUBCOMMAND, REACTION_LIST_SUBCOMMAND, SET_REACT_PREFIX } = require('../constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName(ADMIN_COMMAND)
    .setDescription('引っかけBotの管理用コマンドです。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName(REACTION_SETTING_SUBCOMMAND)
        .setDescription('各種の人数/本数に応じた反応文を設定するパネルを表示します。'),
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName(REACTION_LIST_SUBCOMMAND)
        .setDescription('登録済みの反応文を管理するパネルを表示します。'),
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === REACTION_SETTING_SUBCOMMAND) {
      const embed = new EmbedBuilder()
        .setTitle('🎯 引っかけBot 反応文設定パネル')
        .setDescription('以下のボタンから、各種の人数/本数別反応文を登録できます。\n登録された文章はランダムにログで使われます。')
        .setColor(0x00B0F4);

      const rows = [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`${SET_REACT_PREFIX}quest_num`).setLabel('クエスト人数').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId(`${SET_REACT_PREFIX}quest_count`).setLabel('クエスト本数').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId(`${SET_REACT_PREFIX}tosu_num`).setLabel('凸スナ人数').setStyle(ButtonStyle.Success),
        ),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`${SET_REACT_PREFIX}tosu_count`).setLabel('凸スナ本数').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`${SET_REACT_PREFIX}horse_num`).setLabel('トロイの木馬人数').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`${SET_REACT_PREFIX}horse_count`).setLabel('トロイの木馬本数').setStyle(ButtonStyle.Secondary),
        ),
      ];

      return interaction.reply({
        embeds: [embed],
        components: rows,
        ephemeral: true,
      });
    }

    if (subcommand === REACTION_LIST_SUBCOMMAND) {
      try {
        const panelContent = await buildAdminPanel(interaction.guildId);
        return interaction.reply({ ...panelContent, ephemeral: true });
      } catch (error) {
        logger.error('反応管理パネルの表示中にエラーが発生しました。', { error, guildId: interaction.guildId });
        return interaction.reply({ content: '❌ パネルの表示中にエラーが発生しました。', ephemeral: true });
      }
    }
  },
};