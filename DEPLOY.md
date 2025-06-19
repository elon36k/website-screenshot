# 🖼️ 网站截图服务 - 完整部署指南

## 📋 项目概览

这是一个功能完整的网站截图服务，支持：
- 🎯 自动网站截图
- ☁️ 阿里云OSS存储
- 💾 MySQL缓存机制
- 🌐 Web界面测试
- 🐳 Docker一键部署

## 🚀 快速部署

### 方式一：Docker部署（推荐）

```bash
# 1. 克隆项目
git clone <your-repo>
cd snap

# 2. 配置OSS参数
cp .env.docker.example .env.docker
# 编辑 .env.docker 填入你的OSS配置

# 3. 一键部署
./deploy-docker.sh

# 4. 测试服务
./test-docker.sh
```

### 方式二：本地开发

```bash
# 1. 安装依赖
npm install
npm run install-playwright

# 2. 配置环境
cp .env.example .env
# 编辑 .env 配置数据库和OSS

# 3. 初始化数据库
npm run init-db
npm run migrate-oss

# 4. 启动服务
npm run dev
```

## 📊 服务状态检查

| 检查项 | 命令 | 预期结果 |
|--------|------|----------|
| 健康检查 | `curl http://localhost:3000/health` | `"success": true` |
| 截图API | `curl "http://localhost:3000/api/screenshot?url=https://example.com"` | 返回OSS图片URL |
| Web界面 | 浏览器访问 `http://localhost:3000` | 可视化测试界面 |

## 🔧 配置要求

### 必需配置
- ✅ 阿里云OSS账号和存储桶
- ✅ MySQL数据库（本地或云端）

### 可选配置
- 🔧 自定义截图尺寸限制
- 🔧 缓存时长调整
- 🔧 服务端口设置

## 📁 文件结构

```
snap/
├── 🏗️ 部署相关
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── deploy-docker.sh      # 一键部署脚本
│   └── test-docker.sh        # 测试脚本
├── 💻 源代码
│   └── src/
│       ├── server.js         # 主服务
│       ├── oss-service.js    # OSS存储
│       ├── screenshot-service.js # 截图功能
│       └── scripts/          # 工具脚本
├── 🌐 前端
│   └── public/index.html     # Web测试界面
└── 📄 配置文件
    ├── .env.example          # 本地环境模板
    └── .env.docker.example   # Docker环境模板
```

## 🎯 API接口

### 截图接口
```http
GET /api/screenshot?url=https://example.com&width=800&height=600
```

### 响应格式
```json
{
  "success": true,
  "data": {
    "title": "网站标题",
    "screenshotUrl": "http://oss-url/screenshot.png",
    "cached": false
  }
}
```

## 🛠️ 故障排除

### 常见问题

1. **OSS上传失败**
   - 检查AccessKey配置
   - 确认endpoint使用bucket专用地址
   - 验证网络连接

2. **Playwright错误**
   - Docker环境已配置Debian基础镜像
   - 本地环境运行 `npm run install-playwright`

3. **数据库连接失败**
   - 检查MySQL服务状态
   - 验证连接参数配置

### 日志查看

```bash
# Docker环境
docker-compose logs -f app

# 本地环境
npm run dev  # 开发模式有详细日志
```

## 📈 性能优化

- ✅ 缓存机制减少重复截图
- ✅ OSS存储降低服务器负载
- ✅ 自动清理过期数据
- ✅ 并发请求支持

## 🔐 安全考虑

- ✅ URL参数验证
- ✅ 截图尺寸限制
- ✅ 请求超时控制
- ✅ 环境变量保护

---

**快速开始**: 运行 `./deploy-docker.sh` 即可完成部署！
