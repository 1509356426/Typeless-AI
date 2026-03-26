/**
 * 日志工具模块
 * 基于 Winston 实现结构化日志记录
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs-extra';

/**
 * 日志级别
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

/**
 * 日志配置接口
 */
export interface LoggerConfig {
  /** 日志级别 */
  level: LogLevel;
  /** 日志文件目录 */
  logDir: string;
  /** 是否输出到控制台 */
  console: boolean;
  /** 是否输出到文件 */
  file: boolean;
}

/**
 * 默认日志配置
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  logDir: path.join(process.cwd(), 'logs'),
  console: true,
  file: true,
};

/**
 * 日志格式化器
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // 添加元数据
    if (Object.keys(meta).length > 0) {
      // 排除 stack 字段，单独处理
      const { stack, ...rest } = meta as any;
      if (Object.keys(rest).length > 0) {
        log += ` ${JSON.stringify(rest)}`;
      }
      if (stack) {
        log += `\n${stack}`;
      }
    }

    return log;
  })
);

/**
 * Logger 类
 */
export class Logger {
  private logger: winston.Logger;

  constructor(config: Partial<LoggerConfig> = {}) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    // 确保日志目录存在
    fs.ensureDirSync(finalConfig.logDir);

    // 创建传输器数组
    const transports: winston.transport[] = [];

    // 控制台输出
    if (finalConfig.console) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            logFormat
          ),
        })
      );
    }

    // 文件输出
    if (finalConfig.file) {
      // 所有日志
      transports.push(
        new winston.transports.File({
          filename: path.join(finalConfig.logDir, 'combined.log'),
          format: logFormat,
        })
      );

      // 错误日志
      transports.push(
        new winston.transports.File({
          filename: path.join(finalConfig.logDir, 'error.log'),
          level: 'error',
          format: logFormat,
        })
      );
    }

    // 创建 Logger 实例
    this.logger = winston.createLogger({
      level: finalConfig.level,
      transports,
    });
  }

  /**
   * 记录错误日志
   */
  error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }

  /**
   * 记录警告日志
   */
  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  /**
   * 记录信息日志
   */
  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  /**
   * 记录调试日志
   */
  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.logger.level = level;
  }

  /**
   * 获取当前日志级别
   */
  getLevel(): string {
    return this.logger.level;
  }
}

/**
 * 默认 Logger 实例（单例）
 */
let defaultLogger: Logger | null = null;

/**
 * 获取默认 Logger 实例
 */
export function getLogger(config?: Partial<LoggerConfig>): Logger {
  if (!defaultLogger) {
    defaultLogger = new Logger(config);
  }
  return defaultLogger;
}
