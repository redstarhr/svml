// syuttaikin_bot/commands/cast-departure-panel.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { readState } = require('../utils/syuttaikinStateManager');
const logger = require('@common/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('キャスト退勤設置')
    .setDescription('キャストの退勤ボタンパネルを設置します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const guildId = interaction.guildId;
      const state = await readState(guildId);
      const departureTimes = state?.syuttaikin?.departureTimes || [];

      if (!departureTimes.length) {
        await interaction.editReply('⚠️ 退勤時間が設定されていません。`/キャスト出退勤設定`で先に退勤時間を登録してください。');
        return;
      }

      if (!interaction.channel) {
        await interaction.editReply('❌ チャンネル情報が取得できません。');
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('キャスト退勤')
        .setDescription('該当する退勤時間のボタンを押してください。')
        .setColor(0xE74C3C);

      const rows = [];
      const sortedTimes = [...departureTimes].sort();

      for (let i = 0; i < sortedTimes.length; i += 5) {
        const row = new ActionRowBuilder();
        const chunk = sortedTimes.slice(i, i + 5);
        chunk.forEach(time => {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`departure_time_${time}`)
              .setLabel(time)
              .setStyle(ButtonStyle.Danger)
          );
        });
        rows.push(row);
      }

      await interaction.channel.send({ embeds: [embed], components: rows });
      await interaction.editReply('✅ 退勤パネルを設置しました。');
      logger.info(`[syuttaikin] Guild:${guildId} で退勤パネルを設置しました。`);

    } catch (error) {
      logger.error(`[syuttaikin] Guild:${interaction.guildId} 退勤パネル設置中にエラー`, { error });
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply('❌ パネルの設置中にエラーが発生しました。');
        } else {
          await interaction.reply({ content: '❌ パネルの設置中にエラーが発生しました。', ephemeral: true });
        }
      } catch {}
    }
  },
};
