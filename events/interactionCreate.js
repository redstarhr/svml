const { Events } = require('discord.js');

// 各機能のindex.jsからハンドラを読み込むことで、パスの変更に強くなります
const { hikkakeHandler } = require('../hikkake_bot');
const { uriageHandler } = require('../uriage_bot');
// const { keihiHandler } = require('../keihi_bot'); // TODO: keihi_botも同様の構造に修正後に有効化

// キャスト出勤管理のハンドラ読み込み
// const syuttaikinHandler = require(path.join(__dirname, '..', 'syuttaiki_bot', 'handlers', 'syuttaikinHandler.js'));

// この順番で処理を試みる
const componentHandlers = [
    hikkakeHandler,
    uriageHandler,
    // keihiHandler,
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

      const errorMessage = { content: 'コマンドの実行中にエラーが発生しました。', ephemeral: true };

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
