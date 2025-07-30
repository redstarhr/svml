// hikkake_bot/handlers/reactionDeleteHandler.js

const { deleteReaction } = require('../utils/hikkakeReactionManager');
const logger = require('@common/logger');

module.exports = {
  /**
   * @param {import('discord.js').Interaction} interaction
   * @returns {Promise<boolean>}
   */
  async execute(interaction) {
    if (!interaction.isStringSelectMenu() || interaction.customId !== 'hikkake_reaction_delete') {
      return false;
    }

    await interaction.deferUpdate();
    const guildId = interaction.guildId;
    const selectedValue = interaction.values[0]; // "type:key:value:index"
    const [type, key, value, indexStr] = selectedValue.split(':');
    const index = parseInt(indexStr, 10);

    try {
      const deletedMessage = await deleteReaction(guildId, type, key, value, index);
      await interaction.editReply({
        content: `✅ 反応文を削除しました: \`${deletedMessage}\`\n新しい一覧を表示するには、再度コマンドを実行してください。`,
        components: [], // メニューを消す
        embeds: [], // 埋め込みを消す
      });
    } catch (error) {
      logger.error('反応文の削除中にエラーが発生しました。', { error, guildId });
      await interaction.editReply({ content: '❌ 削除中にエラーが発生しました。', components: [], embeds: [] });
    }

    return true;
  },
};