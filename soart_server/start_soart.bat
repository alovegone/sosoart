@echo off
echo ==========================================
echo       Starting Soart Creative Studio
echo ==========================================

:: 1. 启动后端 (在一个新窗口中)
start "Soart Backend" cmd /k "cd soart_server && venv\Scripts\activate && python main.py"

:: 等待 2 秒，让后端先跑起来
timeout /t 2 /nobreak >nul

:: 2. 启动前端 (在另一个新窗口中)
start "Soart Frontend" cmd /k "cd soart_frontend && npm run dev"

:: 3. 自动打开浏览器
timeout /t 2 /nobreak >nul
start http://localhost:5173

echo.
echo Done! Please check the new windows.
echo.