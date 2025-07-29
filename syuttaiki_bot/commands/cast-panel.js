// syuttaiki_bot/commands/cast-panel.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { readState } = require('../utils/syuttaikiStateManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cast-panel')
    .setDescription('現在のチャンネルに出退勤パネルを投稿します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const state = await readState(interaction.guildId);
    const config = state.syuttaikin;

    if (interaction.channel.id !== config.panelChannelId) {
        return interaction.reply({
            content: `このコマンドは設定されたパネル投稿チャンネル (<#${config.panelChannelId}>) でのみ使用できます。`,
            flags: [MessageFlags.Ephemeral],
        });
    }

    const embed = new EmbedBuilder()
        .setTitle('キャスト出退勤パネル')
        .setDescription('該当するボタンを押して出勤・退勤を記録してください。')
        .setColor(0x3498DB);

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('syuttaikin_clock-in_normal').setLabel('通常出勤').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('syuttaikin_clock-out_normal').setLabel('通常退勤').setStyle(ButtonStyle.Danger)
    );
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('syuttaikin_clock-in_help').setLabel('ヘルプ出勤').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('syuttaikin_clock-out_help').setLabel('ヘルプ退勤').setStyle(ButtonStyle.Danger)
    );

    await interaction.channel.send({ embeds: [embed], components: [row1, row2] });
    await interaction.reply({ content: 'パネルを投稿しました。', flags: [MessageFlags.Ephemeral] });
  },
};