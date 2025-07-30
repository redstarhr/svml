const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { readState, writeState } = require('../utils/hikkakeStateManager');
const { buildStatusPanel, buildOrdersPanel } = require('../utils/panelBuilder');
const logger = require('@common/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hikkake_setup')
    .setDescription('指定したチャンネルに店内状況とひっかけ一覧パネルを設置します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('store_type')
        .setDescription('パネルを設置する店舗タイプ')
        .setRequired(true)
        .addChoices(
          { name: 'クエスト', value: 'quest' },
          { name: '凸スナ', value: 'tosu' },
          { name: 'トロイの木馬', value: 'horse' }
        ))
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('パネルを設置するテキストチャンネル')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const storeType = interaction.options.getString('store_type');
    const channel = interaction.options.getChannel('channel');
    const guildId = interaction.guild.id;

    try {
      const state = await readState(guildId);

      const statusPanelContent = buildStatusPanel(storeType, state);
      const statusMessage = await channel.send(statusPanelContent);

      const ordersPanelContent = buildOrdersPanel(storeType, state);
      const ordersMessage = await channel.send(ordersPanelContent);

      if (!state.panelMessages) state.panelMessages = {};
      state.panelMessages[storeType] = { channelId: channel.id, statusMessageId: statusMessage.id, ordersMessageId: ordersMessage.id };
      await writeState(guildId, state);

      logger.info(`[HikkakeSetup] ${storeType.toUpperCase()} パネルを #${channel.name} に設置しました。 (Guild: ${interaction.guild.name})`);
      await interaction.editReply({ content: `✅ **${storeType.toUpperCase()}** のパネルを <#${channel.id}> に設置しました。` });
    } catch (error) {
      logger.error(`[HikkakeSetup] パネルの設置中にエラーが発生しました。`, { error, guildId });
      await interaction.editReply({ content: '❌ パネルの設置中にエラーが発生しました。Botに必要な権限（メッセージの送信・編集など）があるか確認してください。' });
    }
  },
};