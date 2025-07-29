// keihi_bot/commands/keihi_rireki.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { readState } = require('../utils/keihiStateManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('keihi-rireki')
    .setDescription('提出された経費の履歴を確認し、承認または拒否します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guildId = interaction.guild.id;
    const state = await readState(guildId);

    const pendingExpenses = state.expenses.filter(e => e.status === 'pending');

    if (pendingExpenses.length === 0) {
      return interaction.editReply({ content: '現在、承認待ちの経費申請はありません。' });
    }

    const embeds = [];
    const components = [];

    for (const expense of pendingExpenses.slice(0, 10)) { // Show up to 10 at a time
      const user = await interaction.client.users.fetch(expense.userId).catch(() => null);
      const embed = new EmbedBuilder()
        .setTitle('経費申請の確認')
        .setColor(0xFFD700) // Gold
        .addFields(
          { name: '申請者', value: user ? `${user.tag} (${user.id})` : expense.userName, inline: true },
          { name: '申請日時', value: new Date(expense.submittedAt).toLocaleString('ja-JP'), inline: true },
          { name: '金額', value: `${expense.amount.toLocaleString()}円`, inline: false },
          { name: '内容', value: expense.description, inline: false }
        )
        .setFooter({ text: `経費ID: ${expense.id}` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`keihi_approve_${expense.id}`).setLabel('承認').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`keihi_reject_${expense.id}`).setLabel('拒否').setStyle(ButtonStyle.Danger)
      );

      embeds.push(embed);
      components.push(row);
    }

    await interaction.editReply({
      content: `承認待ちの経費申請が ${pendingExpenses.length} 件あります。`,
      embeds,
      components,
    });
  },
};