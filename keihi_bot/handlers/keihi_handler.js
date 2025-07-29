// keihi_bot/handlers/keihi_handler.js

// TODO: 経費Botの各コンポーネントハンドラを実装してインポートします
// const buttonHandler = require('../components/buttons/...');
// const modalHandler = require('../components/modals/...');
// const selectHandler = require('../components/selects/...');

module.exports = {
  /**
   * keihi_bot関連のインタラクションを適切なハンドラに振り分ける
   * @param {import('discord.js').Interaction} interaction
   * @returns {Promise<boolean>} 処理した場合はtrue、しなかった場合はfalse
   */
  async execute(interaction) {
    // このハンドラは 'keihi_' で始まる customId のみを処理します
    if (!interaction.customId || !interaction.customId.startsWith('keihi_')) {
      return false;
    }

    // TODO: ここにボタン、モーダル、セレクトメニューなどの具体的な処理を実装します
    // 例: if (interaction.customId === 'keihi_submit_button') { ... }

    console.warn(`[keihi_handler] Interaction received but no specific handler implemented for: ${interaction.customId}`);
    // 該当する処理がない場合は、エラーメッセージを返信してtrueを返すことで、他のハンドラでの処理を防ぎます
    if (interaction.isRepliable()) {
        await interaction.reply({ content: 'この機能は現在実装中です。', ephemeral: true });
    }
    return true; // このインタラクションは keihi_bot が処理したとマーク
  }
};