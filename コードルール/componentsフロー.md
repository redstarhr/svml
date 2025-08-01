# 経費申請機能 コンポーネント処理フロー

このドキュメントは、ユーザーが経費申請機能のボタンやモーダルを操作した際の、Bot内部の処理の流れを説明します。

## 1. 起動プロセス (Botの準備段階)

1.  **エントリーポイント実行 (`index.js`)**
    *   Botのメインファイル `index.js` が起動します。

2.  **モジュール読み込み (`index.js`)**
    *   `index.js` は `keihi_bot`, `uriage_bot` のような機能別ディレクトリをスキャンします。
    *   各ディレクトリの `index.js` (例: `keihi_bot/index.js`) を `require` し、そこから `commands` と `componentHandlers` を受け取ります。
    *   すべての `commands` は `client.commands` に登録されます。
    *   すべての `componentHandlers` は `client.componentHandlers` という単一の配列に集約・登録されます。

3.  **イベントリスナー登録 (`index.js`)**
    *   `events` ディレクトリをスキャンし、`interactionCreate.js` などのイベントリスナーを `client` に登録します。

## 2. インタラクション処理プロセス (ユーザー操作への応答)

1.  **ユーザー操作 & イベント発生**
    *   ユーザーが経費申請のボタンをクリック、またはモーダルを送信します。
    *   Discord APIがBotに `interactionCreate` イベントを送信します。

2.  **中央ハブによる受信 (`events/interactionCreate.js`)**
    *   起動時に登録されたイベントリスナーが発火し、`events/interactionCreate.js` の `execute` 関数が呼び出されます。ここが全てのボタン・モーダル操作の入り口です。

3.  **ハンドラーへの処理委譲 (`events/interactionCreate.js`)**
    *   `interactionCreate.js` は、起動時に `client.componentHandlers` に集約された全機能のハンドラーを一つずつループ処理します。
    *   ループの中で、`keihiHandler.js` の `execute(interaction)` 関数が呼び出されます。

4.  **個別ハンドラーによる実行 (`keihi_bot/handlers/keihiHandler.js`)**
    *   `keihiHandler.js` は、渡された `interaction` の `customId` を見て、自身が処理すべき操作（例: `keihi_shinsei_button`）かどうかを判断します。
    *   **処理対象の場合:** モーダル表示やログ出力などの固有処理を実行し、`true` を返します。
    *   **処理対象でない場合:** 何もせず `false` を返します。

5.  **処理の完了**
    *   `events/interactionCreate.js` のループは、いずれかのハンドラーが `true` を返した時点で終了し、一つの操作が重複して処理されるのを防ぎます。
