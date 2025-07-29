// keihi_bot/index.js

/**
 * keihi_botのコマンドとイベントハンドラモジュールをまとめてエクスポートします。
 * これにより、Botのメインファイルから各機能を一元的に管理しやすくなります。
 */

// --- コマンド ---
const keihiConfig = require('./commands/keihi_config.js');
const keihiEmbed = require('./commands/keihi_embed.js');
const keihiRireki = require('./commands/keihi_rireki.js');
const keihiSetti = require('./commands/keihi_setti.js');

// --- イベントハンドラ ---
const keihiHandler = require('./handlers/keihi_handler.js');

module.exports = {
  keihiConfig,
  keihiEmbed,
  keihiRireki,
  keihiSetti,
  keihiHandler,
};