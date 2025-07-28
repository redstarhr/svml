// test/keihi_spec.js

const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const {
  appendExpenseLog,
  getExpenseEntries,
  deleteExpenseEntry,
  updateApprovalStatus
} = require('../utils/fileStorage.js');

describe('経費申請Bot ログ処理', function () {
  const guildId = 'test-guild-id';
  const yearMonth = '2025-07';
  const baseDir = path.join(__dirname, '..', 'data', guildId);
  const logPath = path.join(baseDir, `keihi_${yearMonth}.json`);

  const dummyLog = {
    userId: '1234567890',
    userName: 'テストユーザー',
    item: '交通費',
    amount: 2000,
    detail: '打ち合わせ',
    timestamp: new Date().toISOString(),
    threadMessageId: 'thread-msg-001',
    approvedBy: []
  };

  beforeEach(() => {
    // 初期化
    fs.mkdirSync(baseDir, { recursive: true });
    fs.writeFileSync(logPath, JSON.stringify([], null, 2));
  });

  it('申請をログに追加できる', () => {
    appendExpenseLog(guildId, yearMonth, dummyLog);

    const logs = getExpenseEntries(guildId, yearMonth);
    expect(logs).to.be.an('array');
    expect(logs).to.have.lengthOf(1);
    expect(logs[0]).to.include({ item: '交通費', amount: 2000 });
  });

  it('承認状態を更新できる', () => {
    appendExpenseLog(guildId, yearMonth, dummyLog);

    const updated = updateApprovalStatus(guildId, yearMonth, 'thread-msg-001', 'user-hr1', '承認者A');
    expect(updated).to.be.an('array');
    expect(updated[0]).to.deep.include({ userId: 'user-hr1', username: '承認者A' });
  });

  it('申請を削除できる', () => {
    appendExpenseLog(guildId, yearMonth, dummyLog);

    const deleted = deleteExpenseEntry(guildId, yearMonth, 'thread-msg-001');
    expect(deleted).to.be.true;

    const logs = getExpenseEntries(guildId, yearMonth);
    expect(logs).to.have.lengthOf(0);
  });

  afterEach(() => {
    // テストファイルを削除
    if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
    if (fs.existsSync(baseDir) && fs.readdirSync(baseDir).length === 0) {
      fs.rmdirSync(baseDir);
    }
  });
});
