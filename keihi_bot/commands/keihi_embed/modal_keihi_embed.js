

const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    customId: 'keihi_embed_modal', // components 側と一致させる
  },

  async execute(interaction) {
    const title = interaction.fields.getTextInputValue('title');
    const subtitle = interaction.fields.getTextInputValue('subtitle') || '';
    const body = interaction.fields.getTextInputValue('body');

    const embed = new EmbedBuilder()
      .setTitle(`📄 ${title}`)
      .setDescription(`${subtitle ? `**${subtitle}**\n\n` : ''}${body}`)
      .setColor(0x2ecc71)
      .setTimestamp()
      .setFooter({
        text: `申請者: ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      });

    await interaction.reply({ embeds: [embed] });
  },
};
