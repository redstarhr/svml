// commands/hikkakeSetup.js
const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { writeState, readState, getDefaultState } = require('../utils/hikkakeStateManager');
const { buildPanelEmbed, buildPanelButtons } = require('../utils/panelBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ひっかけ一覧設置')
    .setDescription('クエスト・凸スナ・トロイの木馬の設置チャンネルを選択し、一覧パネルを設置します。')
    .addChannelOption(option =>
      option.setName('quest_channel')
        .setDescription('クエスト設置チャンネルを選択してください')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('tosu_channel')
        .setDescription('凸スナ設置チャンネルを選択してください')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('horse_channel')
        .setDescription('トロイの木馬設置チャンネルを選択してください')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guildId;
    const questChannel = interaction.options.getChannel('quest_channel');
    const tosuChannel = interaction.options.getChannel('tosu_channel');
    const horseChannel = interaction.options.getChannel('horse_channel');

    // state読み込み・初期化
    await interaction.deferReply({ flags: 64 }); // 64 is MessageFlags.Ephemeral

    const state = await readState(guildId);

    try {
      const channels = {
        quest: questChannel,
        tosu: tosuChannel,
        horse: horseChannel,
      };

      for (const type of ['quest', 'tosu', 'horse']) {
        const channel = channels[type];

        // Post Status Panel (with buttons)
        const statusEmbed = buildPanelEmbed('status', type, state, guildId);
        const buttons = buildPanelButtons(type);
        const statusMsg = await channel.send({ embeds: [statusEmbed], components: buttons });

        // Post Orders Panel (display only)
        const ordersEmbed = buildPanelEmbed('orders', type, state, guildId);
        const ordersMsg = await channel.send({ embeds: [ordersEmbed] });

        // Update state with new message info
        state.panelMessages[type] = {
          channelId: channel.id,
          statusMessageId: statusMsg.id,
          ordersMessageId: ordersMsg.id,
        };
      }

      await writeState(guildId, state);

      await interaction.editReply({ content: '✅ ひっかけ一覧パネルを設置しました。' });
    } catch (error) {
      console.error('[ひっかけ一覧設置] エラー:', error);
      // Let the global handler in index.js send the error message
      // to prevent "InteractionAlreadyReplied" errors.
      throw error;
    }
  }
};
