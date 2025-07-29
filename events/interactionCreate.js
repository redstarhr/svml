const { Events, MessageFlags } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const logger = require('@common/logger');

// --- 各機能モジュールのハンドラを動的に読み込む ---
function loadComponentHandlers() {
  const handlers = [];
  const featureDirs = fs.readdirSync(path.join(__dirname, '..'), { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name.endsWith('_bot'))
    .map(dirent => dirent.name);

  for (const feature of featureDirs) {
    const featureIndexPath = path.join(__dirname, '..', feature, 'index.js');
    if (fs.existsSync(featureIndexPath)) {
      try {
        const featureModule = require(featureIndexPath);
        if (featureModule.handlers && Array.isArray(featureModule.handlers)) {
          handlers.push(...featureModule.handlers);
        }
      } catch (error) {
        logger.error(`エラー: モジュール ${feature} からのハンドラ読み込みに失敗しました。`, { error });
      }
    }
  }
  return handlers;
}

const componentHandlers = loadComponentHandlers();
logger.info(`✅ ${componentHandlers.length}個のコンポーネントハンドラを動的に読み込みました。`);

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
          logger.error(`不明なスラッシュコマンドを受信しました: ${interaction.commandName}`);
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '不明なコマンドです。Botが更新された可能性があります。', ephemeral: true });
          }
          return;
        }
        await command.execute(interaction, client);
        return;
      }

      // コマンド以外のインタラクション（ボタン、モーダル等）
      for (const handler of componentHandlers) {
        if (await handler.execute(interaction, client)) {
          return; // ハンドラが処理できたらtrueを返すので、そこでループを抜ける
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