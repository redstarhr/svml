// components/buttons/level_stamp_config.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { readJsonFromGCS } = require('../../utils/gcs');

module.exports = {
  customId: 'level_stamp_config',

  /**
   * レベルスタンプ設定パネル表示ボタン
   * @param {import('discord.js').ButtonInteraction} interaction
   */
  async handle(interaction) {
    const guildId = interaction.guildId;
    const filePath = `data-svml/${guildId}/level/config.json`;

    const config = await readJsonFromGCS(filePath) || { stamps: [], ignoreRoles: [] };

    const embed = new EmbedBuilder()
      .setTitle('📛 レベルスタンプ設定')
      .setDescription('レベルアップ時に通知で使うスタンプを設定できます')
      .addFields(
        config.stamps.length > 0
          ? config.stamps.map((stamp, index) => ({
              name: `#${index + 1}`,
              value: stamp,
              inline: true
            }))
          : [{ name: '（未登録）', value: 'スタンプが登録されていません。', inline: true }]
      )
      .setColor(0x00bcd4);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('level_stamp_add')
        .setLabel('➕ スタンプ追加')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('level_stamp_clear')
        .setLabel('🗑 全削除')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });
  },
};
