#!/bin/bash

set -e

echo "🟡 タイムゾーンを Asia/Tokyo に設定..."
sudo timedatectl set-timezone Asia/Tokyo

echo "🟡 SSH 鍵が存在するか確認..."
if [ ! -f ~/.ssh/id_rsa ]; then
  echo "🔐 SSH 鍵を作成中..."
  ssh-keygen -t rsa -b 4096 -C "star.vesta.legion.kanri@gmail.com" -N "" -f ~/.ssh/id_rsa
else
  echo "🔐 SSH 鍵は既に存在しています。"
fi

echo "🟡 svml_zimu_bot ディレクトリの作成と移動..."
mkdir -p ~/svml_zimu_bot
cd ~/svml_zimu_bot

if [ ! -d ".git" ]; then
  echo "🟡 Git リポジトリを SSH 経由でクローン中..."
  git clone git@github.com:star-discord/svml_zimu_bot.git .
else
  echo "🟡 既に Git リポジトリが存在します。リモートに合わせてローカルを強制更新します..."
  git fetch origin
  git reset --hard origin/main
  git clean -fd
fi

echo "🟡 update.sh に管理者権限を付与..."
chmod +x update.sh

echo "🟡 npm install を実行..."
npm install

echo "🟡 コマンドを更新（開発）"
node devcmd.js

echo "✅ 更新完了！"
echo "コンテナイメージを再ビルドして、Google Cloud Run にデプロイしてください。"