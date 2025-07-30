// hikkake_bot/handlers/reactionDeleteHandler.js

const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { getReactions, deleteReaction } = require('../utils/hikkakeReactionManager');
const logger = require('@common/logger');
const { DELETE_REACTION_BUTTON, DELETE_REACTION_SELECT } = require('../constants');

module.exports = {
  async execute(interaction) {
    if (interaction.isButton() && interaction.customId === DELETE_REACTION_BUTTON) {
      await this.handleDeleteButton(interaction);
      return true;
    }
    if (interaction.isStringSelectMenu() && interaction.customId === DELETE_REACTION_SELECT) {
      await this.handleDeleteSelect(interaction);
      return true;
    }
    return false;
  },

  async handleDeleteButton(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const guildId = interaction.guildId;

    try {
      const reactions = await getReactions(guildId);
      const options = [];

      for (const type in reactions) {
        for (const key in reactions[type]) {
          for (const value in reactions[type][key]) {
            reactions[type][key][value].forEach((message, index) => {
              if (options.length < 25) {
                const label = `[${type}/${key}/${value}] ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`;
                options.push({
                  label: label.substring(0, 100),
                  value: `${type}:${key}:${value}:${index}`.substring(0, 100),
                });
              }
            });
          }
        }
      }

      if (options.length === 0) {
        return interaction.editReply({ content: '削除できる反応文がありません。' });
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(DELETE_REACTION_SELECT)
        .setPlaceholder('削除したい反応文を選択してください...')
        .addOptions(options);

      const row = new ActionRowBuilder().addComponents(selectMenu);
      const embed = new EmbedBuilder()
        .setTitle('🗑️ 反応文の削除')
        .setDescription('削除したい反応文を下のメニューから選択してください。')
        .setColor('Orange');

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
      logger.error('反応文削除メニューの作成中にエラーが発生しました。', { error, guildId });
      await interaction.editReply({ content: '❌ メニューの作成中にエラーが発生しました。' });
    }
  },

  async handleDeleteSelect(interaction) {
    if (!interaction.isStringSelectMenu()) {
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
        content: `✅ 反応文を削除しました: \`${deletedMessage}\`\n管理パネルを更新して、変更を確認してください。`,
        components: [],
        embeds: [],
      });
    } catch (error) {
      logger.error('反応文の削除中にエラーが発生しました。', { error, guildId, selectedValue });
      await interaction.editReply({ content: '❌ 削除中にエラーが発生しました。', components: [], embeds: [] });
    }
  },
};