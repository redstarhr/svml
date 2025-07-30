// syuttaikin_bot/commands/cast-departure-panel.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { readState } = require('../utils/syuttaikinStateManager');
const logger = require('@common/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('キャスト退勤設置')
    .setDescription('キャストの退勤ボタンパネルを設置します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guildId = interaction.guildId;
    try {
      const state = await readState(guildId);
      const departureTimes = state.syuttaikin?.departureTimes || [];

      if (departureTimes.length === 0) {
        await interaction.editReply('退勤時間が設定されていません。`/キャスト出退勤設定`で先に退勤時間を登録してください。');
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('キャスト退勤')
        .setDescription('該当する退勤時間のボタンを押してください。')
        .setColor(0xE74C3C);

      // Create buttons for each departure time, up to 5 per row
      const rows = [];
      const sortedTimes = [...departureTimes].sort(); // Sort times for consistent order

      for (let i = 0; i < sortedTimes.length; i += 5) {
        const row = new ActionRowBuilder();
        const chunk = sortedTimes.slice(i, i + 5);
        for (const time of chunk) {
          row.addComponents(
            new ButtonBuilder().setCustomId(`departure_time_${time}`).setLabel(time).setStyle(ButtonStyle.Danger)
          );
        }
        rows.push(row);
      }

      await interaction.channel.send({ embeds: [embed], components: rows });
      await interaction.editReply('✅ 退勤パネルを設置しました。');
    } catch (error) {
      logger.error('退勤パネルの設置中にエラーが発生しました。', { guildId, error });
      await interaction.editReply('パネルの設置中にエラーが発生しました。');
    }
  },
};