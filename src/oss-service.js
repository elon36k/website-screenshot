const OSS = require('ali-oss');
const crypto = require('crypto');

class OSSService {
  constructor() {
    this.client = null;
    this.bucketName = process.env.ALIOSS_BUCKET_NAME;
    this.region = process.env.ALIOSS_REGION;
    this.endpoint = process.env.ALIOSS_ENDPOINT;
  }

  async initialize() {
    if (!this.client) {
      this.client = new OSS({
        accessKeyId: process.env.ALIOSS_ACCESS_KEY_ID,
        accessKeySecret: process.env.ALIOSS_ACCESS_KEY_SECRET,
        bucket: this.bucketName,
        endpoint: this.endpoint,
        secure: true,
      });
      console.log('OSS client initialized');
    }
  }

  /**
   * 上传截图到OSS
   * @param {Buffer} imageBuffer - 图片buffer
   * @param {string} url - 网站URL，用于生成文件名
   * @param {Object} options - 截图选项
   * @returns {string} OSS文件URL
   */
  async uploadScreenshot(imageBuffer, url, options = {}) {
    await this.initialize();

    // 生成唯一文件名
    const urlHash = crypto.createHash('md5').update(url).digest('hex');
    // const urlHash = url.replace(/^https?\:\/\//i, "").replace(/[^a-zA-Z0-9.\-_]/g,"_")

    const timestamp = Date.now();
    const { width, height, fullPage } = options;
    const suffix = fullPage ? 'full' : `${width}x${height}`;
    const fileName = `screenshots/${urlHash}_${suffix}_${timestamp}.png`;

    try {
      // 上传文件到OSS
      const result = await this.client.put(fileName, imageBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000' // 缓存1年
        }
      });

      console.log(`Screenshot uploaded to OSS: ${result.url}`);
      return result.url;
    } catch (error) {
      console.error('OSS upload error:', error);
      throw new Error(`OSS上传失败: ${error.message}`);
    }
  }

  /**
   * 删除OSS中的文件
   * @param {string} ossUrl - OSS文件URL
   */
  async deleteFile(ossUrl) {
    await this.initialize();

    try {
      // 从URL中提取文件名
      const urlObj = new URL(ossUrl);
      const fileName = urlObj.pathname.substring(1); // 移除开头的/

      await this.client.delete(fileName);
      console.log(`File deleted from OSS: ${fileName}`);
    } catch (error) {
      console.error('OSS delete error:', error);
      // 删除失败不影响主流程，只记录错误
    }
  }

  /**
   * 批量删除过期文件
   * @param {Array} ossUrls - OSS文件URL数组
   */
  async deleteFiles(ossUrls) {
    if (!ossUrls || ossUrls.length === 0) return;

    await this.initialize();

    try {
      const fileNames = ossUrls.map(url => {
        const urlObj = new URL(url);
        return urlObj.pathname.substring(1);
      });

      await this.client.deleteMulti(fileNames);
      console.log(`Deleted ${fileNames.length} files from OSS`);
    } catch (error) {
      console.error('OSS batch delete error:', error);
    }
  }

  /**
   * 检查OSS连接状态
   */
  async healthCheck() {
    try {
      await this.initialize();
      // 尝试列出bucket信息来验证连接
      await this.client.getBucketInfo();
      return { status: 'healthy', message: 'OSS连接正常' };
    } catch (error) {
      return { status: 'error', message: `OSS连接失败: ${error.message}` };
    }
  }
}

module.exports = OSSService;
