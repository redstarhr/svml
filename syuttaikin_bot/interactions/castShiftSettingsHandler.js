const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const castStateManager = require('../utils/castShift/castStateManager');

const SETTINGS_ID_PREFIX = 'cast_shift_setting_';

module.exports = {
  customIdPrefix: SETTINGS_ID_PREFIX,

  async handle(interaction) {
    const { customId, guildId } = interaction;
    const date = new Date().toISOString().split('T')[0];
    const state = await castStateManager.loadOrInitState(guildId, date, interaction.channel.id);

    if (customId === SETTINGS_ID_PREFIX + 'work_add') {
      const modal = new ModalBuilder()
        .setCustomId(SETTINGS_ID_PREFIX + 'work_add_modal')
        .setTitle('出勤時間登録');

      const input = new TextInputBuilder()
        .setCustomId('work_times')
        .setLabel('出勤時間をカンマ区切りで入力（例: 10:00,10:30）')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
      return;
    }

    if (customId === SETTINGS_ID_PREFIX + 'work_del') {
      const options = (state.shifts ? Object.keys(state.shifts) : []).map(time => ({ label: time, value: time }));
      if (options.length === 0) {
        await interaction.reply({ content: '登録された出勤時間がありません。', ephemeral: true });
        return;
      }
      const menu = new StringSelectMenuBuilder()
        .setCustomId(SETTINGS_ID_PREFIX + 'work_del_select')
        .setPlaceholder('削除する出勤時間を選択')
        .addOptions(options);
      await interaction.reply({ components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
      return;
    }

    if (customId === SETTINGS_ID_PREFIX + 'leave_add') {
      const modal = new ModalBuilder()
        .setCustomId(SETTINGS_ID_PREFIX + 'leave_add_modal')
        .setTitle('退勤時間登録');

      const input = new TextInputBuilder()
        .setCustomId('leave_times')
        .setLabel('退勤時間をカンマ区切りで入力（例: 21:00,21:30）')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
      return;
    }

    if (customId === SETTINGS_ID_PREFIX + 'leave_del') {
      const options = (state.leaves ? Object.values(state.leaves).filter((v, i, self) => self.indexOf(v) === i) : []).map(time => ({ label: time, value: time }));
      if (options.length === 0) {
        await interaction.reply({ content: '登録された退勤時間がありません。', ephemeral: true });
        return;
      }
      const menu = new StringSelectMenuBuilder()
        .setCustomId(SETTINGS_ID_PREFIX + 'leave_del_select')
        .setPlaceholder('削除する退勤時間を選択')
        .addOptions(options);
      await interaction.reply({ components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
      return;
    }
  }
};
