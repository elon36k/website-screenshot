const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const Database = require('./database');
const ScreenshotService = require('./screenshot-service');
const OSSService = require('./oss-service');
const { validateScreenshotRequest } = require('./validation');

const app = express();
const port = process.env.PORT || 3000;

// 初始化服务
const db = new Database();
const ossService = new OSSService();
const screenshotService = new ScreenshotService();

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());

// 静态文件服务
app.use(express.static('public'));

// 错误处理中间件
const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);
  
  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      error: '数据库连接失败',
      message: '请检查数据库配置'
    });
  }
  
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    message: error.message
  });
};

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 健康检查接口
app.get('/health', async (req, res) => {
  try {
    // 检查OSS连接状态
    const ossHealth = await ossService.healthCheck();
    
    res.json({
      success: true,
      message: '服务运行正常',
      timestamp: new Date().toISOString(),
      services: {
        oss: ossHealth
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务检查失败',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// 截图接口
app.get('/api/screenshot', validateScreenshotRequest, async (req, res) => {
  try {
    const { url, width, height, fullPage } = req.validatedQuery;
    
    console.log(`处理截图请求: ${url} (${width}x${height}, fullPage: ${fullPage})`);
    
    // 检查缓存
    const cachedScreenshot = await db.findScreenshotByUrl(url, width, height, fullPage);
    
    if (cachedScreenshot) {
      console.log('使用缓存的截图');
      return      res.json({
        success: true,
        data: {
          id: cachedScreenshot.id,
          url: cachedScreenshot.url,
          title: cachedScreenshot.title,
          description: cachedScreenshot.description,
          keywords: cachedScreenshot.keywords,
          screenshotUrl: cachedScreenshot.screenshot_url,
          width: cachedScreenshot.width,
          height: cachedScreenshot.height,
          fullPage: Boolean(cachedScreenshot.full_page),
          cached: true,
          createdAt: cachedScreenshot.created_at
        }
      });
    }
    
    // 生成新的截图
    console.log('生成新的截图');
    const screenshotData = await screenshotService.takeScreenshot(url, {
      width,
      height,
      fullPage
    });
    
    // 保存到数据库
    const id = uuidv4();
    const savedData = await db.saveScreenshot({
      id,
      ...screenshotData
    });
    
    console.log('截图生成并保存成功');
    
    res.json({
      success: true,
      data: {
        id,
        url: screenshotData.url,
        title: screenshotData.title,
        description: screenshotData.description,
        keywords: screenshotData.keywords,
        screenshotUrl: screenshotData.screenshotUrl,
        width: screenshotData.width,
        height: screenshotData.height,
        fullPage: screenshotData.fullPage,
        cached: false,
        createdAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('截图请求处理失败:', error);
    res.status(500).json({
      success: false,
      error: '截图生成失败',
      message: error.message
    });
  }
});

// 清理过期缓存接口
app.post('/api/cleanup', async (req, res) => {
  try {
    const result = await db.deleteOldScreenshots();
    
    // 同时清理OSS中的文件
    if (result.ossUrls && result.ossUrls.length > 0) {
      try {
        await ossService.deleteFiles(result.ossUrls);
        console.log(`已清理OSS中的 ${result.ossUrls.length} 个文件`);
      } catch (ossError) {
        console.error('OSS文件清理失败:', ossError);
        // OSS清理失败不影响主流程
      }
    }
    
    res.json({
      success: true,
      message: `已清理 ${result.deletedCount} 条过期记录`,
      details: {
        deletedRecords: result.deletedCount,
        deletedFiles: result.ossUrls.length
      }
    });
  } catch (error) {
    console.error('清理缓存失败:', error);
    res.status(500).json({
      success: false,
      error: '清理缓存失败',
      message: error.message
    });
  }
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
    message: `路径 ${req.originalUrl} 未找到`
  });
});

// 错误处理
app.use(errorHandler);

// 优雅关闭
const gracefulShutdown = async () => {
  console.log('正在关闭服务...');
  
  try {
    await screenshotService.close();
    await db.close();
    console.log('服务已安全关闭');
    process.exit(0);
  } catch (error) {
    console.error('关闭服务时出错:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// 启动服务器
const server = app.listen(port, () => {
  console.log(`截图服务已启动，端口: ${port}`);
  console.log(`健康检查: http://localhost:${port}/health`);
  console.log(`截图接口: http://localhost:${port}/api/screenshot?url=https://example.com`);
});

// 定期清理过期缓存 (每天执行一次)
setInterval(async () => {
  try {
    const result = await db.deleteOldScreenshots();
    
    // 同时清理OSS中的文件
    if (result.ossUrls && result.ossUrls.length > 0) {
      try {
        await ossService.deleteFiles(result.ossUrls);
        console.log(`自动清理了 ${result.deletedCount} 条过期记录和 ${result.ossUrls.length} 个OSS文件`);
      } catch (ossError) {
        console.error('OSS文件自动清理失败:', ossError);
        console.log(`自动清理了 ${result.deletedCount} 条过期记录（OSS清理失败）`);
      }
    } else if (result.deletedCount > 0) {
      console.log(`自动清理了 ${result.deletedCount} 条过期记录`);
    }
  } catch (error) {
    console.error('自动清理缓存失败:', error);
  }
}, 24 * 60 * 60 * 1000); // 24小时

module.exports = app;
