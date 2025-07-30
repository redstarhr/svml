const { Events, MessageFlags } = require('discord.js');
const logger = require('@common/logger');

module.exports = {
  name: Events.InteractionCreate,
  /**
   * すべてのインタラクションをここで受け取り、適切な処理に振り分けます。
   * @param {import('discord.js').Interaction} interaction
   * @param {import('discord.js').Client} client
   */
  async execute(interaction, client) {
    // --- インタラクションのログ出力 ---
    if (interaction.isButton()) {
        logger.info(`[Interaction] ボタン受信: ${interaction.customId}`);
    } else if (interaction.isAnySelectMenu()) {
        logger.info(`[Interaction] セレクトメニュー受信: ${interaction.customId} (選択値: ${interaction.values.join(', ')})`);
    } else if (interaction.isModalSubmit()) {
        logger.info(`[Interaction] モーダル受信: ${interaction.customId}`);
    }
    // ------------------------------------

    try {
      // スラッシュコマンドの処理
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) {
          logger.error(`不明なスラッシュコマンドを受信しました: ${interaction.commandName}`);
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '不明なコマンドです。Botが更新された可能性があります。', ephemeral: true });
          }
          return;
        }
        await command.execute(interaction, client);
        return;
      }

      // --- コンポーネントインタラクションの処理 ---
      if (interaction.isMessageComponent() || interaction.isModalSubmit()) {
        // 1. customIdによる直接的なハンドラ検索 (効率的)
        const handler = client.componentHandlers.get(interaction.customId);
        if (handler) {
          await handler.execute(interaction, client);
          return;
        }

        // 2. ルーター型ハンドラによる処理 (後方互換性・汎用処理)
        for (const router of client.componentRouters) {
          if (await router.execute(interaction, client)) {
            return; // ハンドラが処理できたらtrueを返すので、そこでループを抜ける
          }
        }
      }
    } catch (error) {
      logger.error(`インタラクション処理中にエラー (ID: ${interaction.customId || interaction.commandName})`, { error });
      const errorMessage = { content: 'コマンドの実行中にエラーが発生しました。', ephemeral: true };
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      } catch (replyError) {
        logger.error('エラーメッセージの返信に失敗しました。', { replyError });
      }
    }
  },
};