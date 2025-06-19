# Website Screenshot Service

一个基于 Node.js、Playwright 和 MySQL 的网站截图服务，支持缓存机制。

## 功能特性

- 🖼️ 网站截图功能
- 📄 自动提取网站基础信息（标题、描述、关键词）
- ☁️ 阿里云OSS存储（图片存储在云端）
- 💾 MySQL 数据库存储
- ⚡ 智能缓存机制（默认7天）
- 🛡️ 安全性保护
- 📱 响应式截图
- 🐳 Docker 部署支持
- 🧹 自动清理过期数据

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 安装 Playwright 浏览器

```bash
npm run install-playwright
```

### 3. 配置环境变量

复制 `.env.example` 到 `.env` 并修改配置：

```bash
cp .env.example .env
```

**重要**: 请确保配置正确的阿里云OSS参数：
- `ALIOSS_ACCESS_KEY_ID`: 阿里云AccessKey ID
- `ALIOSS_ACCESS_KEY_SECRET`: 阿里云AccessKey Secret
- `ALIOSS_BUCKET_NAME`: OSS存储桶名称
- `ALIOSS_REGION`: OSS区域
- `ALIOSS_ENDPOINT`: OSS访问端点

### 4. 数据库迁移（首次运行或升级）

```bash
# 初始化数据库
npm run init-db

# 迁移到OSS存储（如果从旧版本升级）
npm run migrate-oss
```

### 5. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## Docker 部署

### 方式一：使用部署脚本（推荐）

1. 配置OSS参数：
```bash
cp .env.docker.example .env.docker
# 编辑 .env.docker 填入实际的OSS配置
```

2. 运行部署脚本：
```bash
./deploy-docker.sh
```

### 方式二：手动部署

1. 构建镜像：
```bash
docker-compose build
```

2. 启动服务：
```bash
# 设置环境变量
export ALIOSS_ACCESS_KEY_ID=your_key
export ALIOSS_ACCESS_KEY_SECRET=your_secret
export ALIOSS_BUCKET_NAME=your_bucket
export ALIOSS_REGION=your_region
export ALIOSS_ENDPOINT=https://your_bucket.oss-region.aliyuncs.com

# 启动
docker-compose up -d
```

3. 查看状态：
```bash
docker-compose ps
docker-compose logs -f app
```

### Docker 管理命令

```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart app

# 查看日志
docker-compose logs -f app

# 进入容器
docker-compose exec app bash
```

## API 接口

### 获取网站截图

```
GET /api/screenshot?url=https://example.com&width=1200&height=800
```

**参数：**
- `url` (必需): 要截图的网站URL
- `width` (可选): 截图宽度，默认 1200
- `height` (可选): 截图高度，默认 800
- `fullPage` (可选): 是否全页截图，默认 false

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "url": "https://example.com",
    "title": "网站标题",
    "description": "网站描述",
    "keywords": "关键词",
    "screenshotUrl": "http://bucket.oss-region.aliyuncs.com/screenshots/xxx.png",
    "width": 1200,
    "height": 800,
    "fullPage": false,
    "cached": false,
    "createdAt": "2025-06-19T10:00:00.000Z"
  }
}
```

### 健康检查

```
GET /health
```

**响应：**
```json
{
  "success": true,
  "message": "服务运行正常",
  "timestamp": "2025-06-19T10:00:00.000Z",
  "services": {
    "oss": {
      "status": "healthy",
      "message": "OSS连接正常"
    }
  }
}
```

### 清理缓存

```
POST /api/cleanup
```

**响应：**
```json
{
  "success": true,
  "message": "已清理 10 条过期记录",
  "details": {
    "deletedRecords": 10,
    "deletedFiles": 10
  }
}
```

## 配置说明

### 环境变量配置：

**基本配置：**
- `PORT`: 服务端口，默认 3000
- `DB_HOST`: MySQL 主机地址
- `DB_PORT`: MySQL 端口
- `DB_USER`: MySQL 用户名
- `DB_PASSWORD`: MySQL 密码
- `DB_NAME`: 数据库名称
- `CACHE_DURATION_DAYS`: 缓存时长（天），默认 7
- `SCREENSHOT_TIMEOUT`: 截图超时时间（毫秒），默认 30000
- `MAX_SCREENSHOT_WIDTH`: 最大截图宽度，默认 1920
- `MAX_SCREENSHOT_HEIGHT`: 最大截图高度，默认 1080

**阿里云OSS配置：**
- `ALIOSS_ACCESS_KEY_ID`: 阿里云AccessKey ID
- `ALIOSS_ACCESS_KEY_SECRET`: 阿里云AccessKey Secret
- `ALIOSS_BUCKET_NAME`: OSS存储桶名称
- `ALIOSS_REGION`: OSS区域（如：oss-us-west-1）
- `ALIOSS_ENDPOINT`: OSS访问端点（如：https://bucket.oss-region.aliyuncs.com）

## 数据库结构

```sql
CREATE TABLE screenshots (
  id VARCHAR(36) PRIMARY KEY,
  url VARCHAR(2048) NOT NULL,
  title TEXT,
  description TEXT,
  keywords TEXT,
  screenshot_url VARCHAR(1024),
  width INT,
  height INT,
  full_page BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_url (url(255)),
  INDEX idx_created_at (created_at)
);
```

## 项目结构

```
.
├── src/
│   ├── server.js           # 主服务器文件
│   ├── database.js         # 数据库操作
│   ├── screenshot-service.js # 截图服务
│   ├── oss-service.js      # OSS存储服务
│   ├── validation.js       # 参数验证
│   └── scripts/
│       ├── init-db.js      # 数据库初始化
│       └── migrate-to-oss.js # OSS迁移脚本
├── public/
│   └── index.html          # Web测试界面
├── docker-compose.yml      # Docker编排
├── Dockerfile             # Docker镜像
└── deploy-docker.sh       # Docker部署脚本
```

## 故障排除

### OSS相关问题

1. **AccessDenied错误**：
   - 检查AccessKey ID和Secret是否正确
   - 确认endpoint配置正确（使用bucket专用endpoint）
   - 验证bucket权限设置

2. **文件上传失败**：
   - 检查网络连接
   - 确认bucket存在且可写
   - 验证文件大小是否超限

### Docker相关问题

1. **容器启动失败**：
   - 检查环境变量配置
   - 查看容器日志：`docker-compose logs app`
   - 确认端口未被占用

2. **Playwright安装问题**：
   - 使用Debian镜像而非Alpine
   - 确保安装了必要的系统依赖

## License

MIT
