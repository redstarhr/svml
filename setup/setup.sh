#!/bin/bash

set -e

echo ":yellow_circle: システムのアップデートと必要なパッケージのインストール..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl unzip jq dos2unix zip vim

echo ":yellow_circle: Node.js 20 のインストール..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v

echo ":yellow_circle: タイムゾーンを Asia/Tokyo に設定..."
sudo timedatectl set-timezone Asia/Tokyo

echo ":yellow_circle: HTTP ファイアウォールルールを作成..."
gcloud compute firewall-rules create default-allow-http \
  --allow tcp:80 --source-ranges 0.0.0.0/0 --target-tags http-server || true

echo ":yellow_circle: svml_zimu_bot ディレクトリの作成と移動..."
mkdir -p ~/svml_zimu_bot
cd ~/svml_zimu_bot

echo ":yellow_circle: Git リポジトリのクローン..."
git clone https://github.com/star-discord/svml_zimu_bot.git .
git pull

echo ":yellow_circle: .env ファイルの準備..."
cp -n .env.sample .env
echo ":warning: .env ファイルを確認・編集してください。vim を起動します。"
sleep 2
vim .env

echo ":yellow_circle: npm install を実行..."
npm install

echo ":white_check_mark: セットアップ完了！"
echo "この後は、Dockerfile を使用してコンテナイメージをビルドし、Google Cloud Run にデプロイしてください。"