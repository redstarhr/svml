// index.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Collection, Events } = require('discord.js');
const { client } = require('./client');

// --- 必須環境変数チェック ---
const requiredEnv = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
for (const envVar of requiredEnv) {
  if (!process.env[envVar]) {
    console.error(`❌ 致命的エラー: 環境変数 ${envVar} が .env に設定されていません。`);
    process.exit(1);
  }
}

console.log('Google Credentials Path:', process.env.GOOGLE_APPLICATION_CREDENTIALS);

client.commands = new Collection();

// --- コマンドファイルを再帰的に読み込む関数 ---
function loadCommandFiles(dir) {
  const commandFiles = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      commandFiles.push(...loadCommandFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      commandFiles.push(fullPath);
    }
  }
  return commandFiles;
}

// --- コマンド読み込みディレクトリ ---
const commandDirs = [
  path.join(__dirname, 'commands'),
  path.join(__dirname, 'uriage_bot', 'commands'),
  path.join(__dirname, 'hikkake_bot', 'commands'),
];

// --- コマンドのロード処理 ---
for (const dir of commandDirs) {
  if (!fs.existsSync(dir)) continue;
  const commandFiles = loadCommandFiles(dir);

  for (const file of commandFiles) {
    try {
      const command = require(file);
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.warn(`⚠️ 無効なコマンドファイル: ${path.relative(__dirname, file)}`);
      }
    } catch (error) {
      console.error(`❌ コマンドファイル読み込み失敗: ${path.relative(__dirname, file)}`, error);
    }
  }
}
console.log(`✅ ${client.commands.size} 個のコマンドを読み込みました。`);

// --- イベントハンドラの読み込み ---
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    // `client` を引数として渡す
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    // `client` を引数として渡す
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}
console.log(`✅ ${eventFiles.length} 個のイベントハンドラを読み込みました。`);

// --- モーダル・ボタンハンドラ読み込み ---
const modalHandler = require(path.join(__dirname, 'uriage_bot', 'utils', 'uriage_modals.js'));
const buttonHandler = require(path.join(__dirname, 'uriage_bot', 'utils', 'uriage_buttons.js'));

const hikkakeModalHandler = require(path.join(__dirname, 'hikkake_bot', 'utils', 'hikkake_modal_handler.js'));
const hikkakeButtonHandler = require(path.join(__dirname, 'hikkake_bot', 'utils', 'hikkake_button_handler.js'));
const hikkakeSelectHandler = require(path.join(__dirname, 'hikkake_bot', 'utils', 'hikkake_select_handler.js'));

// --- インタラクション総合ハンドリング ---
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // スラッシュコマンド処理
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
      return;
    }

    // ボタン押下の汎用ハンドラ優先処理
    if (interaction.isButton()) {
      if (await buttonHandler.execute(interaction)) return;
      if (await hikkakeButtonHandler.execute(interaction)) return;
    }

    // モーダル送信の汎用ハンドラ優先処理
    if (interaction.isModalSubmit()) {
      if (await modalHandler.execute(interaction)) return;
      if (await hikkakeModalHandler.execute(interaction)) return;
    }

    // セレクトメニュー処理（hikkake系のものが多いため専用ハンドラも使用）
    if (interaction.isAnySelectMenu()) {
      // hikkakeセレクトメニューの汎用処理
      if (await hikkakeSelectHandler.execute(interaction)) return;
    }
  } catch (error) {
    console.error('❌ インタラクション処理エラー:', error);

    // If the interaction is unknown (error code 10062), we can't reply to it.
    // Log the issue and return to prevent a crash.
    if (error.code === 10062) {
      console.error('インタラクションの有効期限が切れているため、エラーメッセージを返信できませんでした。');
      return;
    }

    const errorMessage = {
      content: 'コマンド実行中にエラーが発生しました。',
      flags: 64, // 64 is MessageFlags.Ephemeral
    };

    if (interaction.replied || interaction.deferred) {
      // Use catch to prevent unhandled promise rejections if the followup also fails
      await interaction.followUp(errorMessage).catch(e => console.error('エラーのフォローアップに失敗:', e));
    } else {
      await interaction.reply(errorMessage).catch(e => console.error('エラーの返信に失敗:', e));
    }
  }
});

// --- Discord Bot ログイン ---
client.login(process.env.DISCORD_TOKEN);
