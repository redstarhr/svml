# 📋 経費申請 Discord Bot

STARグループ向けの経費申請自動化Botです。  
Discord上で簡単に申請・承認・履歴確認が可能です。

---

## 🚀 機能一覧

| 機能 | 説明 |
|------|------|
| 📩 経費申請ボタン | フォーム入力で申請送信 |
| 📊 申請履歴確認 | 自分の過去の申請を確認（Google Sheets連携） |
| 📎 embed再送信 | `/経費申請embed` でボタン付き案内を再表示 |
| 🛠 管理者向け設定 | `/経費申請設置` や `/deploy` などのセットアップコマンド |

---

## 🧑‍💻 導入方法

### 1. リポジトリをクローン

```bash
git clone https://github.com/star-discord/keihi_discord.git
cd keihi_discord

2. 依存パッケージをインストール

npm install

3. 環境変数 .env を作成

cp .env.example .env

内容を自分のBot用に書き換えてください：

DISCORD_TOKEN=xxx
GOOGLE_SHEETS_CLIENT_EMAIL=xxx
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n..."

⚙️ 実行スクリプト

コマンド	説明
npm start	通常起動（Node.js）
npm run pm2-start	PM2で起動（本番運用向け）
npm run test	Mochaテスト実行
./update_bot.sh	コード更新＋バックアップ＋再起動
./init_server.sh	GCP等の初期セットアップスクリプト

💬 主なスラッシュコマンド

コマンド	対象	内容
/経費申請設置	管理者のみ	ボタン付き案内をチャンネルに投稿
/経費申請履歴	全員	自分の過去の申請一覧を確認
/経費申請embed	管理者のみ	ボタン案内を再送信
/deploy	管理者のみ	コマンドを再登録
/help	全員	機能一覧を表示（Embed形式）


📁 フォルダ構成

keihi_discord/
├── commands/         # スラッシュコマンド群
├── events/           # Discordイベントハンドラー
├── utils/            # 共通ユーティリティ関数
├── data/             # 各ギルドのログデータ（自動生成）
├── tests/            # Mocha + Chai テストコード
├── .env.example      # 環境変数テンプレート
├── index.js          # メイン起動ファイル


📝 ライセンス
MIT License
(C) 2025 redstar hr


---

## ✅ 補足：自動生成ファイルを `.gitignore` に

以下のように `.gitignore` に追記しておくと安全です：

.env
data/
data_backup/

---

## ✅ README.md を GitHub に反映するには？

プロジェクトルートに `README.md` を保存 → コミット → プッシュするだけです。

```bash
git add README.md
git commit -m "📝 Add project README"
git push origin main




