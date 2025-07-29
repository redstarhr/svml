// uriage_bot/commands/uriage_csv.js

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('売上報告csv')
    .setDescription('売上報告のCSV出力パネルを設置します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply();

    const embed = new EmbedBuilder()
        .setTitle('📊 売上報告CSV出力')
        .setDescription('出力したいデータの期間を指定するボタンを押してください。')
        .setColor(0x2ECC71);

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('csv_export_monthly').setLabel('月次').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('csv_export_quarterly').setLabel('四半期').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('csv_export_daily').setLabel('日次').setStyle(ButtonStyle.Secondary)
        );

    await interaction.editReply({ embeds: [embed], components: [row] });
  },
};
