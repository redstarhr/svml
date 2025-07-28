const { readJSON, writeJSON, ensureDirectory } = require('../../fileHelper');
const path = require('path');
const { Storage } = require('@google-cloud/storage');

const bucketName = 'data-svml';
const storage = new Storage();

async function getStateFilePath(guildId, date) {
  return `cast_shift/${guildId}/${date}_出退勤.json`;
}

async function loadOrInitState(guildId, date, channelId) {
  const filePath = await getStateFilePath(guildId, date);

  try {
    const [file] = await storage.bucket(bucketName).file(filePath).download();
    return JSON.parse(file.toString());
  } catch (err) {
    const defaultState = {
      channelId,
      messageId: null,
      shifts: {}, // 例：{ "20:00": ["userId1"], "20:30": ["userId2"] }
      leaves: {}, // 例：{ "userId1": "21:00" }
    };
    await saveState(guildId, date, defaultState);
    return defaultState;
  }
}

async function saveState(guildId, date, data) {
  const filePath = await getStateFilePath(guildId, date);
  await storage.bucket(bucketName).file(filePath).save(JSON.stringify(data));
}

module.exports = {
  loadOrInitState,
  saveState,
};
