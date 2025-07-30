// hikkake_bot/index.js
const hikkakeSetup = require('./commands/hikkakeSetup.js');
const hikkakeAdmin = require('./commands/hikkakeAdmin.js');

// Component Handlers
const panelActionHandler = require('./handlers/panelActionHandler.js');
const reactionSettingHandler = require('./handlers/reactionSettingHandler.js');
const reactionDeleteHandler = require('./handlers/reactionDeleteHandler.js');

// Main hikkake feature handlers (replaces the old hikkake_handler.js)
const hikkakeEnterButtonHandler = require('./handlers/hikkakeEnterButtonHandler.js');
const hikkakeLeaveButtonHandler = require('./handlers/hikkakeLeaveButtonHandler.js');
const hikkakeOrderButtonHandler = require('./handlers/hikkakeOrderButtonHandler.js');
const hikkakeOrderModalHandler = require('./handlers/hikkakeOrderModalHandler.js');
const hikkakeCompleteOrderButtonHandler = require('./handlers/hikkakeCompleteOrderButtonHandler.js');
const hikkakeCancelOrderButtonHandler = require('./handlers/hikkakeCancelOrderButtonHandler.js');
const hikkakeDeleteOrderButtonHandler = require('./handlers/hikkakeDeleteOrderButtonHandler.js');

module.exports = {
  commands: [
    hikkakeSetup,
    hikkakeAdmin,
  ],
  componentHandlers: [
    panelActionHandler,
    reactionSettingHandler,
    reactionDeleteHandler,
    hikkakeEnterButtonHandler,
    hikkakeLeaveButtonHandler,
    hikkakeOrderButtonHandler,
    hikkakeOrderModalHandler,
    hikkakeCompleteOrderButtonHandler,
    hikkakeCancelOrderButtonHandler,
    hikkakeDeleteOrderButtonHandler,
  ],
};