// level_bot/components/selects/setNotifyChannelSelect.js
const { EmbedBuilder, MessageFlags } = require('discord.js');
const { readConfig, writeConfig } = require('../../utils/levelStateManager');

module.exports = {
  customId: 'setNotifyChannelSelect',
  /**
   * @param {import('discord.js').ChannelSelectMenuInteraction} interaction
   */
  async handle(interaction) {
    await interaction.deferUpdate();

    const guildId = interaction.guild.id;
    const selectedChannelId = interaction.values[0] || null; // If empty, set to null

    const config = await readConfig(guildId);
    config.notifyChannelId = selectedChannelId;
    await writeConfig(guildId, config);

    // Rebuild the embed with updated info
    const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
      .setFields(
        { name: 'XP / 1メッセージ', value: `${config.xpPerMessage}`, inline: true },
        { name: 'クールダウン（秒）', value: `${config.cooldownSec}`, inline: true },
        { name: '通知チャンネル', value: config.notifyChannelId ? `<#${config.notifyChannelId}>` : '未設定', inline: true },
        { name: 'レベルアップ無効ロール', value: config.disabledRoles.length ? config.disabledRoles.map(id => `<@&${id}>`).join(', ') : '未設定' },
        { name: '登録済スタンプ', value: config.levelStamps.length ? config.levelStamps.join('\n') : '未登録' }
      );

    await interaction.editReply({ embeds: [updatedEmbed] });
    await interaction.followUp({ content: '✅ 通知チャンネルを更新しました。', flags: [MessageFlags.Ephemeral] });
  },
};