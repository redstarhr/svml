#!/bin/bash

# --- Configuration ---
set -e # Exit immediately if a command exits with a non-zero status.

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="$HOME/svml_zimu_bot-main"

# --- Error Handling ---
handle_error() {
    local exit_code=$?
    echo -e "${RED}❌ エラーが発生しました (終了コード: $exit_code, 行番号: $1)。処理を中止します。${NC}"
    exit $exit_code
}
trap 'handle_error $LINENO' ERR

echo -e "${GREEN}--- 開発環境 初期化スクリプト開始 ---${NC}"
echo -e "${YELLOW}このスクリプトは、Linuxベースの開発環境をセットアップします。${NC}"

# --- 1. System Setup ---
echo -e "\n${YELLOW}1. システムのセットアップ中...${NC}"
echo "🕒 タイムゾーンを Asia/Tokyo に設定"
sudo timedatectl set-timezone Asia/Tokyo

echo "📦 パッケージリストを更新"
sudo apt-get update && sudo apt-get upgrade -y

echo "📦 Node.js 18.x の公式推奨インストールを実行"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "🔧 Node.js と npm のバージョン確認:"
node -v
npm -v

# --- 2. Project Setup ---
echo -e "\n${YELLOW}2. プロジェクトのセットアップ中...${NC}"
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${RED}エラー: ディレクトリ '$PROJECT_DIR' は既に存在します。${NC}"
    echo "このスクリプトは新規環境の初期化用です。既存の環境を更新する場合は 'update.sh' を使用してください。"
    exit 1
fi

echo "📂 GitHubからリポジトリをクローンします: ${PROJECT_DIR}"
git clone https://github.com/hr-redstar/svml_zimu_bot-main.git "$PROJECT_DIR"
cd "$PROJECT_DIR"

echo "📝 .env ファイルをセットアップします"
if [ -f .env.sample ]; then
    cp .env.sample .env
    echo -e "${GREEN}✅ '.env.sample' から '.env' を作成しました。${NC}"
else
    echo -e "${YELLOW}⚠️ '.env.sample' が見つかりません。空の '.env' を作成します。${NC}"
    touch .env
fi

echo "🔑 スクリプトに実行権限を付与します"
chmod +x *.sh

echo -e "\n${YELLOW}*** 重要: .env ファイルを編集してください ***${NC}"
echo "Botのトークンや各種IDを設定する必要があります。"
echo "例: nano .env  または  vim .env"
read -p "編集が完了したら、Enterキーを押して続行してください..."

# --- 3. Dependencies & Deployment ---
echo -e "\n${YELLOW}3. 依存関係のインストールとデプロイ...${NC}"
echo "📦 npm パッケージをインストールしています (数分かかる場合があります)..."
npm install --no-audit --no-fund

echo "📡 スラッシュコマンドをDiscordに登録しています..."
node deploy-commands.js

echo -e "\n${GREEN}✅ 開発環境のセットアップが完了しました！${NC}"
echo "----------------------------------------"
echo "💡 次のステップ:"
echo "1. Botを起動するには、プロジェクトディレクトリで 'npm run dev' を実行してください。"
echo "2. 本番環境へのデプロイはGoogle Cloud Runで行います。"
echo "   詳細は uriage_bot/運用手順書.md を参照してください。"
echo ""
echo "🔧 Botの更新:"
echo "   ローカル環境の更新は、プロジェクトディレクトリ内で 'git pull' を実行してください。"
echo "----------------------------------------"
