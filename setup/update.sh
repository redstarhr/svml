#!/bin/bash

set -e

echo "🟡 システムのアップデートと必要なパッケージのインストール..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl unzip jq dos2unix zip vim

echo "🟡 Node.js 20 のインストール..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v

echo "🟡 タイムゾーンを Asia/Tokyo に設定..."
sudo timedatectl set-timezone Asia/Tokyo

echo "🟡 HTTP ファイアウォールルールを作成..."
gcloud compute firewall-rules create default-allow-http \
  --allow tcp:80 --source-ranges 0.0.0.0/0 --target-tags http-server || true

echo "🟡 SSH 鍵が存在するか確認..."
if [ ! -f ~/.ssh/id_rsa ]; then
  echo "🔐 SSH 鍵を作成中..."
  ssh-keygen -t rsa -b 4096 -C "star.vesta.legion.kanri@gmail.com" -N "" -f ~/.ssh/id_rsa
else
  echo "🔐 SSH 鍵は既に存在しています。"
fi

echo "🔑 公開鍵の内容はこちら:"
cat ~/.ssh/id_rsa.pub

echo "🟡 svml_zimu_bot ディレクトリの作成と移動..."
mkdir -p ~/svml_zimu_bot
cd ~/svml_zimu_bot

if [ ! -d ".git" ]; then
  echo "🟡 Git リポジトリを SSH 経由でクローン中..."
  git clone git@github.com:star-discord/svml_zimu_bot.git .
else
  echo "🟡 既に Git リポジトリが存在します。pull を試みます..."
  git pull
fi

echo "🟡 dos2unix で改行コードを変換中..."
sudo apt install -y dos2unix
dos2unix update.sh sync_from_github.sh

echo "🟡 実行権限を付与中..."
chmod +x update.sh sync_from_github.sh

echo "🟡 .env ファイルの準備..."
cp -n .env.sample .env
echo "⚠️ .env ファイルを確認・編集してください。vim を起動します。"
sleep 2
vim .env

echo "🟡 npm install を実行..."
npm install

echo "✅ セットアップ完了！"
echo "この後は、Dockerfile を使用してコンテナイメージをビルドし、"
echo "Google Cloud Run にデプロイしてください。"