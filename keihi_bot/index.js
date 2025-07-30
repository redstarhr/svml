// keihi_bot/index.js

const keihisetti = require('./commands/keihi_setti.js');
const keihicsv = require('./commands/keihicsv.js');
const keihiconfig = require('./commands/keihi_config.js');
const keihiembed = require('./commands/keihi_embed.js');
const keihihelp = require('./commands/keihi_help.js');
const keihirireki = require('./commands/keihi_rireki.js');

module.exports = {
  // プレースホルダーの keihishinseisetti.js は読み込み対象から除外
  commands: [
    keihisetti,
    keihicsv,
    keihiconfig,
    keihiembed,
    keihihelp,
    keihirireki,
  ],
};