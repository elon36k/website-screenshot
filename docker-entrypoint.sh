#!/bin/bash

# Docker容器启动脚本

set -e

echo "🚀 启动网站截图服务..."

# 等待MySQL服务可用
echo "⏳ 等待MySQL数据库启动..."
while ! nc -z mysql 3306; do
  echo "等待MySQL连接..."
  sleep 2
done

echo "✅ MySQL数据库已连接"

# 等待额外的时间确保MySQL完全启动
sleep 5

# 初始化数据库
echo "🗄️ 初始化数据库..."
npm run init-db || echo "⚠️ 数据库初始化失败或已存在"

# 运行数据库迁移（如果需要）
echo "🔄 检查数据库迁移..."
npm run migrate-oss || echo "⚠️ 数据库迁移失败或已完成"

echo "🎯 启动应用服务器..."

# 启动应用
exec npm start
