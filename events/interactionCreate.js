const logger = require('@common/logger');
const path = require('node:path');
const { Events, MessageFlags } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // --- スラッシュコマンドの処理 ---
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        logger.error(`コマンド "${interaction.commandName}" が見つかりませんでした。`);
        await interaction.reply({ content: 'エラー: このコマンドは存在しないか、現在利用できません。', flags: MessageFlags.Ephemeral });
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        logger.error(`スラッシュコマンドの実行中にエラー: ${interaction.commandName}`, {
          error,
          guildId: interaction.guild?.id,
          userId: interaction.user.id,
        });
        const reply = { content: 'コマンドの実行中にエラーが発生しました。', flags: MessageFlags.Ephemeral };
        await (interaction.deferred || interaction.replied ? interaction.followUp(reply) : interaction.reply(reply)).catch(e => logger.error('Error sending error message:', e));
      }
      return; // コマンドを処理したので、ここで終了
    }

    // --- コンポーネント (ボタン、モーダル等) の処理 ---
    // フロー定義に従い、`index.js`で登録された `componentHandlers` をループ処理します。
    // `levelSettingsHandler` や `keihiHandler` などがこれに該当します。
    const componentHandlers = interaction.client.componentHandlers || [];
    for (const handler of componentHandlers) {
      try {
        // ハンドラがtrueを返したら、処理済みとみなしループを抜ける
        if (await handler.execute(interaction)) {
          return;
        }
      } catch (error) {
        // index.jsのローダーで追加されたfilePathプロパティを使用
        const handlerName = handler.filePath ? path.basename(handler.filePath) : '不明なハンドラ';
        logger.error('コンポーネントハンドラの実行中にエラーが発生しました:', {
          handlerName,
          customId: interaction.customId,
          guildId: interaction.guild?.id,
          userId: interaction.user.id,
          error,
        });
        const reply = { content: '操作の実行中にエラーが発生しました。', flags: MessageFlags.Ephemeral };
        await (interaction.deferred || interaction.replied ? interaction.followUp(reply) : interaction.reply(reply)).catch(e => logger.error('Error sending error message:', e));
        return;
      }
    }
  },
};