const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateToOSS() {
  let connection;
  
  try {
    // 连接到数据库
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'screenshot_service'
    });

    console.log('连接到数据库成功');

    // 检查表是否存在
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'screenshots'"
    );

    if (tables.length === 0) {
      console.log('screenshots表不存在，无需迁移');
      return;
    }

    // 检查是否已经有screenshot_url字段
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM screenshots LIKE 'screenshot_url'"
    );

    if (columns.length > 0) {
      console.log('数据库已经迁移过，无需重复操作');
      return;
    }

    console.log('开始迁移数据库结构...');

    // 添加新的screenshot_url字段
    await connection.query(
      "ALTER TABLE screenshots ADD COLUMN screenshot_url VARCHAR(1024) COMMENT 'OSS截图文件URL' AFTER keywords"
    );

    console.log('添加screenshot_url字段成功');

    // 检查是否有旧的screenshot字段
    const [oldColumns] = await connection.query(
      "SHOW COLUMNS FROM screenshots LIKE 'screenshot'"
    );

    if (oldColumns.length > 0) {
      // 清空旧数据（因为base64数据无法直接转换为OSS URL）
      console.log('清空旧的base64截图数据...');
      await connection.query("DELETE FROM screenshots WHERE screenshot IS NOT NULL");
      
      // 删除旧的screenshot字段
      await connection.query("ALTER TABLE screenshots DROP COLUMN screenshot");
      console.log('删除旧的screenshot字段成功');
    }

    console.log('数据库迁移完成！');
    console.log('注意：所有旧的截图缓存已被清空，新的请求将使用OSS存储');

  } catch (error) {
    console.error('数据库迁移失败:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateToOSS();
}

module.exports = migrateToOSS;
