// interactions/selectMenuHandler.js

function timestamp() {
  return new Date().toISOString();
}

// 将来の `/経費申請履歴` 選択などに対応
module.exports = function handleSelectMenu(interaction, client) {
  switch (interaction.customId) {
    // 例: case 'history_select':
    //   return handleHistorySelect(interaction, client);

    default:
      console.warn(`[${timestamp()}] ⚠️ 未対応のセレクトメニュー: ${interaction.customId}`);
  }
};
