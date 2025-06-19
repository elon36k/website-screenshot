# Website Screenshot Service

一个基于 Node.js、Playwright 和 MySQL 的网站截图服务，支持缓存机制。

## 功能特性

- 🖼️ 网站截图功能
- 📄 自动提取网站基础信息（标题、描述、关键词）
- 💾 MySQL 数据库存储
- ⚡ 智能缓存机制（默认7天）
- 🛡️ 安全性保护
- 📱 响应式截图

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

### 4. 初始化数据库

```bash
npm run init-db
```

### 5. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
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
    "screenshot": "base64编码的图片数据",
    "cached": false,
    "createdAt": "2025-06-19T10:00:00.000Z"
  }
}
```

## 配置说明

环境变量配置：

- `PORT`: 服务端口，默认 3000
- `DB_HOST`: MySQL 主机地址
- `DB_PORT`: MySQL 端口
- `DB_USER`: MySQL 用户名
- `DB_PASSWORD`: MySQL 密码
- `DB_NAME`: 数据库名称
- `CACHE_DURATION_DAYS`: 缓存时长（天），默认 7
- `SCREENSHOT_TIMEOUT`: 截图超时时间（毫秒），默认 30000

## 数据库结构

```sql
CREATE TABLE screenshots (
  id VARCHAR(36) PRIMARY KEY,
  url VARCHAR(2048) NOT NULL,
  title TEXT,
  description TEXT,
  keywords TEXT,
  screenshot LONGTEXT,
  width INT,
  height INT,
  full_page BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_url (url(255)),
  INDEX idx_created_at (created_at)
);
```

## License

MIT
