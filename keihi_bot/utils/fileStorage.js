// keihi_bot/utils/fileStorage.js
const { readJsonFromGCS, saveJsonToGCS } = require('@common/gcs/gcsUtils.js');
const { createAndSaveSpreadsheet } = require('@root/keihi_bot/utils/spreadsheet.js');

// ────────── 内部ユーティリティ ──────────
const BASE_PATH = 'keihi';

function getMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * GCS上のデータパスを生成します。
 * @param {string} guildId
 * @param  {...string} pathSegments
 * @returns {string}
 */
function getDataPath(guildId, ...pathSegments) {
    return [guildId, BASE_PATH, ...pathSegments].join('/');
}

// ────────── 経費ログ処理 ──────────

async function appendExpenseLog(guildId, entry) {
  const logFile = getDataPath(guildId, 'logs', `${getMonth()}.json`);
  const logs = await readJsonFromGCS(logFile) ?? [];
  logs.push(entry);
  await saveJsonToGCS(logFile, logs);
}

async function getExpenseEntries(guildId, yearMonth, userId = null) {
  const logFile = getDataPath(guildId, 'logs', `${yearMonth}.json`);
  const list = await readJsonFromGCS(logFile) ?? [];
  return userId ? list.filter(e => e.userId === userId) : list;
}

async function getFirstEntryWithLinks(guildId, yearMonth, userId) {
  const entries = await getExpenseEntries(guildId, yearMonth, userId);
  return entries.find(e => e.threadMessageId || e.spreadsheetUrl) || null;
}

// ────────── スプレッドシート関連 ──────────

async function getSpreadsheetUrl(guildId, yearMonth) {
  const logFile = getDataPath(guildId, 'logs', `${yearMonth}.json`);
  const entries = await readJsonFromGCS(logFile) ?? [];
  const entry = entries.find(e => e.spreadsheetUrl);
  return entry?.spreadsheetUrl || null;
}

async function getOrCreateSpreadsheetUrl(guildId, yearMonth) {
  const existing = await getSpreadsheetUrl(guildId, yearMonth);
  if (existing) return existing;

  const logFile = getDataPath(guildId, 'logs', `${yearMonth}.json`);
  const entries = await readJsonFromGCS(logFile) ?? [];

  if (!entries.length) return null;

  const newUrl = await createAndSaveSpreadsheet(guildId, yearMonth, entries);
  if (!newUrl) return null; // スプレッドシート作成失敗

  for (const entry of entries) {
    entry.spreadsheetUrl = newUrl;
  }

  await saveJsonToGCS(logFile, entries);
  return newUrl;
}

// ────────── ロール設定関連 ──────────

async function setApproverRoles(guildId, roles) {
  const configFile = getDataPath(guildId, 'config.json');
  const config = await readJsonFromGCS(configFile) ?? {};
  config.approverRoles = roles;
  await saveJsonToGCS(configFile, config);
}

async function setVisibleRoles(guildId, roles) {
  const configFile = getDataPath(guildId, 'config.json');
  const config = await readJsonFromGCS(configFile) ?? {};
  config.visibleRoles = roles;
  await saveJsonToGCS(configFile, config);
}

// ────────── エクスポート ──────────

module.exports = {
  appendExpenseLog,
  getExpenseEntries,
  getFirstEntryWithLinks,
  getSpreadsheetUrl,
  getOrCreateSpreadsheetUrl,
  setApproverRoles,
  setVisibleRoles
};
