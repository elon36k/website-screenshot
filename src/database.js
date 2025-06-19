const mysql = require('mysql2/promise');
require('dotenv').config();

class Database {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  async query(sql, params = []) {
    try {
      // 对于有参数的查询使用 execute，无参数的使用 query
      if (params.length > 0) {
        const [results] = await this.pool.execute(sql, params);
        return results;
      } else {
        const [results] = await this.pool.query(sql);
        return results;
      }
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async findScreenshotByUrl(url, width, height, fullPage) {
    const cacheDurationDays = parseInt(process.env.CACHE_DURATION_DAYS) || 7;
    const sql = `
      SELECT * FROM screenshots 
      WHERE url = ? 
        AND width = ? 
        AND height = ? 
        AND full_page = ?
        AND created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const results = await this.query(sql, [url, width, height, fullPage, cacheDurationDays]);
    return results.length > 0 ? results[0] : null;
  }

  async saveScreenshot(data) {
    const sql = `
      INSERT INTO screenshots (
        id, url, title, description, keywords, 
        screenshot_url, width, height, full_page, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const params = [
      data.id,
      data.url,
      data.title,
      data.description,
      data.keywords,
      data.screenshotUrl,
      data.width,
      data.height,
      data.fullPage
    ];
    
    await this.query(sql, params);
    return data;
  }

  async deleteOldScreenshots() {
    const cacheDurationDays = parseInt(process.env.CACHE_DURATION_DAYS) || 7;
    
    // 首先获取要删除的记录的OSS URL
    const selectSql = `
      SELECT screenshot_url FROM screenshots 
      WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
        AND screenshot_url IS NOT NULL
    `;
    const oldRecords = await this.query(selectSql, [cacheDurationDays]);
    const ossUrls = oldRecords.map(record => record.screenshot_url);
    
    // 删除数据库记录
    const deleteSql = `
      DELETE FROM screenshots 
      WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    const result = await this.query(deleteSql, [cacheDurationDays]);
    
    return {
      deletedCount: result.affectedRows,
      ossUrls: ossUrls
    };
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = Database;
