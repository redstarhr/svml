const fs = require('fs');
const path = require('path');

/**
 * commands フォルダを再帰的に読み込み
 * 
 * @param {string} commandsPath - 読み込むディレクトリ
 * @param {Object} options
 * @param {string} [options.mode='index'] - ログ出力用
 * @param {boolean} [options.toJSON=false] - toJSONで返すか（deploy用）
 * @returns {Array<Object>} - コマンド配列
 */
function loadCommands(commandsPath, { mode = 'index', toJSON = false } = {}) {
  const commands = [];

  const entries = fs.readdirSync(commandsPath, { withFileTypes: true });

  for (const entry of entries) {
    const subdir = path.join(commandsPath, entry.name);

    if (!entry.isDirectory()) continue;

    const files = fs.readdirSync(subdir).filter(f => f.endsWith('.js'));

    for (const file of files) {
      const fullPath = path.join(subdir, file);
      try {
        // 開発時のキャッシュクリア（必要に応じて）
        delete require.cache[require.resolve(fullPath)];

        const command = require(fullPath);
        const commandData = command.default ?? command;

        // スラッシュコマンドでなければスキップして警告を出す
        if (!commandData?.data?.name || typeof commandData.execute !== 'function') {
          console.warn(`⚠️ [${mode}] スキップ: ${entry.name}/${file}（スラッシュコマンドではない）`);
          continue;
        }

        const result = toJSON ? commandData.data.toJSON() : commandData;
        commands.push(result);

        console.log(`✅ [${mode}] コマンド読み込み: ${entry.name}/${file}`);
      } catch (err) {
        console.error(`❌ [${mode}] 読み込み失敗 (${file}):`, err.message);
      }
    }
  }

  return commands;
}

module.exports = loadCommands;
