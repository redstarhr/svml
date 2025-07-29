// syuttaiki_bot/utils/castShift/castStateManager.js

const { readJsonFromGCS, saveJsonToGCS } = require('../../common/gcs/gcsUtils');

function getFilePath(guildId, date) {
  return `cast_attendance/${guildId}/state_${date}.json`;
}

async function loadOrInitState(guildId, date) {
  const filePath = getFilePath(guildId, date);
  let state = await readJsonFromGCS(filePath);
  if (!state) {
    state = {
      workMap: {},  // 例: { '20:00': [ {id:'123', name:'A'} ] }
      leaveMap: {},
      messageId: null,
    };
  }
  return state;
}

async function writeState(guildId, date, data) {
  const filePath = getFilePath(guildId, date);
  await saveJsonToGCS(filePath, data);
}

module.exports = {
  loadOrInitState,
  writeState,
};
