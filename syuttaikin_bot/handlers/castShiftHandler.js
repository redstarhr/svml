// syuttaikin_bot/handlers/castShiftHandler.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const logger = require('@common/logger');

module.exports = {
  filePath: __filename,

  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'cast_shift') {
          const embed = new EmbedBuilder()
            .setTitle('キャストシフト確認')
            .setDescription('現在のシフト情報を表示します。')
            .setColor(0x00AAFF);

          const button = new ButtonBuilder()
            .setCustomId('cast_shift_refresh')
            .setLabel('更新')
            .setStyle(ButtonStyle.Primary);

          const row = new ActionRowBuilder().addComponents(button);

          await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
          return true;
        }
      }

      if (interaction.isButton()) {
        if (interaction.customId === 'cast_shift_refresh') {
          // 元のEmbedを保持して更新したい場合
          const originalEmbed = interaction.message.embeds[0];
          const embed = EmbedBuilder.from(originalEmbed)
            .setDescription('シフト情報を更新しました。');

          const button = new ButtonBuilder()
            .setCustomId('cast_shift_refresh')
            .setLabel('更新')
            .setStyle(ButtonStyle.Primary);

          const row = new ActionRowBuilder().addComponents(button);

          await interaction.update({ embeds: [embed], components: [row] });
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error('[castShiftHandler] エラーが発生しました', { error });
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '処理中にエラーが発生しました。', ephemeral: true });
      }
      return true;
    }
  },
};
