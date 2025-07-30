// syuttaiki_bot/index.js
const fs = require('node:fs');
const path = require('node:path');

// --- コマンド ---
const castArrivalPanel = require('./commands/cast-arrival-panel.js');
const castDeparturePanel = require('./commands/cast-departure-panel.js');
const castSettings = require('./commands/cast-settings.js');

// --- コンポーネントハンドラの動的読み込み ---
const componentHandlers = [];
const componentsPath = path.join(__dirname, 'components');

// `components` ディレクトリ内のサブディレクトリを再帰的に探索
function readHandlers(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      readHandlers(fullPath);
    } else if (file.name.endsWith('.js')) {
      componentHandlers.push(require(fullPath));
    }
  }
}
if (fs.existsSync(componentsPath)) readHandlers(componentsPath);

module.exports = {
  commands: [castArrivalPanel, castDeparturePanel, castSettings],
  componentHandlers: componentHandlers,
};