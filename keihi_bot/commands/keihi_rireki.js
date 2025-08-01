// keihi_bot/commands/keihi_rireki.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { readState } = require('@root/keihi_bot/utils/keihiStateManager');

/**
 * Creates an embed and action row for a given expense.
 * @param {object} expense The expense object.
 * @param {import('discord.js').User | null} user The user who submitted the expense.
 * @returns {{embed: EmbedBuilder, row: ActionRowBuilder}}
 */
function createExpenseComponents(expense, user) {
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
  return { embed, row };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('keihi_rireki')
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

    // Fetch all users in parallel to improve performance
    const expensesToShow = pendingExpenses.slice(0, 10);
    const userPromises = expensesToShow.map(e => interaction.client.users.fetch(e.userId).catch(() => null));
    const users = await Promise.all(userPromises);

    // If there's only one pending expense, send it as a single message.
    if (expensesToShow.length === 1) {
      const { embed, row } = createExpenseComponents(expensesToShow[0], users[0]);
      return interaction.editReply({
        content: `承認待ちの経費申請が 1 件あります。`,
        embeds: [embed],
        components: [row],
      });
    }

    // For multiple expenses, send the first one and subsequent ones as follow-ups.
    const first = createExpenseComponents(expensesToShow[0], users[0]);
    await interaction.editReply({
      content: `承認待ちの経費申請が ${pendingExpenses.length} 件あります。`,
      embeds: [first.embed],
      components: [first.row],
    });

    for (let i = 1; i < expensesToShow.length; i++) {
      const { embed, row } = createExpenseComponents(expensesToShow[i], users[i]);
      await interaction.followUp({ embeds: [embed], components: [row], ephemeral: true });
    }
  },
};