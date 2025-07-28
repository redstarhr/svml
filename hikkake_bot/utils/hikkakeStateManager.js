// hikkake_bot/utils/hikkakeStateManager.js

const { readJsonFromGCS, saveJsonToGCS } = require('../../utils/gcs');
const path = require('path');

const basePath = 'hikkake';     // フォルダ構成: hikkake/<GUILD_ID>/state.json

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
  const filePath = getFilePath(guildId);
  try {
    const rawState = await readJsonFromGCS(filePath);
    if (rawState === null) {
      console.log(`[GCS] 初期state作成: ${filePath}`);
      return getDefaultState();
    }
    return ensureStateStructure(rawState);
  } catch (e) {
    // readJsonFromGCSがnull以外のエラーをスローした場合
    console.warn(`[GCS] state読み込みで予期せぬエラー: ${filePath} - ${e.message}`);
    // 念のためデフォルトステートを返す
    return getDefaultState();
  }
}

async function writeState(guildId, stateData) {
  const filePath = getFilePath(guildId);
  await saveJsonToGCS(filePath, stateData);
}

module.exports = {
  readState,
  writeState,
  ensureStateStructure,
  getDefaultState,
};
