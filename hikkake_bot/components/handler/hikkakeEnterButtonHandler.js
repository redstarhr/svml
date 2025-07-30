const { readState, writeState } = require('../../utils/hikkakeStateManager');
const { updateAllHikkakePanels } = require('../../utils/hikkakePanelManager');
const { logToThread } = require('../../utils/threadLogger');
const logger = require('@common/logger');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  customId: /^enter_(quest|tosu|horse)$/,
  async execute(interaction, client) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const match = interaction.customId.match(this.customId);
      if (!match) return;
      const [, type] = match;
      const guildId = interaction.guildId;
      const user = interaction.user;

      const state = await readState(guildId);

      state.members = state.members || {};
      state.members[type] = state.members[type] || [];

      if (state.members[type].some(member => member.id === user.id)) {
        return interaction.editReply({ content: 'ℹ️ あなたはすでに入店済みです。' });
      }

      state.members[type].push({
        id: user.id,
        name: user.displayName,
        enterTimestamp: new Date().toISOString(),
      });

      await writeState(guildId, state);
      await updateAllHikkakePanels(client, guildId, state);

      const logEmbed = new EmbedBuilder()
        .setColor('Blue')
        .setDescription(`**${user.displayName}** が **${type.toUpperCase()}** に入店しました。`)
        .setTimestamp()
        .setFooter({ text: `操作者: ${user.tag}`, iconURL: user.displayAvatarURL() });

      logger.info(`[HikkakeEnter] ${user.tag} entered ${type.toUpperCase()} (Guild: ${interaction.guild.name})`);
      await logToThread(client, guildId, { embeds: [logEmbed] });

      await interaction.editReply({ content: '✅ 入店しました。' });
    } catch (error) {
      logger.error('入店処理中にエラーが発生しました。', { error, customId: interaction.customId, guildId: interaction.guildId });
      if (interaction.deferred && !interaction.replied) {
        await interaction.editReply({ content: '❌ 処理中にエラーが発生しました。' }).catch(() => {});
      }
    }
  },
};