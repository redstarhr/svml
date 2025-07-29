const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserData, calculateLevel } = require('../utils/levelManager');
const { getConfig } = require('../utils/levelConfigManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('現在のレベルとXPを確認します。')
    .setNameLocalization('ja', 'レベル確認')
    .addUserOption(option =>
      option.setName('user').setDescription('確認したいユーザー（任意）').setNameLocalization('ja', 'ユーザー')
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    if (targetUser.bot) {
      return interaction.reply({ content: 'Botのレベルは確認できません。', ephemeral: true });
    }

    await interaction.deferReply();

    const [userData, config] = await Promise.all([
      getUserData(interaction.guild.id, targetUser.id),
      getConfig(interaction.guild.id),
    ]);

    const currentLevel = calculateLevel(userData.xp, config.xpTable);
    const nextLevel = currentLevel + 1;
    const xpForNextLevel = config.xpTable[nextLevel.toString()] || userData.xp; // 次のレベルがなければ現在のXP
    const progress = Math.min(Math.floor((userData.xp / xpForNextLevel) * 100), 100);

    const embed = new EmbedBuilder()
      .setAuthor({ name: `${targetUser.username}のレベル情報`, iconURL: targetUser.displayAvatarURL() })
      .setColor(0x5865f2)
      .addFields(
        { name: '現在のレベル', value: `**LV ${currentLevel}**`, inline: true },
        { name: '現在のXP', value: `${userData.xp}`, inline: true },
        {
          name: `次のレベルまで (LV ${nextLevel})`,
          value: `あと **${Math.max(0, xpForNextLevel - userData.xp)}** XP (合計 ${xpForNextLevel} XP)`,
        },
        { name: '進捗', value: '`' + '█'.repeat(progress / 5) + ' '.repeat(20 - progress / 5) + `\` ${progress}%` }
      );

    await interaction.editReply({ embeds: [embed] });
  },
};