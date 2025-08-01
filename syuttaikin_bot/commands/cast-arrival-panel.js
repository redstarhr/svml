const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { readState } = require('../utils/syuttaikinStateManager');
const logger = require('@common/logger');

module.exports = {
  filePath: __filename,

  data: new SlashCommandBuilder()
    .setName('cast-arrival-panel')
    .setDescription('出勤パネルを投稿します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      if (!interaction.isCommand() || interaction.commandName !== 'cast-arrival-panel') {
        return false;
      }

      await interaction.deferReply({ ephemeral: true });

      const guildId = interaction.guildId;
      const state = await readState(guildId);
      const arrivalTimes = state.syuttaikin?.arrivalTimes || [];

      if (!arrivalTimes.length) {
        await interaction.editReply({
          content: '⚠️ 出勤時間が設定されていません。`/cast-settings` で時間を登録してください。',
        });
        return true;
      }

      const embed = new EmbedBuilder()
        .setTitle('✅ 出勤パネル')
        .setDescription('該当する出勤時間のボタンを押してください。')
        .setColor(0x57F287);

      const components = [];
      for (let i = 0; i < arrivalTimes.length; i += 5) {
        const row = new ActionRowBuilder();
        const slice = arrivalTimes.slice(i, i + 5);
        slice.forEach(time => {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`arrival_time_${time}`)
              .setLabel(time)
              .setStyle(ButtonStyle.Success)
          );
        });
        components.push(row);
      }

      if (!interaction.channel) {
        await interaction.editReply({ content: '⚠️ チャンネルが見つかりません。' });
        return true;
      }

      await interaction.channel.send({ embeds: [embed], components });
      await interaction.editReply({ content: '✅ 出勤パネルを投稿しました。' });

      logger.info(`[castShiftHandler] Guild:${guildId} に出勤パネルを投稿しました。`);

      return true;
    } catch (error) {
      logger.error('[castShiftHandler] 出勤パネル投稿処理でエラー', { error });
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ エラーが発生しました。', ephemeral: true });
      } else {
        await interaction.editReply({ content: '❌ エラーが発生しました。' }).catch(() => {});
      }
      return true;
    }
  },
};
