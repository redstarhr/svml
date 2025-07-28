// commands/hikkakeSetting.js

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ひっかけ設定')
    .setDescription('各人数・本数に応じた反応文を設定します')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🎯 引っかけBot 反応文設定パネル')
      .setDescription('以下のボタンから、各種の人数/本数別反応文を登録できます。\n登録された文章はランダムにログで使われます。')
      .setColor(0x00B0F4);

    const rows = [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('set_react_quest_num').setLabel('クエスト人数').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('set_react_quest_count').setLabel('クエスト本数').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('set_react_tosu_num').setLabel('凸スナ人数').setStyle(ButtonStyle.Success),
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('set_react_tosu_count').setLabel('凸スナ本数').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('set_react_horse_num').setLabel('トロイの木馬人数').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('set_react_horse_count').setLabel('トロイの木馬本数').setStyle(ButtonStyle.Secondary),
      ),
    ];

    await interaction.reply({
      embeds: [embed],
      components: rows,
      flags: 64, // 64 is MessageFlags.Ephemeral
    });
  },
};
