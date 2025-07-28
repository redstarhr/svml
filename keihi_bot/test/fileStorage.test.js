const fs = require('fs');
const path = require('path');
const { expect } = require('chai');

const {
  appendExpenseLog,
  getExpenseEntries,
  updateApprovalStatus,
  deleteExpenseEntry
} = require('../utils/fileStorage.js');

const TEST_GUILD_ID = 'test-guild';
const TEST_YEAR_MONTH = '2099-12'; // ダミーの未来日で競合防止

const testEntry = {
  userId: 'user123',
  userName: 'TestUser',
  item: 'テスト品目',
  amount: 1000,
  detail: 'テスト用',
  timestamp: new Date().toISOString(),
  threadMessageId: 'msg123',
  approvedBy: []
};

describe('fileStorage.js ユニットテスト', () => {

  beforeEach(() => {
    // ✅ 各テスト前に fresh なログを作成
    appendExpenseLog(TEST_GUILD_ID, TEST_YEAR_MONTH, { ...testEntry });
  });

  after(() => {
    // ✅ テスト後にファイルを削除
    const logPath = path.join(__dirname, '..', 'data', 'keihi', TEST_GUILD_ID, 'logs', `${TEST_YEAR_MONTH}.json`);
    if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
  });

  it('appendExpenseLog: 正しくログに追加できること', () => {
    const result = getExpenseEntries(TEST_GUILD_ID, TEST_YEAR_MONTH);
    expect(result).to.be.an('array');
    expect(result[0]).to.include({ item: 'テスト品目', amount: 1000 });
  });

  it('updateApprovalStatus: 承認者の記録が追加されること', () => {
    const approved = updateApprovalStatus(TEST_GUILD_ID, TEST_YEAR_MONTH, 'msg123', 'approver001', '承認者1');
    expect(approved).to.be.an('array');
    expect(approved.find(u => u.userId === 'approver001')).to.exist;
  });

  it('updateApprovalStatus: 存在しないメッセージIDには何もしない', () => {
    const result = updateApprovalStatus(TEST_GUILD_ID, TEST_YEAR_MONTH, 'invalid-id', 'userX', '名前X');
    expect(result).to.be.null;
  });

  it('deleteExpenseEntry: 対象の申請が削除されること', () => {
    const deleted = deleteExpenseEntry(TEST_GUILD_ID, TEST_YEAR_MONTH, 'msg123');
    expect(deleted).to.be.true;

    const entries = getExpenseEntries(TEST_GUILD_ID, TEST_YEAR_MONTH);
    const found = entries.find(entry => entry.threadMessageId === 'msg123');
    expect(found).to.be.undefined;
  });
});


