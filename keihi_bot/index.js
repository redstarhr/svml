// keihi_bot/index.js

/**
 * keihi_botのコマンドとイベントハンドラモジュールをまとめてエクスポートします。
 * これにより、Botのメインファイルから各機能を一元的に管理しやすくなります。
 *
 * hikkake_botやuriage_botとは異なり、keihi_botはインタラクションを
 * `events/interactionCreate.js` で一括して処理する設計になっています。
 */

// --- コマンド ---
const keihiConfig = require('./commands/keihi_config.js');
const keihiEmbed = require('./commands/keihi_embed.js');
const keihiRireki = require('./commands/keihi_rireki.js');
const keihiSetti = require('./commands/keihi_setti.js');

// --- イベントハンドラ ---
const interactionCreateHandler = require('./events/interactionCreate.js');
const readyHandler = require('./events/ready.js');

module.exports = {
  keihiConfig,
  keihiEmbed,
  keihiRireki,
  keihiSetti,
  interactionCreateHandler,
  readyHandler,
};