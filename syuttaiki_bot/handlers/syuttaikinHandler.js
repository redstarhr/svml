// handlers/syuttaikinHandler.js

// ボタンハンドラ
const arrivalTimeButton = require('../components/buttons/arrivalTimeButton');
const departureTimeButton = require('../components/buttons/departureTimeButton');
const arrivalTimeDeleteButton = require('../components/buttons/arrival_time_delete_button');
const roleSelectButton = require('../components/buttons/roleSelectButton');

// セレクトメニューハンドラ
const arrivalTimeUserSelect = require('../components/selects/arrivalTimeUserSelect');
const departureTimeUserSelect = require('../components/selects/departureTimeUserSelect');
const arrivalTimeDeleteSelect = require('../components/selects/arrival_time_delete_select');
const notifyLogChannelSelect = require('../components/selects/log_channel_select');

// モーダルハンドラ
const arrivalTimeRegisterModal = require('../components/modals/arrival_time_register_modal');
const arrivalTimeRegisterSubmit = require('../components/modals/arrival_time_register_submit');
const departureTimeRegisterModal = require('../components/modals/departure_time_register_modal');
const departureTimeRegisterSubmit = require('../components/modals/departure_time_register_submit');

/**
 * interactionのcustomIdに合致するハンドラを配列から取得する
 * @param {Array<{customId: string, handle: Function}>} handlers
 * @param {string} customId
 * @returns {object|null}
 */
function findHandler(handlers, customId) {
  return handlers.find(h => customId.startsWith(h.customId)) || null;
}

/**
 * 出退勤インタラクションハンドラ
 * @param {import('discord.js').Interaction} interaction
 */
module.exports = async function syuttaikinHandler(interaction) {
  if (interaction.isButton()) {
    const handler = findHandler(
      [
        arrivalTimeButton,
        departureTimeButton,
        arrivalTimeDeleteButton,
        roleSelectButton,
      ],
      interaction.customId
    );
    if (handler) return handler.handle(interaction);
  }

  if (interaction.isStringSelectMenu()) {
    const handler = findHandler(
      [
        arrivalTimeUserSelect,
        departureTimeUserSelect,
        arrivalTimeDeleteSelect,
        notifyLogChannelSelect,
      ],
      interaction.customId
    );
    if (handler) return handler.handle(interaction);
  }

  if (interaction.isModalSubmit()) {
    const handler = findHandler(
      [
        arrivalTimeRegisterModal,
        arrivalTimeRegisterSubmit,
        departureTimeRegisterModal,
        departureTimeRegisterSubmit,
      ],
      interaction.customId
    );
    if (handler) return handler.handle(interaction);
  }
};
