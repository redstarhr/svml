// commands/keihi_rireki/index.js
const {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder
} = require('discord.js');
const { getAvailableExpenseFiles } = require('../../keihi_bot/utils/fileStorage.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('経費申請履歴')
    .setDescription('過去の経費申請履歴を月ごとに選択して表示'),

  async execute(interaction) {
    const guildId = interaction.guildId;

    const yearMonths = getAvailableExpenseFiles(guildId);
    if (!yearMonths.length) {
      return interaction.reply({
        content: '📭 表示できる履歴がまだありません。',
        flags: 64
      });
    }

    const options = yearMonths
      .sort().reverse()
      .map(ym => new StringSelectMenuOptionBuilder().setLabel(ym).setValue(ym));

    const menu = new StringSelectMenuBuilder()
      .setCustomId('history_year_month')
      .setPlaceholder('履歴を確認したい月を選んでください')
      .setMinValues(1)
      .setMaxValues(Math.min(12, options.length)) // ✅ 最大12件まで選択可能
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({
      content: '📆 表示したい履歴の月を選んでください（最大12件まで）',
      components: [row],
      flags: 64
    });
  }
};

