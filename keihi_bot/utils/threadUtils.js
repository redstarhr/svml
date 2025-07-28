// utils/threadUtils.js

/**
 * 経費申請スレッド名を 500 件ごとに分割して生成する。
 * 例: "経費申請-2025-07(1~500)", "経費申請-2025-07(501~1000)"
 *
 * @param {string} baseName - ベースとなるスレッド名（例: 経費申請-2025-07）
 * @param {number} count - 現在の申請件数（この数に基づき範囲を決定）
 * @returns {string} スレッド名
 */
function getThreadName(baseName, count) {
  const chunkSize = 500;

  if (typeof baseName !== 'string') {
    throw new TypeError('baseName must be a string');
  }

  baseName = baseName.trim();
  if (!baseName) {
    throw new Error('baseName must not be empty');
  }

  if (typeof count !== 'number' || count < 0) count = 0;

  const start = Math.floor(count / chunkSize) * chunkSize + 1;
  const end = start + chunkSize - 1;

  return `${baseName}(${start}~${end})`;
}

module.exports = {
  getThreadName
};
