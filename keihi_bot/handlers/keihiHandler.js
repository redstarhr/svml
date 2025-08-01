const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const { updateState } = require('../utils/keihiStateManager');
const logger = require('@common/logger');

// --- Custom IDs ---
const APPLY_BUTTON_ID = 'keihi_apply_start';
const APPLY_MODAL_ID = 'keihi_apply_modal';
const AMOUNT_INPUT_ID = 'keihi_amount_input';
const DESCRIPTION_INPUT_ID = 'keihi_description_input';
const APPROVE_BUTTON_PREFIX = 'keihi_approve_';
const REJECT_BUTTON_PREFIX = 'keihi_reject_';

module.exports = {
  filePath: __filename,

  async execute(interaction) {
    if (interaction.isButton() && interaction.customId.startsWith('keihi_')) {
      if (interaction.customId === APPLY_BUTTON_ID) {
        return this.handleApplyButton(interaction);
      }
      if (interaction.customId.startsWith(APPROVE_BUTTON_PREFIX) || interaction.customId.startsWith(REJECT_BUTTON_PREFIX)) {
        return this.handleApprovalButton(interaction);
      }
    }
    if (interaction.isModalSubmit() && interaction.customId === APPLY_MODAL_ID) {
      return this.handleApplyModalSubmit(interaction);
    }
    return false;
  },

  async handleApplyButton(interaction) {
    const modal = new ModalBuilder()
      .setCustomId(APPLY_MODAL_ID)
      .setTitle('経費申請フォーム');

    const amountInput = new TextInputBuilder()
      .setCustomId(AMOUNT_INPUT_ID)
      .setLabel('金額（半角数字のみ）')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('例: 5000')
      .setRequired(true);

    const descriptionInput = new TextInputBuilder()
      .setCustomId(DESCRIPTION_INPUT_ID)
      .setLabel('経費の内容')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('例: 新規ワールド制作用アセット購入費')
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(amountInput),
      new ActionRowBuilder().addComponents(descriptionInput)
    );

    await interaction.showModal(modal);
    return true;
  },

  async handleApplyModalSubmit(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const amountRaw = interaction.fields.getTextInputValue(AMOUNT_INPUT_ID);
    const description = interaction.fields.getTextInputValue(DESCRIPTION_INPUT_ID);
    const amount = parseInt(amountRaw.replace(/,/g, ''), 10);

    if (isNaN(amount) || amount <= 0) {
      return interaction.editReply({ content: '⚠️ 金額は正の半角数字で入力してください。' });
    }

    const guildId = interaction.guildId;
    const newExpense = {
      id: `${Date.now()}-${interaction.user.id}`,
      userId: interaction.user.id,
      userName: interaction.user.username,
      amount,
      description,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };

    try {
      await updateState(guildId, (state) => {
        state.expenses.push(newExpense);
        return state;
      });

      logger.info(`[KeihiHandler] 新しい経費申請を受け付けました。`, { guildId, userId: interaction.user.id, expenseId: newExpense.id });
      await interaction.editReply({ content: '✅ 経費申請を受け付けました。管理者の承認をお待ちください。' });
    } catch (error) {
      logger.error('[KeihiHandler] 経費申請の保存中にエラーが発生しました。', { error, guildId, userId: interaction.user.id });
      await interaction.editReply({ content: '❌ 申請の処理中にエラーが発生しました。時間をおいて再度お試しください。' });
    }

    return true;
  },

  async handleApprovalButton(interaction) {
    const { customId, user: adminUser, guildId } = interaction;
    const isApprove = customId.startsWith(APPROVE_BUTTON_PREFIX);
    const newStatus = isApprove ? 'approved' : 'rejected';
    const expenseId = customId.replace(isApprove ? APPROVE_BUTTON_PREFIX : REJECT_BUTTON_PREFIX, '');

    await interaction.deferUpdate();

    let targetExpense = null;

    try {
      await updateState(guildId, (state) => {
        const expense = state.expenses.find(e => e.id === expenseId);
        if (!expense || expense.status !== 'pending') {
          targetExpense = null;
          return state;
        }

        targetExpense = expense;
        expense.status = newStatus;
        expense.processedBy = {
          id: adminUser.id,
          username: adminUser.username,
          timestamp: new Date().toISOString(),
        };
        return state;
      });

      if (!targetExpense) {
        return interaction.editReply({ content: 'この申請は既に対応済みか、見つかりませんでした。', components: [] });
      }

      // 更新するEmbedを作成
      const originalEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
      originalEmbed
        .setColor(isApprove ? 0x57F287 : 0xED4245) // 承認は緑、拒否は赤
        .addFields({ name: '処理結果', value: isApprove ? '✅ 承認されました' : '❌ 拒否されました' });

      // ボタンを削除して編集
      await interaction.message.edit({ embeds: [originalEmbed], components: [] });

    } catch (error) {
      logger.error('[KeihiHandler] 承認/拒否処理中にエラーが発生しました。', { error, guildId, userId: adminUser.id });
      try {
        await interaction.followUp({ content: '❌ 処理中にエラーが発生しました。', ephemeral: true });
      } catch {}
    }

    return true;
  },
};
