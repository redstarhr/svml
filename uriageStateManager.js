// uriage_bot/utils/uriageStateManager.js
const StateManager = require('@common/utils/stateManager');

const STATE_FILE_PATH = (guildId) => `data-svml/${guildId}/uriage/state.json`;

const defaultState = {
  approvalRoleIds: [],
};

const manager = new StateManager(STATE_FILE_PATH, defaultState, 'uriage');

module.exports = {
  readState: (guildId) => manager.readState(guildId),
  writeState: (guildId, state) => manager.writeState(guildId, state),
  updateState: (guildId, updateFn) => manager.updateState(guildId, updateFn),
  defaultState,
};