const { Events, MessageFlags } = require('discord.js');

// 各機能のindex.jsからハンドラを読み込むことで、パスの変更に強くなります
const { hikkakeHandler } = require('../hikkake_bot');
const { uriageHandler } = require('../uriage_bot');
const { syuttaikinHandler, castShiftHandler } = require('../syuttaiki_bot');
const { keihiHandler } = require('../keihi_bot');
const { levelHandler } = require('../level_bot');

// この順番で処理を試みる
const componentHandlers = [
    hikkakeHandler,
    uriageHandler,
    syuttaikinHandler,
    castShiftHandler,
    keihiHandler,
    levelHandler,
].filter(Boolean); // 未定義のハンドラを除外

module.exports = {
  name: Events.InteractionCreate,
  /**
   * すべてのインタラクションをここで受け取り、適切な処理に振り分けます。
   * @param {import('discord.js').Interaction} interaction
   * @param {import('discord.js').Client} client
   */
  async execute(interaction, client) {
    try {
      // スラッシュコマンドの処理
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) {
          console.error(`❌ コマンドが見つかりません: ${interaction.commandName}`);
          return;
        }
        await command.execute(interaction, client);
        return;
      }

      // コマンド以外のインタラクション（ボタン、モーダル等）
      for (const handler of componentHandlers) {
        // ハンドラが処理できたらtrueを返すので、そこでループを抜ける
        if (await handler.execute(interaction, client)) {
          return;
        }
      }
    } catch (error) {
      console.error(`❌ インタラクション処理中にエラーが発生しました (ID: ${interaction.customId || interaction.commandName}):`, error);

      const errorMessage = { content: 'コマンドの実行中にエラーが発生しました。', flags: [MessageFlags.Ephemeral] };

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      } catch (replyError) {
        console.error('❌ エラーメッセージの返信に失敗しました:', replyError);
      }
    }
  },
};
