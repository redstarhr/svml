const winston = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

/**
 * 本番環境でない場合、ログに色を付けた読みやすいフォーマットを定義します。
 */
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  // 本番環境ではJSON形式、開発環境では色付きの読みやすい形式を使用します
  format: process.env.NODE_ENV === 'production'
    ? combine(timestamp(), errors({ stack: true }), json())
    : combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        consoleFormat
      ),
  transports: [
    // 常にコンソールに出力します
    new winston.transports.Console(),
  ],
});

// 本番環境の場合、ファイルにもログを記録します
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
  }));
  logger.add(new winston.transports.File({
    filename: path.join('logs', 'combined.log'),
  }));
}

module.exports = logger;