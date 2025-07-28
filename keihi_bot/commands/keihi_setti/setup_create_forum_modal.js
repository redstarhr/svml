// commands/keihi_setti/setup_create_forum_modal.js
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require('discord.js');

module.exports = {
  data: {
    customId: 'setup_create_forum_modal',
  },

  async execute(interaction) {
    const body = interaction.fields.getTextInputValue('body');
    const channel = interaction.channel;

    if (!channel || channel.type !== ChannelType.GuildText) {
      return interaction.reply({
        content: '⚠️ テキストチャンネルでのみ使用できます。',
        flags: 64
      });
    }

    // 古い案内メッセージを削除（タイトル一致）
    try {
      const messages = await channel.messages.fetch({ limit: 50 });
      for (const msg of messages.values()) {
        if (
          msg.author.id === interaction.client.user.id &&
          msg.embeds[0]?.title?.includes('経費申請フォーラム')
        ) {
          await msg.delete();
        }
      }
    } catch (err) {
      console.error('❌ 過去案内削除エラー:', err);
    }

    // 新しい案内メッセージ送信
    const embed = new EmbedBuilder()
      .setTitle('📋 経費申請フォーラム')
      .setDescription(body)
      .setColor(0x3498db);

    const applyButton = new ButtonBuilder()
      .setCustomId('apply')
      .setLabel('経費申請')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(applyButton);

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  },
};
