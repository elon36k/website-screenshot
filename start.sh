#!/bin/bash

echo "🚀 启动网站截图服务"

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "⚠️  未找到 .env 文件，复制默认配置..."
    cp .env.example .env
    echo "📝 请编辑 .env 文件设置数据库配置"
fi

# 安装依赖
echo "📦 安装依赖包..."
npm install

# 安装 Playwright 浏览器
echo "🌐 安装 Playwright 浏览器..."
npm run install-playwright

# 初始化数据库
echo "🗄️  初始化数据库..."
npm run init-db

# 启动服务
echo "🎉 启动服务..."
npm run dev
