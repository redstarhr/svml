// events/interactionCreate.js
const { Events } = require('discord.js');

/**
 * コンポーネント（ボタン、モーダル等）のハンドラを検索して実行します。
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @param {import('discord.js').Collection} collection - The collection of handlers to search in.
 * @param {import('discord.js').Client} client - The client instance.
 */
async function handleComponent(interaction, collection, client) {
  for (const [customId, handler] of collection.entries()) {
    // customIdが文字列の場合は完全一致、正規表現の場合はtestで評価
    const isMatch = (typeof customId === 'string' && customId === interaction.customId) ||
                    (customId instanceof RegExp && customId.test(interaction.customId));

    if (isMatch) {
      await handler.execute(interaction, client);
      return; // 一致するハンドラが見つかったら処理を終了
    }
  }
}

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

      // ボタンの処理
      if (interaction.isButton()) {
        return await handleComponent(interaction, client.buttons, client);
      }

      // モーダルの処理
      if (interaction.isModalSubmit()) {
        return await handleComponent(interaction, client.modals, client);
      }

      // セレクトメニューの処理
      if (interaction.isAnySelectMenu()) {
        return await handleComponent(interaction, client.selects, client);
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