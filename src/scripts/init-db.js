const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDatabase() {
  console.log('开始初始化数据库...');
  
  try {
    // 连接到 MySQL 服务器（不指定数据库）
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD
    });

    const dbName = process.env.DB_NAME || 'screenshot_service';
    
    // 创建数据库（如果不存在）
    console.log(`创建数据库 ${dbName}...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    // 关闭当前连接，重新连接到新数据库
    await connection.end();
    
    // 重新连接到指定的数据库
    const dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: dbName
    });
    
    // 创建截图表
    console.log('创建 screenshots 表...');
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS screenshots (
        id VARCHAR(36) PRIMARY KEY COMMENT '唯一标识符',
        url VARCHAR(2048) NOT NULL COMMENT '网站URL',
        title TEXT COMMENT '网站标题',
        description TEXT COMMENT '网站描述',
        keywords TEXT COMMENT '网站关键词',
        screenshot_url VARCHAR(1024) COMMENT 'OSS截图文件URL',
        width INT NOT NULL COMMENT '截图宽度',
        height INT NOT NULL COMMENT '截图高度',
        full_page BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否全页截图',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        INDEX idx_url (url(255)) COMMENT 'URL索引',
        INDEX idx_created_at (created_at) COMMENT '创建时间索引',
        INDEX idx_url_size (url(255), width, height, full_page) COMMENT '复合索引用于缓存查询'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='网站截图缓存表'
    `;
    
    await dbConnection.query(createTableSQL);
    
    console.log('数据库初始化完成！');
    console.log(`数据库名称: ${dbName}`);
    console.log('表结构:');
    console.log('- screenshots: 存储网站截图和基本信息');
    
    await dbConnection.end();
    
  } catch (error) {
    console.error('数据库初始化失败:', error);
    console.error('请检查以下配置:');
    console.error(`- DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
    console.error(`- DB_PORT: ${process.env.DB_PORT || 3306}`);
    console.error(`- DB_USER: ${process.env.DB_USER || 'root'}`);
    console.error(`- DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' : '(未设置)'}`);
    console.error(`- DB_NAME: ${process.env.DB_NAME || 'screenshot_service'}`);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
