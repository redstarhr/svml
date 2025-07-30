// syuttaiki_bot/index.js
const fs = require('node:fs');
const path = require('node:path');

// --- コマンド ---
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        commands.push(require(filePath));
    }
}

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
  commands: commands,
  componentHandlers: componentHandlers,
};