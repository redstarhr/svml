// hikkake_bot/index.js
const hikkakeSetup = require('./commands/hikkakeSetup.js');
const hikkakeAdmin = require('./commands/hikkakeAdmin.js');
const hikkakeHandler = require('./handlers/hikkake_handler.js');

module.exports = {
  commands: [
    hikkakeSetup,
    hikkakeAdmin,
  ],
  // hikkake_botに関するすべてのコンポーネントインタラクションをこのハンドラで処理
  componentHandlers: [hikkakeHandler],
};