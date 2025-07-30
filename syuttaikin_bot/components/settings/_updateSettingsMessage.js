const { EmbedBuilder } = require('discord.js');
const { readState } = require('../../utils/syuttaikiStateManager');

/**
 * 設定パネルの埋め込みメッセージを最新の設定内容で更新します。
 * @param {import('discord.js').MessageComponentInteraction} interaction
 */
async function updateSettingsMessage(interaction) {
    const state = await readState(interaction.guild.id);
    const config = state.syuttaikin || {};
    const originalEmbed = interaction.message.embeds[0];

    const updatedEmbed = EmbedBuilder.from(originalEmbed).setFields(
        { name: 'キャストロール', value: config.castRoles?.length > 0 ? config.castRoles.map(id => `<@&${id}>`).join(', ') : '未設定' },
        { name: 'パネル投稿チャンネル', value: config.panelChannelId ? `<#${config.panelChannelId}>` : '未設定' },
        { name: 'ログ通知チャンネル', value: config.logChannelId ? `<#${config.logChannelId}>` : '未設定' }
    );

    await interaction.update({ embeds: [updatedEmbed] });
}

module.exports = { updateSettingsMessage };