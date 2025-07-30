// hikkake_bot/components/selects/removeReactionSelect.js
const { MessageFlags } = require('discord.js');
const { readReactions, writeReactions } = require('../../utils/hikkakeReactionManager');

module.exports = {
  customId: 'hikkake_reaction_remove_select',
  /**
   * @param {import('discord.js').StringSelectMenuInteraction} interaction
   */
  async handle(interaction) {
    await interaction.deferUpdate();

    const guildId = interaction.guildId;
    const [store, key, value] = interaction.values[0].split('_');

    const reactions = await readReactions(guildId);

    if (reactions[store]?.[key]?.[value]) {
      delete reactions[store][key][value];
      await writeReactions(guildId, reactions);
      await interaction.editReply({ content: `✅ 設定 [${store.toUpperCase()}/${key}/${value}] を削除しました。`, components: [] });
    } else {
      await interaction.editReply({ content: '❌ 選択された設定が見つかりませんでした。既に削除されている可能性があります。', components: [] });
    }
  },
};