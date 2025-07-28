@echo off
setlocal

:: === 管理者権限で再実行 ===
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo 管理者権限で再起動します...
    powershell -Command "Start-Process '%~f0' -Verb runAs"
    exit /b
)

:: === 設定項目 ===
set "REMOTE_USER=test"
set "REMOTE_HOST=keihi-discord-bot"
set "REMOTE_PATH=/home/test/keihi_discord"
set "ZONE=asia-northeast1-a"
set "FILES_TO_SEND=index.js package.json commands events utils .env deploy-commands.js"

:: === Bot停止 ===
echo [1/5] Botを停止中...
gcloud compute ssh %REMOTE_USER%@%REMOTE_HOST% --zone=%ZONE% --command="pm2 stop keihi-bot" || exit /b

:: === ファイル送信 ===
echo [2/5] ファイルを転送中...
gcloud compute scp --recurse %FILES_TO_SEND% %REMOTE_USER%@%REMOTE_HOST%:"%REMOTE_PATH%" --zone=%ZONE% || exit /b

:: === Discordコマンドを更新 ===
echo [3/5] Discordスラッシュコマンドを更新中...
gcloud compute ssh %REMOTE_USER%@%REMOTE_HOST% --zone=%ZONE% --command="cd %REMOTE_PATH% && node deploy-commands.js" || exit /b

:: === Bot再起動 ===
echo [4/5] Botを再起動中...
gcloud compute ssh %REMOTE_USER%@%REMOTE_HOST% --zone=%ZONE% --command="pm2 restart keihi-bot" || exit /b

:: === PM2保存 ===
echo [5/5] PM2 状態を保存中...
gcloud compute ssh %REMOTE_USER%@%REMOTE_HOST% --zone=%ZONE% --command="pm2 save" || exit /b

echo ✅ Bot更新完了！
pause
