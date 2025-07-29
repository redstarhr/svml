#!/bin/bash

# このスクリプトは、ローカルの開発環境を最新の状態に更新するためのものです。
# 本番環境 (Google Cloud Run) の更新は、コンテナイメージの再ビルドと再デプロイによって行われます。

set -e

echo "🟡 Gitリポジトリを最新の状態に更新します..."
git pull origin main

echo "🟡 依存関係を更新します..."
npm install --no-audit --no-fund

echo "🟡 スラッシュコマンドを更新します..."
# 本番環境用のコマンドを登録
npm run deploy

# 開発環境用のコマンドを登録する場合は、以下のコメントを解除してください
# npm run dev:deploy

echo "✅ ローカル開発環境の更新が完了しました！"
echo "本番環境に反映するには、変更をコミット＆プッシュし、"
echo "Google Cloud Runで新しいリビジョンをデプロイしてください。"