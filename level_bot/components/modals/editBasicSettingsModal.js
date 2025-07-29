// level_bot/components/modals/editBasicSettingsModal.js
const { EmbedBuilder, MessageFlags } = require('discord.js');
const { readConfig, writeConfig } = require('../../utils/levelStateManager');

module.exports = {
  customId: 'editBasicSettingsModal',
  /**
   * @param {import('discord.js').ModalSubmitInteraction} interaction
   */
  async handle(interaction) {
    await interaction.deferUpdate();

    const guildId = interaction.guild.id;
    const xpPerMessage = parseInt(interaction.fields.getTextInputValue('xpPerMessage'), 10);
    const cooldownSec = parseInt(interaction.fields.getTextInputValue('cooldownSec'), 10);

    if (isNaN(xpPerMessage) || isNaN(cooldownSec) || xpPerMessage < 0 || cooldownSec < 0) {
      return interaction.followUp({ content: '❌ XPとクールダウンには正の整数を入力してください。', flags: [MessageFlags.Ephemeral] });
    }

    const config = await readConfig(guildId);
    config.xpPerMessage = xpPerMessage;
    config.cooldownSec = cooldownSec;
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
    await interaction.followUp({
      content: `✅ 基本設定を更新しました。\n**XP/メッセージ:** ${xpPerMessage}\n**クールダウン:** ${cooldownSec}秒`,
      flags: [MessageFlags.Ephemeral]
    });
  },
};