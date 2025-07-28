// hikkake_bot/utils/hikkakeReactionDeleteSelect.js

const { readReactions, writeReactions } = require('./hikkakeReactionManager');

module.exports = {
  customId: /^hikkake_reaction_delete$/,
  async handle(interaction) {
    await interaction.deferUpdate();

    const guildId = interaction.guildId;
    const selectedValue = interaction.values[0];
    const [type, key, value, indexStr] = selectedValue.split(':');
    const index = parseInt(indexStr, 10);

    if (!type || !key || !value || isNaN(index)) {
      await interaction.editReply({ content: 'エラー: 削除情報の解析に失敗しました。', components: [] });
      return;
    }

    try {
      const reactions = await readReactions(guildId);

      const targetArray = reactions?.[type]?.[key]?.[value];

      if (!targetArray || index >= targetArray.length) {
        await interaction.editReply({ content: 'エラー: 削除対象の反応文が見つかりませんでした。既に削除されている可能性があります。', components: [] });
        return;
      }

      const deletedMessage = targetArray.splice(index, 1)[0];

      // If the array is now empty, remove the key
      if (targetArray.length === 0) {
        delete reactions[type][key][value];
        if (Object.keys(reactions[type][key]).length === 0) {
          delete reactions[type][key];
        }
      }

      await writeReactions(guildId, reactions);

      await interaction.followUp({ content: `✅ 反応文「${deletedMessage}」を削除しました。`, flags: 64 });
      // Note: For simplicity, this doesn't auto-update the original message. The user can re-run the command to see the updated list.
    } catch (error) {
      console.error('[hikkakeReactionDeleteSelect] リアクション削除エラー:', error);
      await interaction.followUp({ content: 'エラーが発生し、反応文を削除できませんでした。', flags: 64 });
    }
  },
};