const { Storage } = require('@google-cloud/storage');
const path = require('path');
const storage = new Storage();
const BUCKET_NAME = 'data-svml';

async function writeState(guildId, date, data) {
  const filePath = `cast_attendance/${guildId}/state_${date}.json`;
  const file = storage.bucket(BUCKET_NAME).file(filePath);
  await file.save(JSON.stringify(data, null, 2), { contentType: 'application/json' });
}

module.exports = { writeState };
