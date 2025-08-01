const logger = require('@common/logger');
const { readState } = require('../../utils/syuttaikinStateManager');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  async execute(interaction, client) {
    const customId = interaction.customId;
    const match = customId.match(/^(arrival|departure)_time_(\d{1,2}:\d{2})$/);

    if (!match) {
      return false;
    }

    await interaction.deferReply({ ephemeral: true });

    const type = match[1];
    const time = match[2];
    const guildId = interaction.guild?.id;
    if (!guildId) {
      await interaction.editReply({ content: 'ギルド情報が見つかりません。' });
      return true;
    }

    const user = interaction.user;
    const member = interaction.member;

    try {
      const state = await readState(guildId);
      const config = state.syuttaikin || {};
      const castRoles = config.castRoles || [];

      if (castRoles.length > 0 && !member.roles.cache.some(role => castRoles.includes(role.id))) {
        await interaction.editReply({ content: 'このボタンを使用する権限がありません。' });
        return true;
      }

      if (config.logChannelId) {
        const logChannel = await client.channels.fetch(config.logChannelId).catch(err => {
          logger.error(`[syuttaikin] ログチャンネル取得失敗 (ID: ${config.logChannelId})`, { error: err });
          return null;
        });
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setAuthor({ name: member.displayName, iconURL: user.displayAvatarURL() })
            .setTitle(`${type === 'arrival' ? '✅ 出勤' : '🚪 退勤'}記録`)
            .setDescription(`${member} が **${time}** に${type === 'arrival' ? '出勤' : '退勤'}しました。`)
            .setColor(type === 'arrival' ? 0x57F287 : 0xED4245)
            .setTimestamp();
          await logChannel.send({ embeds: [logEmbed] });
        }
      }

      await interaction.editReply({ content: `**${time}** に${type === 'arrival' ? '出勤' : '退勤'}を記録しました。` });
    } catch (error) {
      logger.error(`[syuttaikin] 出退勤ボタンの処理中にエラーが発生しました (User: ${user.tag})`, { error });
      await interaction.editReply({ content: '処理中にエラーが発生しました。' });
    }

    return true;
  }
};
