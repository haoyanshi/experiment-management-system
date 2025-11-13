@echo off
chcp 65001 >nul
title 实验管理系统

echo =====================================
echo 🧪 实验管理系统启动脚本
echo =====================================

:: 检查是否安装了 Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到 Node.js
    echo 📥 请先安装 Node.js: https://nodejs.org/
    echo 🔄 安装完成后重新运行此脚本
    pause
    exit /b 1
)

echo ✅ Node.js 已安装
node --version

:: 检查是否存在 node_modules
if not exist node_modules (
    echo 📦 正在安装依赖包...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖包安装失败
        echo 🌐 如果网络较慢，请尝试使用淘宝镜像:
        echo    npm config set registry https://registry.npmmirror.com
        echo    然后重新运行此脚本
        pause
        exit /b 1
    )
    echo ✅ 依赖包安装完成
) else (
    echo ✅ 依赖包已存在
)

echo.
echo 🚀 正在启动实验管理系统...
echo 📋 启动完成后，请在浏览器中访问 http://localhost:3000
echo 🛑 按 Ctrl+C 可以停止服务器
echo.

:: 启动服务器
npm start

pause