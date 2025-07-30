const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChannelType } = require('discord.js');
const { getLevelConfig, setLevelConfig } = require('../utils/levelConfig');
const logger = require('@common/logger');

module.exports = {
  // このハンドラは複数のcustomIdを処理するため、ルーターとして機能します
  async execute(interaction) {
    if (interaction.isButton() && interaction.customId === 'config_level_settings') {
      await this.handleLevelSettingsButton(interaction);
      return true; // 処理済み
    }
    if (interaction.isModalSubmit() && interaction.customId === 'config_level_modal') {
      await this.handleLevelSettingsModal(interaction);
      return true; // 処理済み
    }
    return false; // このハンドラでは処理しない
  },

  /** 「レベル設定」ボタンの処理 */
  async handleLevelSettingsButton(interaction) {
    const guildId = interaction.guild.id;
    const currentConfig = await getLevelConfig(guildId);

    const modal = new ModalBuilder()
      .setCustomId('config_level_modal')
      .setTitle('📈 レベル設定');

    const xpMinInput = new TextInputBuilder()
      .setCustomId('xp_min')
      .setLabel('メッセージ毎の獲得経験値 (最小値)')
      .setStyle(TextInputStyle.Short)
      .setValue(String(currentConfig.xpPerMessage.min))
      .setRequired(true);

    const xpMaxInput = new TextInputBuilder()
      .setCustomId('xp_max')
      .setLabel('メッセージ毎の獲得経験値 (最大値)')
      .setStyle(TextInputStyle.Short)
      .setValue(String(currentConfig.xpPerMessage.max))
      .setRequired(true);

    const cooldownInput = new TextInputBuilder()
      .setCustomId('cooldown')
      .setLabel('経験値獲得のクールダウン (秒)')
      .setStyle(TextInputStyle.Short)
      .setValue(String(currentConfig.cooldownSeconds))
      .setRequired(true);

    const levelUpChannelInput = new TextInputBuilder()
      .setCustomId('levelup_channel')
      .setLabel('レベルアップ通知チャンネルID (空欄で無効)')
      .setStyle(TextInputStyle.Short)
      .setValue(currentConfig.levelUpChannelId || '')
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(xpMinInput),
      new ActionRowBuilder().addComponents(xpMaxInput),
      new ActionRowBuilder().addComponents(cooldownInput),
      new ActionRowBuilder().addComponents(levelUpChannelInput)
    );

    await interaction.showModal(modal);
  },

  /** レベル設定モーダルの送信処理 */
  async handleLevelSettingsModal(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const guildId = interaction.guild.id;

    try {
      const xp_min = parseInt(interaction.fields.getTextInputValue('xp_min'), 10);
      const xp_max = parseInt(interaction.fields.getTextInputValue('xp_max'), 10);
      const cooldown = parseInt(interaction.fields.getTextInputValue('cooldown'), 10);
      const levelup_channel_id = interaction.fields.getTextInputValue('levelup_channel').trim() || null;

      // バリデーション
      if (isNaN(xp_min) || isNaN(xp_max) || isNaN(cooldown)) return interaction.editReply({ content: '⚠️ 入力値はすべて半角数字である必要があります。' });
      if (xp_min < 0 || xp_max < 0 || cooldown < 0) return interaction.editReply({ content: '⚠️ 入力値は0以上である必要があります。' });
      if (xp_min > xp_max) return interaction.editReply({ content: '⚠️ 経験値の最大値は最小値以上である必要があります。' });
      if (levelup_channel_id) {
        const channel = await interaction.guild.channels.fetch(levelup_channel_id).catch(() => null);
        if (!channel || channel.type !== ChannelType.GuildText) return interaction.editReply({ content: `⚠️ チャンネルID \`${levelup_channel_id}\` が見つからないか、テキストチャンネルではありません。` });
      }

      const currentConfig = await getLevelConfig(guildId);
      const newConfig = {
        ...currentConfig, // 既存のロール報酬などを維持
        xpPerMessage: { min: xp_min, max: xp_max },
        cooldownSeconds: cooldown,
        levelUpChannelId: levelup_channel_id,
      };

      await setLevelConfig(guildId, newConfig);
      await interaction.editReply({ content: '✅ レベル設定を保存しました。' });
    } catch (error) {
      logger.error('レベル設定の保存中にエラーが発生しました。', { error, guildId });
      await interaction.editReply({ content: '❌ 設定の保存中にエラーが発生しました。' });
    }
  },
};