// keihi_bot/utils/keihiStateManager.js
const StateManager = require('@common/utils/stateManager');

const STATE_FILE_PATH = (guildId) => `data-svml/${guildId}/keihi/state.json`;

const defaultState = {
  approverRoles: [],
  visibleRoles: [],
  expenses: [], // { id, userId, userName, amount, description, submittedAt, status, processedBy }
};

const manager = new StateManager(STATE_FILE_PATH, defaultState, 'keihi');

module.exports = {
  readState: (guildId) => manager.readState(guildId),
  writeState: (guildId, state) => manager.writeState(guildId, state),
  updateState: (guildId, updateFn) => manager.updateState(guildId, updateFn),
  defaultState,
};