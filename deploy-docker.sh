#!/bin/bash

# Docker部署脚本

echo "🐳 部署网站截图服务到Docker"

# 检查是否存在环境变量文件
if [ ! -f .env.docker ]; then
    echo "⚠️ 请先创建 .env.docker 文件并配置OSS参数"
    echo "可以从 .env.docker.example 复制模板"
    exit 1
fi

# 加载环境变量
export $(cat .env.docker | xargs)

echo "📦 构建Docker镜像..."
docker-compose build

echo "🚀 启动服务..."
docker-compose up -d

echo "⏳ 等待服务启动..."
sleep 10

echo "🔍 检查服务状态..."
docker-compose ps

echo "✅ 部署完成!"
echo ""
echo "🌐 访问地址:"
echo "  - 健康检查: http://localhost:3000/health"
echo "  - Web界面: http://localhost:3000"
echo "  - API文档: http://localhost:3000/api/screenshot?url=https://example.com"
echo ""
echo "📊 查看日志: docker-compose logs -f app"
echo "🛑 停止服务: docker-compose down"
