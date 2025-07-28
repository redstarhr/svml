// constants/messages.js

const MESSAGES = {
  // ───── 経費申請関連 ─────
  APPLY: {
    SUCCESS: '✅ 経費申請を受け付けました。',
    CANCELLED: '🚫 経費申請を取り消しました。',
    TIMEOUT: '⏱️ モーダル入力がタイムアウトしました。'
  },

  // ───── 承認関連 ─────
  APPROVE: {
    SUCCESS: (count, total, users) =>
      `✅ 承認済み (${count}/${total}): ${users.join(', ')}`,
    NO_ROLE: '⚠️ 承認ロールが設定されていません。',
    NO_PERMISSION: '⛔ あなたは承認権限を持っていません。',
    FAIL_UPDATE: '⚠️ 承認処理に失敗しました。'
  },

  // ───── スレッド関連 ─────
  THREAD: {
    NOT_FOUND: '⚠️ 対応するスレッドが見つかりませんでした。',
    HEADER: '📋 経費申請をする場合は以下のボタンを押してください。\n承認者には「承認」ボタンが表示されます。'
  },

  // ───── 履歴関連 ─────
  HISTORY: {
    FILE_NOT_FOUND: '📁 経費申請の履歴ファイルが見つかりませんでした。',
    SELECT_PROMPT: '📅 確認したい年月を選択してください：',
    NONE_FOUND: (yearMonth) => `📂 ${yearMonth} に申請された履歴は見つかりませんでした。`,
    SHOWN: (yearMonth) => `✅ ${yearMonth} の履歴を表示しました（スレッド参照）。`
  },

  // ───── 承認ロール関連 ─────
  ROLE: {
    SET: (roleMentions) => `✅ 承認ロールを設定しました：${roleMentions}`,
    PROMPT: '✅ 承認ロールを選択してください（複数選択可）',
    TIMEOUT: '⏱️ タイムアウトしました。もう一度コマンドを実行してください。'
  },

  // ───── 共通・一般 ─────
  GENERAL: {
    ERROR: '⚠️ エラーが発生しました。管理者にお問い合わせください。',
    NOT_TEXT_CHANNEL: 'このコマンドはテキストチャンネルでのみ使用できます。'
  }
};

module.exports = MESSAGES;
