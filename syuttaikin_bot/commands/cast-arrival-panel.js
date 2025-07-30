const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { readState } = require('../utils/syuttaikinStateManager');
const logger = require('@common/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cast-arrival-panel')
    .setDescription('出勤パネルを投稿します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guildId = interaction.guild.id;
    const state = await readState(guildId);
    const arrivalTimes = state.syuttaikin?.arrivalTimes || [];

    if (arrivalTimes.length === 0) {
      await interaction.editReply({ content: '⚠️ 出勤時間が設定されていません。`/cast-settings` で時間を登録してください。' });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('✅ 出勤パネル')
      .setDescription('該当する出勤時間のボタンを押してください。')
      .setColor(0x57F287);

    // ボタンを作成 (5個ずつActionRowにまとめる)
    const components = [];
    for (let i = 0; i < arrivalTimes.length; i += 5) {
      const row = new ActionRowBuilder();
      const timeSlice = arrivalTimes.slice(i, i + 5);
      timeSlice.forEach(time => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`arrival_time_${time}`)
            .setLabel(time)
            .setStyle(ButtonStyle.Success)
        );
      });
      components.push(row);
    }

    await interaction.channel.send({
      embeds: [embed],
      components: components,
    });
    await interaction.editReply({ content: '✅ 出勤パネルを投稿しました。' });
    logger.info(`[syuttaikin] Guild ${guildId} に出勤パネルを投稿しました。`);
  },
};