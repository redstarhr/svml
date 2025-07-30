const { readState, writeState } = require('../../utils/hikkakeStateManager');
const { updateAllHikkakePanels } = require('../../utils/hikkakePanelManager');
const { logToThread } = require('../../utils/threadLogger');
const logger = require('@common/logger');
const { EmbedBuilder } = require('discord.js');
const { DateTime } = require('luxon');

module.exports = {
  customId: /^leave_(quest|tosu|horse)$/,
  async execute(interaction, client) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const match = interaction.customId.match(this.customId);
      if (!match) return;
      const [, type] = match;
      const guildId = interaction.guildId;
      const user = interaction.user;

      const state = await readState(guildId);

      const memberIndex = state.members?.[type]?.findIndex(member => member.id === user.id);

      if (memberIndex === undefined || memberIndex === -1) {
        return interaction.editReply({ content: '❌ あなたは入店していません。' });
      }

      // Remove member
      const [removedMember] = state.members[type].splice(memberIndex, 1);

      await writeState(guildId, state);
      await updateAllHikkakePanels(client, guildId, state);

      // Logging
      let durationString = '不明';
      if (removedMember.enterTimestamp) {
        const enterTime = DateTime.fromISO(removedMember.enterTimestamp);
        const leaveTime = DateTime.now();
        const duration = leaveTime.diff(enterTime, ['minutes', 'seconds']);
        durationString = `${Math.floor(duration.minutes)}分${Math.round(duration.seconds)}秒`;
      }

      const logEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription(`**${user.displayName}** が **${type.toUpperCase()}** から退店しました。`)
        .addFields({ name: '滞在時間', value: durationString, inline: true })
        .setTimestamp()
        .setFooter({ text: `操作者: ${user.tag}`, iconURL: user.displayAvatarURL() });

      logger.info(`[HikkakeLeave] ${user.tag} left ${type.toUpperCase()} (Guild: ${interaction.guild.name})`);
      await logToThread(client, guildId, { embeds: [logEmbed] });

      await interaction.editReply({ content: '✅ 退店しました。' });
    } catch (error) {
      logger.error('退店処理中にエラーが発生しました。', { error, customId: interaction.customId, guildId: interaction.guildId });
      if (interaction.deferred && !interaction.replied) {
        await interaction.editReply({ content: '❌ 処理中にエラーが発生しました。' }).catch(() => {});
      }
    }
  },
};