#!/bin/bash

# Docker测试脚本

echo "🧪 测试Docker部署的网站截图服务"

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 健康检查
echo "🔍 1. 健康检查..."
health_response=$(curl -s http://localhost:3000/health)
if echo "$health_response" | grep -q '"success":true'; then
    echo "✅ 健康检查通过"
    echo "$health_response" | jq
else
    echo "❌ 健康检查失败"
    echo "$health_response"
    exit 1
fi

# 测试截图API
echo ""
echo "📸 2. 测试截图API..."
screenshot_response=$(curl -s -G "http://localhost:3000/api/screenshot" \
    --data-urlencode "url=https://www.example.com" \
    --data-urlencode "width=800" \
    --data-urlencode "height=600" \
    --max-time 60)

if echo "$screenshot_response" | grep -q '"success":true'; then
    echo "✅ 截图API测试通过"
    echo "$screenshot_response" | jq '.data | {title, screenshotUrl, cached}'
else
    echo "❌ 截图API测试失败"
    echo "$screenshot_response" | jq
    exit 1
fi

# 测试缓存
echo ""
echo "⚡ 3. 测试缓存功能..."
cache_response=$(curl -s -G "http://localhost:3000/api/screenshot" \
    --data-urlencode "url=https://www.example.com" \
    --data-urlencode "width=800" \
    --data-urlencode "height=600")

if echo "$cache_response" | grep -q '"cached":true'; then
    echo "✅ 缓存功能正常"
    echo "第二次请求使用了缓存"
else
    echo "⚠️ 缓存功能异常（可能是正常情况）"
fi

echo ""
echo "🎉 所有测试完成！"
echo ""
echo "🌐 访问Web界面: http://localhost:3000"
echo "📋 查看服务状态: docker-compose ps"
echo "📝 查看日志: docker-compose logs -f app"
