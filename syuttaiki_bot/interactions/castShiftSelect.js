const { ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ModalSubmitInteraction } = require('discord.js');
const castStateManager = require('../utils/castShift/castStateManager');
const { createOrUpdateCastShiftEmbed } = require('../utils/castShift/castPanelManager');

module.exports = {
  customIdPrefix: 'cast_shift_', // 例: cast_shift_work_20:00, cast_shift_leave_21:00

  async handle(interaction) {
    const { customId } = interaction;
    const guildId = interaction.guildId;
    const channel = interaction.channel;
    const date = new Date().toISOString().split('T')[0];

    // customId例：cast_shift_work_20:00、cast_shift_leave_21:00
    if (customId.startsWith('cast_shift_work_')) {
      const time = customId.replace('cast_shift_work_', '');

      // ユーザー選択用セレクトメニュー送信
      const allMembers = await interaction.guild.members.fetch();
      const options = allMembers
        .filter(m => !m.user.bot)
        .map(m => ({ label: m.user.username, value: m.user.id }))
        .slice(0, 25); // 25件まで

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`cast_shift_work_select_${time}`)
          .setPlaceholder(`出勤者を選択してください (${time})`)
          .setMinValues(1)
          .setMaxValues(options.length)
          .addOptions(options)
      );

      await interaction.reply({ content: '出勤者を選択してください。', components: [row], ephemeral: true });
      return;
    }

    if (customId.startsWith('cast_shift_leave_')) {
      const time = customId.replace('cast_shift_leave_', '');

      // ユーザー選択用セレクトメニュー送信（退勤）
      const allMembers = await interaction.guild.members.fetch();
      const options = allMembers
        .filter(m => !m.user.bot)
        .map(m => ({ label: m.user.username, value: m.user.id }))
        .slice(0, 25);

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`cast_shift_leave_select_${time}`)
          .setPlaceholder(`退勤者を選択してください (${time})`)
          .setMinValues(1)
          .setMaxValues(options.length)
          .addOptions(options)
      );

      await interaction.reply({ content: '退勤者を選択してください。', components: [row], ephemeral: true });
      return;
    }

    await interaction.reply({ content: '不明な操作です。', ephemeral: true });
  }
};
