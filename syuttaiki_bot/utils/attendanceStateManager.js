const { saveJsonToGCS } = require('../../common/gcs/gcsUtils');

async function writeState(guildId, date, data) {
  const filePath = `cast_attendance/${guildId}/state_${date}.json`;
  await saveJsonToGCS(filePath, data);
}

module.exports = { writeState };
