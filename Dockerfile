# ベースイメージとしてNode.js 20の軽量版を使用
FROM node:20-slim

# アプリケーションの作業ディレクトリを設定
WORKDIR /usr/src/app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 本番環境に必要な依存関係のみをインストール
RUN npm install --only=production

# アプリケーションのソースコードをコピー
COPY . .

# アプリケーションを起動するコマンド
# Cloud Run はこのコマンドを実行してコンテナを開始します
CMD [ "node", "index.js" ]