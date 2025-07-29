// keihi_bot/components/modals/keihi_submit_modal.js
const { MessageFlags } = require('discord.js');
const { readState, writeState } = require('../../utils/keihiStateManager');

module.exports = {
  customId: 'keihi_submit_modal',
  /**
   * @param {import('discord.js').ModalSubmitInteraction} interaction
   */
  async handle(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const amountRaw = interaction.fields.getTextInputValue('keihi_amount');
    const description = interaction.fields.getTextInputValue('keihi_description');
    const amount = parseInt(amountRaw, 10);

    if (isNaN(amount) || amount <= 0) {
      return interaction.editReply({ content: '❌ 金額は正の整数で入力してください。' });
    }

    const guildId = interaction.guildId;
    const state = await readState(guildId);

    const newExpense = {
      id: `${Date.now()}-${interaction.user.id}`,
      userId: interaction.user.id,
      userName: interaction.user.username,
      amount: amount,
      description: description,
      status: 'pending', // 'pending', 'approved', 'rejected'
      submittedAt: new Date().toISOString(),
      reviewedBy: null,
      reviewedAt: null,
    };

    state.expenses.push(newExpense);
    await writeState(guildId, state);

    // TODO: Send a notification to a configured admin/log channel.

    await interaction.editReply({
      content: `✅ 経費申請を受け付けました。\n\n**金額:** ${amount.toLocaleString()}円\n**内容:** ${description}\n\n管理者の承認をお待ちください。`,
    });
  },
};