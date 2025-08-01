// uriage_bot/commands/uriage_csv.js

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require('discord.js');

const MONTHLY_BUTTON_ID = 'uriage_csv_export_monthly';
const QUARTERLY_BUTTON_ID = 'uriage_csv_export_quarterly';
const DAILY_BUTTON_ID = 'uriage_csv_export_daily';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('売上報告csv')
    .setDescription('売上報告のCSV出力パネルを設置します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('📊 売上報告CSV出力')
        .setDescription('出力したいデータの期間を指定するボタンを押してください。')
        .setColor(0x2ECC71);

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(MONTHLY_BUTTON_ID).setLabel('月次').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(QUARTERLY_BUTTON_ID).setLabel('四半期').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(DAILY_BUTTON_ID).setLabel('日次').setStyle(ButtonStyle.Secondary)
        );

    // パネルをチャンネルに送信
    await interaction.channel.send({ embeds: [embed], components: [row] });
    // 実行者にエフェメラルメッセージで完了通知
    await interaction.reply({ content: '売上報告CSV出力パネルを設置しました。', flags: MessageFlags.Ephemeral });
  },
};
