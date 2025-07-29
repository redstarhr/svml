// events/ready.js
const { Events } = require('discord.js');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const { exec } = require('node:child_process');

// hikkake_botのユーティリティ関数を読み込みます。
// TODO: module-aliasを導入して '@bots/hikkake_bot/utils/hikkakePanelManager.js' のようなパスにリファクタリングすることを推奨します
const { startLogCleanupInterval } = require('@root/hikkake_bot/utils/hikkakePanelManager.js');

/**
 * Google Cloud Storageへの接続を確認します。
 * 接続には環境変数 `GCS_BUCKET_NAME` と `GOOGLE_APPLICATION_CREDENTIALS` が必要です。
 */
async function checkGcsConnection() {
  const bucketName = process.env.GCS_BUCKET_NAME;
  if (!bucketName) {
    console.warn('⚠️  環境変数 GCS_BUCKET_NAME が設定されていません。GCS接続確認をスキップします。');
    return;
  }

  try {
    const storage = new Storage();
    const [exists] = await storage.bucket(bucketName).exists();
    if (exists) {
      console.log(`✅ GCSバケット「${bucketName}」への接続を確認しました。`);
    } else {
      console.error(`❌ GCSバケット「${bucketName}」が見つかりません。`);
      console.error('   ヒント: .envファイルのGCS_BUCKET_NAMEが正しいか、Google Cloudプロジェクトの設定を確認してください。');
    }
  } catch (error) {
    console.error(`❌ GCSバケット「${bucketName}」への接続に失敗しました。`);
    console.error('   エラー詳細:', error.message);
    // Cloud Runで実行されているかどうかに応じて、ヒントを出し分ける
    if (process.env.K_SERVICE) {
      console.error('   ヒント (Cloud Run): Cloud Runサービスに紐付けられたサービスアカウントに、');
      console.error(`   GCSバケット「${bucketName}」へのアクセス権限（例: ストレージオブジェクト管理者）が付与されているか確認してください。`);
    } else {
      console.error('   ヒント (ローカル環境): GOOGLE_APPLICATION_CREDENTIALS環境変数が正しく設定されているか、');
      console.error('   サービスアカウントキーに適切な権限が付与されているか確認してください。');
    }
  }
}

/**
 * 開発環境でコマンドを自動登録します。
 * GUILD_IDが.envに設定されている場合のみ実行されます。
 */
function deployDevCommands() {
  if (!process.env.GUILD_ID) {
    // GUILD_IDがなければ本番環境とみなし、何もしない
    return;
  }

  console.log('[READY-EVENT] 開発環境を検出しました。コマンドを自動登録します...');
  const deployProcess = exec('node devcmd.js');

  deployProcess.stdout.on('data', (data) => {
    process.stdout.write(`[DEV-DEPLOY] ${data}`);
  });

  deployProcess.stderr.on('data', (data) => {
    process.stderr.write(`[DEV-DEPLOY-ERROR] ${data}`);
  });

  deployProcess.on('close', (code) => {
    console.log(`[READY-EVENT] コマンド登録プロセスがコード ${code} で終了しました。`);
  });
}

/**
 * Botの起動情報をコンソールに出力します。
 * @param {import('discord.js').Client} client
 */
function logBotInfo(client) {
  console.log('------------------------------------------------------');
  console.log(`✅ Botの準備が完了しました。`);
  console.log(`   ログインアカウント: ${client.user.tag}`);

  const guilds = client.guilds.cache;
  const totalUsers = guilds.reduce((acc, guild) => acc + guild.memberCount, 0);

  console.log(`   接続サーバー数: ${guilds.size} サーバー`);
  console.log(`   総ユーザー数: ${totalUsers} ユーザー`);
}

module.exports = {
  name: Events.ClientReady,
  once: true,
  /**
   * Botの準備が完了したときに一度だけ実行される処理です。
   * @param {import('discord.js').Client} client Discordクライアントインスタンス
   */
  async execute(client) {
    logBotInfo(client);

    // 並列で実行可能な起動時タスク
    await Promise.all([
      checkGcsConnection(),
      deployDevCommands(), // 開発環境の場合のみ実行される
    ]);

    console.log('------------------------------------------------------');
    // 定期実行タスクの開始
    startLogCleanupInterval(client);
    console.log('✅ 定期的なログクリーンアップ処理を開始しました。');
  },
};
