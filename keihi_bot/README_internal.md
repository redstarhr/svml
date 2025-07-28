# 🔧 Discord 経費申請 Bot 開発者向け README (`README_internal.md`)

このドキュメントは、**開発者・運用管理者**向けの内部仕様・構成・設計方針をまとめたものです。外部利用者向けドキュメントは `README.md` を参照してください。

---

## 📁 ディレクトリ構成

.
├── commands/ # Slashコマンド群
│ ├── keihi_setup.js
│ ├── keihi_config.js
│ ├── keihi_rireki.js
│ └── keihi_spec.js
├── interactions/
│ ├── buttons/ # ボタン操作
│ │ ├── approve.js
│ │ └── cancel.js
│ ├── modals/ # モーダル入力処理
│ │ └── submit.js
│ └── selectMenus/ # セレクトメニュー
│ └── history.js
├── utils/
│ ├── fileStorage.js # ファイル読み書き＋バリデーション
│ ├── spreadsheet.js # Google Sheets 連携
│ ├── threadUtils.js # スレッド名生成・件数分割
│ └── constants/
│ └── messages.js # 定数メッセージ集
├── events/ # ready, interactionCreate 等
├── tests/ # Mocha/Chai によるユニットテスト（予定）
├── index.js # メイン起動ファイル
├── deploy-commands.js # Slashコマンドの登録スクリプト
├── .env # 環境変数ファイル（Git除外）
└── README.md # 一般向け


---

## 🧠 設計方針

### 1. CommonJS 構成
- `require` / `module.exports` ベースで構成
- Node.js 18+ を前提

### 2. ファイル保存戦略
- ログ：`data/keihi/<guildId>/logs/YYYY-MM.json`
- 設定：`data/keihi/<guildId>/config.json`
- スプレッドマップ：`spreadsheet_map.json`
- JSON読み込みは `safeReadJson()` で型チェックを含む

### 3. スレッド管理
- 月単位でスレッド生成（例：`経費申請-2025-07`）
- 500件超えると分割（例：`経費申請-2025-07(1~500)`）
- 存在すれば再利用、なければ新規作成

### 4. ロール管理
- `/経費申請設定` にて：
  - ✅ **承認ロール** → 承認ボタンが表示される対象
  - 👁 **表示ロール** → プライベートスレッドの表示対象
- 表示ロール設定時はプライベートスレッド＋アクセス権付与

---

## ✅ 承認フロー仕様

- 承認者にのみ「✅ 承認」ボタンが表示
- 押下すると `approvedBy[]` にユーザーを追加
- メッセージを編集して承認済みユーザーを表示  
  例：`✅ 承認済み (2/3): userA, userB`
- 全員承認後はボタンを無効化（今後対応）

---

## 🧪 テスト方針（予定）

Mocha + Chai で以下の関数を単体テスト：

```js
✔ appendExpenseLog()
✔ getExpenseEntries()
✔ updateApprovalStatus()
✔ deleteExpenseEntry()
✔ editExpenseEntry()
✔ safeReadJson() 型検証

🔁 今後の拡張予定
 領収書画像の添付（ファイル送信対応）

 管理者用 CSV 出力（Google Sheets or ローカル）

 未承認申請の一覧取得

 多段階承認（例：2人以上必須）

 Botレスポンスキャッシュ（高頻度アクセス最適化）


🔐 .env 環境変数一覧

DISCORD_TOKEN=あなたのボットトークン
CLIENT_ID=BotのクライアントID
GUILD_ID=開発用ギルドID（省略可能）
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
BASE_DIR=./data/keihi


🧑‍💻 開発メモ
日本語ログ＋絵文字で統一（例：✅, ❌, 📁）

すべての読み書き処理でエラーハンドリングを明示

コマンドは .data.toJSON() を export

コンポーネントハンドラは customId を元にディレクトリごとに分離

constants/messages.js に定数を集約し、文言の一元管理を徹底

📜 ライセンス
MIT License
(c) 2025 redstar hr <redstar.hoshir@gmail.com>

