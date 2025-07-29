// keihi_bot/components/buttons/keihi_reject_button.js
const { readState, writeState } = require('../../utils/keihiStateManager');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  customId: 'keihi_reject_', // We use startsWith to match
  /**
   * @param {import('discord.js').ButtonInteraction} interaction
   */
  async handle(interaction) {
    const expenseId = interaction.customId.replace('keihi_reject_', '');
    await interaction.deferUpdate();

    const guildId = interaction.guild.id;
    const state = await readState(guildId);

    const expense = state.expenses.find(e => e.id === expenseId);
    if (!expense || expense.status !== 'pending') {
      return interaction.followUp({ content: 'この申請は既に対応済みか、見つかりませんでした。', ephemeral: true });
    }

    expense.status = 'rejected';
    expense.reviewedBy = interaction.user.id;
    expense.reviewedAt = new Date().toISOString();

    await writeState(guildId, state);

    // Disable buttons on the original message
    interaction.message.components.forEach(row => {
      row.components.forEach(component => component.setDisabled(true));
    });
    const rejectedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(0xED4245) // Red
      .setTitle('❌ 拒否済み')
      .setFooter({ text: `対応者: ${interaction.user.tag} | 経費ID: ${expense.id}` });
    await interaction.editReply({ embeds: [rejectedEmbed], components: interaction.message.components });

    // Notify the user via DM
    const submitter = await interaction.client.users.fetch(expense.userId).catch(() => null);
    if (submitter) {
      await submitter.send(`あなたの経費申請（${expense.amount}円: ${expense.description}）は拒否されました。詳細は管理者にお問い合わせください。`).catch(() => {});
    }
  },
};