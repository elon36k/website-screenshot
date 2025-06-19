const { chromium } = require('playwright');
const OSSService = require('./oss-service');

class ScreenshotService {
  constructor() {
    this.browser = null;
    this.timeout = parseInt(process.env.SCREENSHOT_TIMEOUT) || 30000;
    this.maxWidth = parseInt(process.env.MAX_SCREENSHOT_WIDTH) || 1920;
    this.maxHeight = parseInt(process.env.MAX_SCREENSHOT_HEIGHT) || 1080;
    this.ossService = new OSSService();
  }

  async initialize() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920,1080'
        ]
      });
    }
  }

  async takeScreenshot(url, options = {}) {
    const {
      width = 1200,
      height = 800,
      fullPage = false
    } = options;

    // 验证和限制尺寸
    const screenshotWidth = Math.min(Math.max(width, 320), this.maxWidth);
    const screenshotHeight = Math.min(Math.max(height, 240), this.maxHeight);

    console.log('初始化Playwright浏览器...');
    await this.initialize();
    console.log('浏览器初始化完成');

    console.log('创建浏览器上下文...');
    const context = await this.browser.newContext({
      viewport: { width: screenshotWidth, height: screenshotHeight },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });

    console.log('创建新页面...');
    const page = await context.newPage();

    try {
      // 设置超时
      page.setDefaultTimeout(this.timeout);
      page.setDefaultNavigationTimeout(this.timeout);

      console.log(`开始访问页面: ${url}`);
      // 访问页面
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: this.timeout 
      });
      console.log('页面访问完成');

      // 等待页面加载完成
      console.log('等待页面加载...');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000); // 额外等待2秒确保内容渲染
      console.log('页面加载完成');

      // 提取网站信息
      console.log('提取页面信息...');
      const pageInfo = await page.evaluate(() => {
        const title = document.title || '';
        
        const descriptionMeta = document.querySelector('meta[name="description"]') ||
                               document.querySelector('meta[property="og:description"]');
        const description = descriptionMeta ? descriptionMeta.getAttribute('content') || '' : '';
        
        const keywordsMeta = document.querySelector('meta[name="keywords"]');
        const keywords = keywordsMeta ? keywordsMeta.getAttribute('content') || '' : '';

        return { title, description, keywords };
      });
      console.log('页面信息提取完成:', pageInfo);

      // 截图
      console.log('开始截图...');
      const screenshotBuffer = await page.screenshot({
        fullPage: fullPage,
        type: 'png'
      });
      console.log('截图完成');

      // 上传到OSS
      console.log('开始上传到OSS...');
      const screenshotUrl = await this.ossService.uploadScreenshot(
        screenshotBuffer, 
        url, 
        { width: screenshotWidth, height: screenshotHeight, fullPage }
      );
      console.log('OSS上传完成:', screenshotUrl);

      return {
        url,
        title: pageInfo.title,
        description: pageInfo.description,
        keywords: pageInfo.keywords,
        screenshotUrl,
        width: screenshotWidth,
        height: screenshotHeight,
        fullPage
      };

    } catch (error) {
      console.error('Screenshot error:', error);
      throw new Error(`截图失败: ${error.message}`);
    } finally {
      await context.close();
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = ScreenshotService;
