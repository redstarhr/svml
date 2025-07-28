// utils/spreadsheet.js
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { getOrCreateGuildFolder } = require('./driveUtils.js');
require('dotenv').config();

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive'
];

const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../../credentials.json');
const TOKEN_PATH = path.join(__dirname, '../../token.json');

let sheetsClient = null;
let authClient = null;

// ─────────── 初期認証 ───────────
async function authorize() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  oAuth2Client.setCredentials(token);

  authClient = oAuth2Client;
  sheetsClient = google.sheets({ version: 'v4', auth: oAuth2Client });
}

async function initSheets() {
  if (!sheetsClient || !authClient) await authorize();
}

// ─────────── スプレッドシート作成（旧 spreadsheet.js 相当）───────────
async function createAndSaveSpreadsheet(guildId, yearMonth, entries) {
  await initSheets();
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  const drive = google.drive({ version: 'v3', auth: authClient });

  const folderId = await getOrCreateGuildFolder(guildId);
  const sheetTitle = `経費申請_${guildId}_${yearMonth}`;

  const createRes = await sheets.spreadsheets.create({
    resource: {
      properties: { title: sheetTitle },
      sheets: [{ properties: { title: '申請履歴' } }]
    },
    fields: 'spreadsheetId'
  });

  const spreadsheetId = createRes.data.spreadsheetId;

  // フォルダへ移動
  await drive.files.update({
    fileId: spreadsheetId,
    addParents: folderId,
    fields: 'id, parents'
  });

  // 公開設定
  await drive.permissions.create({
    fileId: spreadsheetId,
    requestBody: {
      role: 'reader',
      type: 'anyone'
    }
  });

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  // データ行生成
  const rows = [['ユーザー名', '日時', '経費項目', '金額', '詳細', '承認状況']];

  for (const e of entries) {
    const approved = e.approvedBy?.length
      ? `承認 (${e.approvedBy.length})：${e.approvedBy.map(a => a.username).join(', ')}`
      : '未承認';

    rows.push([
      e.userName || '不明',
      e.timestamp || '',
      e.item || '',
      e.amount ?? '',
      e.detail || '',
      approved
    ]);
  }

  const total = entries.reduce((sum, e) => sum + (e.amount || 0), 0);
  rows.push([]);
  rows.push(['合計', '', '', total, '', `件数: ${entries.length}`]);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: '申請履歴!A1',
    valueInputOption: 'RAW',
    resource: { values: rows }
  });

  return spreadsheetUrl;
}

// ─────────── 単発エントリ追加（旧 appendEntry）───────────
async function appendEntry(spreadsheetId, entry) {
  await initSheets();

  const values = [[
    entry.username,
    entry.timestamp || '',
    entry.item,
    entry.amount,
    entry.detail,
    entry.approvalStatus
  ]];

  await sheetsClient.spreadsheets.values.append({
    spreadsheetId,
    range: '申請履歴!A1',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: { values }
  });
}

// ─────────── エクスポート ───────────
module.exports = {
  initSheets,
  createAndSaveSpreadsheet,
  appendEntry
};
