#!/bin/bash
echo "=============================================="
echo " VOD Hyver - Автоматическое Обновление Архива"
echo "=============================================="
echo ""

cd telegram_hls_backend
node chunker.js --auto

echo ""
read -p "Нажмите любую клавишу для выхода..."
