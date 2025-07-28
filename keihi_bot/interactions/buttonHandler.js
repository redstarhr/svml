// interactions/buttonHandler.js
const apply = require('../commands/keihi_setti/apply.js');
const approve = require('../commands/keihi_setti/approve.js');
const cancel = require('../commands/keihi_setti/cancel.js');

function timestamp() {
  return new Date().toISOString();
}

module.exports = function handleButton(interaction, client) {
  switch (interaction.customId) {
    case 'apply':
      return apply.execute(interaction, client);
    case 'approve_button':
      return approve(interaction, client);
    case 'cancel_button':
      return cancel(interaction, client);
    default:
      console.warn(`[${timestamp()}] ⚠️ 未対応のボタン: ${interaction.customId}`);
  }
};
