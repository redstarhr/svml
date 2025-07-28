const buttonHandlers = [
  require('./buttons/syussinTimeButton'),
  require('./buttons/taikinTimeButton'),
  // 他のボタンもここに
];

const selectHandlers = [
  require('./selects/syussinUserSelect'),
  require('./selects/taikinUserSelect'),
  require('./selects/notifyChannelSelect'),
  // 他のセレクトもここに
];

const modalHandlers = [
  require('./modals/syussinTimeAddModal'),
  require('./modals/taikinTimeAddModal'),
  // 他のモーダルもここに
];

async function handleSyuttaikinComponent(interaction) {
  if (interaction.isButton()) {
    const handler = buttonHandlers.find(h => h.customId === interaction.customId || interaction.customId.startsWith(h.customId + ':'));
    if (handler) return await handler.handle(interaction);
  }

  if (interaction.isStringSelectMenu()) {
    const handler = selectHandlers.find(h => h.customId === interaction.customId);
    if (handler) return await handler.handle(interaction);
  }

  if (interaction.isModalSubmit()) {
    const handler = modalHandlers.find(h => interaction.customId.startsWith(h.customId));
    if (handler) return await handler.handle(interaction);
  }
}

module.exports = { handleSyuttaikinComponent };
