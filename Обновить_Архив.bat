@echo off
chcp 65001 >nul
echo ==============================================
echo  VOD Hyver - Auto Update
echo ==============================================
echo.
cd /d "%~dp0telegram_hls_backend"
node chunker.js --auto
echo.
echo Press any key to exit...
pause >nul
