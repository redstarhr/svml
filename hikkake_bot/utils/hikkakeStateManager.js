// hikkake_bot/utils/hikkakeStateManager.js

const { Storage } = require('@google-cloud/storage');
const path = require('path');

const bucketName = 'data-svml'; // 固定
const basePath = 'hikkake';     // フォルダ構成: hikkake/<GUILD_ID>/state.json

const storage = new Storage();

function getFilePath(guildId) {
  return `${basePath}/${guildId}/state.json`;
}

function getDefaultState() {
  return {
    panelMessages: {
      quest: { statusMessageId: null, ordersMessageId: null, channelId: null },
      tosu: { statusMessageId: null, ordersMessageId: null, channelId: null },
      horse: { statusMessageId: null, ordersMessageId: null, channelId: null },
    },
    staff: {
      quest: { pura: 0, kama: 0 },
      tosu: { pura: 0, kama: 0 },
      horse: { pura: 0, kama: 0 },
    },
    orders: {
      quest: [],
      tosu: [],
      horse: [],
    },
    hikkakeLogThreads: {
      quest: {}, // { 'YYYYMM': 'threadId' }
      tosu: {},
      horse: {},
    },
  };
}

function ensureStateStructure(state) {
  const types = ['quest', 'tosu', 'horse'];

  if (!state.panelMessages) state.panelMessages = {};
  if (!state.staff) state.staff = {};
  if (!state.orders) state.orders = {};
  if (!state.hikkakeLogThreads || !state.hikkakeLogThreads.quest) { // Check for old structure
    state.hikkakeLogThreads = { quest: {}, tosu: {}, horse: {} };
  }

  for (const type of types) {
    if (!state.panelMessages[type] || typeof state.panelMessages[type].statusMessageId === 'undefined') {
      state.panelMessages[type] = { statusMessageId: null, ordersMessageId: null, channelId: null };
    }
    if (!state.staff[type]) state.staff[type] = { pura: 0, kama: 0 };
    if (!Array.isArray(state.orders[type])) state.orders[type] = [];
    if (!state.hikkakeLogThreads[type]) state.hikkakeLogThreads[type] = {};
  }

  // --- Data Migration: Convert old `counts` to new `staff` ---
  if (state.counts) {
    for (const type of types) {
      if (state.counts[type]) {
        state.staff[type] = { pura: state.counts[type].pura || 0, kama: state.counts[type].kama || 0 };
      }
    }
    delete state.counts; // Remove old structure
  }

  // --- Data Migration: Convert old log channel structure ---
  if (state.hikkakeLogChannelId || state.logChannels || state.logs) {
    delete state.hikkakeLogChannelId;
    delete state.logChannels;
    delete state.logs; // Old thread ID structure is also deprecated
  }

  return state;
}

async function readState(guildId) {
  const file = storage.bucket(bucketName).file(getFilePath(guildId));
  try {
    const [contents] = await file.download();
    const rawState = JSON.parse(contents.toString());
    return ensureStateStructure(rawState);
  } catch (e) {
    // ファイルが存在しないエラー(404)は初回起動時の正常な動作なので、それ以外を警告として扱う
    if (e.code !== 404) {
      console.warn(`[GCS] state読み込み失敗: ${getFilePath(guildId)} - ${e.message}`);
    } else {
      console.log(`[GCS] 初期state作成: ${getFilePath(guildId)}`);
    }
    return getDefaultState();
  }
}

async function writeState(guildId, stateData) {
  const file = storage.bucket(bucketName).file(getFilePath(guildId));
  await file.save(JSON.stringify(stateData, null, 2));
}

module.exports = {
  readState,
  writeState,
  ensureStateStructure,
  getDefaultState,
};
