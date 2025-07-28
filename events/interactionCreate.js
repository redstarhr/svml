const { Events } = require('discord.js');
const path = require('path');

// 各機能のインタラクションハンドラを読み込む
const hikkakeHandler = require(path.join(__dirname, '..', 'hikkake_bot', 'components', 'hikkake_handler.js'));
const uriageHandler = require(path.join(__dirname, '..', 'uriage_bot', 'components', 'uriage_handler.js'));
const keihiHandler = require(path.join(__dirname, '..', 'keihi_bot', 'components', 'keihi_handler.js'));

// キャスト出勤管理のハンドラ読み込み
const syuttaikinHandler = require(path.join(__dirname, '..', 'syuttaiki_bot', 'handlers', 'syuttaikinHandler.js'));

// この順番で処理を試みる
const componentHandlers = [
    hikkakeHandler,
    uriageHandler,
    keihiHandler,
    syuttaikinHandler,  // ここに追加
];

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
