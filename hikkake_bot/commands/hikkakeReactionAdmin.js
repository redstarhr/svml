// hikkake_bot/commands/hikkakeReactionAdmin.js

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { readReactions } = require('../utils/hikkakeReactionManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('反応文管理')
    .setDescription('登録済みの反応文を一覧表示・削除します。')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('管理するカテゴリを選択')
        .setRequired(true)
        .addChoices(
          { name: 'クエスト', value: 'quest' },
          { name: '凸スナ', value: 'tosu' },
          { name: 'トロイの木馬', value: 'horse' }
        ))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 }); // Ephemeral

    const type = interaction.options.getString('category');
    const guildId = interaction.guildId;

    const reactions = await readReactions(guildId);
    const categoryReactions = reactions[type];

    const embed = new EmbedBuilder()
      .setTitle(`【${type.toUpperCase()}】登録済み反応文一覧`)
      .setColor(0x00B0F4);

    const options = [];
    let description = '';

    if (!categoryReactions || Object.keys(categoryReactions).length === 0) {
      description = 'このカテゴリには反応文が登録されていません。';
    } else {
      for (const key of ['num', 'count']) {
        const keyLabel = key === 'num' ? '人数' : '本数';
        if (categoryReactions[key]) {
          description += `**▼ ${keyLabel}別**\n`;
          Object.entries(categoryReactions[key]).forEach(([value, messages]) => {
            description += `**${value}**: \n`;
            messages.forEach((msg, index) => {
              description += `- ${msg}\n`;
              options.push(
                new StringSelectMenuOptionBuilder()
                  .setLabel(`[${keyLabel}:${value}] ${msg.substring(0, 80)}`)
                  .setValue(`${type}:${key}:${value}:${index}`)
              );
            });
          });
        }
      }
    }

    embed.setDescription(description || 'このカテゴリには反応文が登録されていません。');

    if (options.length > 0) {
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('hikkake_reaction_delete')
        .setPlaceholder('削除する反応文を選択...')
        .addOptions(options.slice(0, 25)); // Max 25 options

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.editReply({
        embeds: [embed],
        components: [row],
      });
    } else {
      await interaction.editReply({
        embeds: [embed],
        components: [],
      });
    }
  },
};