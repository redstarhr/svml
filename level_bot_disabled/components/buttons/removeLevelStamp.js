// level_bot/components/buttons/removeLevelStamp.js
const { ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const { readConfig } = require('../../utils/levelStateManager');

module.exports = {
  customId: 'removeLevelStamp',
  /**
   * @param {import('discord.js').ButtonInteraction} interaction
   */
  async handle(interaction) {
    const guildId = interaction.guild.id;
    const config = await readConfig(guildId);

    if (!config.levelStamps || config.levelStamps.length === 0) {
      return interaction.reply({ content: '削除できるスタンプが登録されていません。', flags: [MessageFlags.Ephemeral] });
    }

    const options = config.levelStamps.map(stamp => ({
      label: stamp,
      value: stamp,
    }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('removeLevelStampSelect')
      .setPlaceholder('削除するスタンプを選択')
      .addOptions(options);

    await interaction.reply({
      content: '削除するスタンプを選択してください。',
      components: [new ActionRowBuilder().addComponents(selectMenu)],
      flags: [MessageFlags.Ephemeral],
    });
  },
};