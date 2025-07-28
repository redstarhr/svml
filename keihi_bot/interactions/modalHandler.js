// interactions/modalHandler.js
const submit = require('../commands/keihi_setti/submit.js');
const setupForumModal = require('../commands/keihi_setti/setup_create_forum_modal.js');

function timestamp() {
  return new Date().toISOString();
}

module.exports = function handleModal(interaction, client) {
  switch (interaction.customId) {
    case 'expense_apply_modal':
      return submit(interaction, client);
    case 'setup_create_forum_modal':
      return setupForumModal.execute(interaction, client);
    default:
      console.warn(`[${timestamp()}]⚠️ 未対応のモーダル: ${interaction.customId}`);
  }
};
