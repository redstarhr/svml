// index.js

require('dotenv').config();
const fs = require('node:fs');
const path = require('path');
const { Collection, Events } = require('discord.js');
const { client } = require('./client');
const { startLogCleanupInterval } = require('./hikkake_bot/utils/hikkakePanelManager.js');

// --- 必須環境変数チェック ---
const requiredEnv = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
for (const envVar of requiredEnv) {
  if (!process.env[envVar]) {
    console.error(`❌ 致命的エラー: 環境変数 ${envVar} が .env に設定されていません。`);
    process.exit(1);
  }
}

console.log('Google Credentials Path:', process.env.GOOGLE_APPLICATION_CREDENTIALS);

/**
 * 指定されたディレクトリから再帰的に .js ファイルを探索します。
 * @param {string} dir - 探索を開始するディレクトリ
 * @returns {string[]} 見つかったファイルのフルパスの配列
 */
function getJsFiles(dir) {
  const files = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getJsFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // ディレクトリが存在しない場合は無視
    if (error.code !== 'ENOENT') {
      console.error(`ディレクトリの読み込みに失敗: ${dir}`, error);
    }
  }
  return files;
}

// --- コマンドハンドラの読み込み ---
client.commands = new Collection();
const commandDirs = [
  path.join(__dirname, 'uriage_bot', 'commands'),
  path.join(__dirname, 'hikkake_bot', 'commands'),
  path.join(__dirname, 'keihi_bot', 'commands'),
];

// --- コマンドのロード処理 ---
for (const dir of commandDirs) {
  const commandFiles = getJsFiles(dir);
  for (const file of commandFiles) {
    try {
      const command = require(file);
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.warn(`⚠️  [警告] ${file} のコマンドは 'data' または 'execute' プロパティが不足しています。`);
      }
    } catch (error) {
      console.error(`❌ コマンドファイルの読み込みに失敗: ${file}`, error);
    }
  }
}
console.log(`✅ ${client.commands.size} 個のコマンドを読み込みました。`);

// --- 各Botのインタラクションハンドラを読み込み ---
const hikkakeButtonHandler = require('./hikkake_bot/utils/hikkake_button_handler.js');
const hikkakeSelectHandler = require('./hikkake_bot/utils/hikkake_select_handler.js');
const hikkakeModalHandler = require('./hikkake_bot/utils/hikkake_modal_handler.js');
const uriageButtonHandler = require('./uriage_bot/utils/uriage_button_handler.js');
const uriageModalHandler = require('./uriage_bot/utils/uriage_modal_handler.js');
const uriageConfigHandler = require('./uriage_bot/commands/uriage_config.js');
// keihi_botのハンドラは、コレクターパターンから移行後にここに追加します。

// --- Bot起動時の処理 ---
client.once(Events.ClientReady, c => {
  console.log('------------------------------------------------------');
  console.log(`✅ Botの準備が完了しました。`);
  console.log(`   ログインアカウント: ${c.user.tag}`);
  console.log(`   接続サーバー数: ${c.guilds.cache.size} サーバー`);
  if (c.guilds.cache.size > 0) {
    console.log('   参加サーバー一覧:');
    c.guilds.cache.forEach(guild => {
      console.log(`     - ${guild.name} (ID: ${guild.id})`);
    });
  }
  console.log('------------------------------------------------------');

  // ひっかけBotの定期処理を開始
  startLogCleanupInterval(c);
});

// --- インタラクション総合ハンドリング ---
client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) {
        console.error(`コマンドが見つかりません: ${interaction.commandName}`);
        return;
      }
      await command.execute(interaction);

    } else if (interaction.isButton()) {
      if (interaction.customId.startsWith('hikkake_')) await hikkakeButtonHandler.execute(interaction);
      else if (interaction.customId.startsWith('sales_report')) await uriageButtonHandler.execute(interaction);
      // 他のBotのボタン処理もここに追加

    } else if (interaction.isAnySelectMenu()) {
      if (interaction.customId.startsWith('hikkake_')) await hikkakeSelectHandler.execute(interaction);
      else if (interaction.customId === 'select_approval_roles') await uriageConfigHandler.handleRoleSelectMenu(interaction);
      // 他のBotのセレクトメニュー処理もここに追加

    } else if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('hikkake_')) await hikkakeModalHandler.execute(interaction);
      else if (interaction.customId.startsWith('sales_report_modal')) await uriageModalHandler.execute(interaction);
      // 他のBotのモーダル処理もここに追加
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
});

// --- Discord Bot ログイン ---
client.login(process.env.DISCORD_TOKEN);
