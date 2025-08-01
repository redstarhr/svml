// keihi_bot/handlers/keihiHandler.js
const logger = require('@common/logger');

module.exports = {
  // このハンドラが処理するインタラクションを特定するためのプロパティ。
  // 例えば、customIdが 'keihi_' で始まるボタンやセレクトメニューを処理する場合：
  // customId: /^keihi_/,
  filePath: __filename,
  async execute(interaction) {
    // このハンドラが処理すべきインタラクションでなければ false を返す
    // if (!interaction.customId.startsWith('keihi_')) return false;

    // 処理が完了したら true を返す。現時点では何も処理しないため false を返す。
    return false;
  },
};