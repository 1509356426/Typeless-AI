/**
 * 文件管理器模块
 * 负责将 PCM 音频数据保存为 WAV 文件
 */

import { promises as fs } from 'fs';
import path from 'path';
import { FileWriter } from 'wav';
import { FileManagerConfig, RecordingResult } from '../../types';
import { getLogger, Logger } from '../../utils/logger';

/**
 * 默认文件管理器配置
 */
const DEFAULT_CONFIG: FileManagerConfig = {
  outputDir: path.join(process.cwd(), 'recordings'),
  filenameTemplate: 'recording_{timestamp}.wav',
  autoCleanupDays: 7,
};

/**
 * 文件管理器类
 */
export class FileManager {
  private config: FileManagerConfig;
  private logger: Logger;

  constructor(config: Partial<FileManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = getLogger();
  }

  /**
   * 初始化文件管理器
   */
  async initialize(): Promise<void> {
    this.logger.info('初始化文件管理器', { config: this.config });

    // 确保输出目录存在
    await fs.mkdir(this.config.outputDir, { recursive: true });

    this.logger.info('文件管理器初始化完成', { outputDir: this.config.outputDir });
  }

  /**
   * 生成文件名
   */
  private generateFileName(): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return this.config.filenameTemplate.replace('{timestamp}', timestamp);
  }

  /**
   * 保存 PCM 数据为 WAV 文件
   * @param pcmBuffer PCM 音频数据
   * @param sampleRate 采样率
   * @param channels 声道数
   * @param bitDepth 位深度
   */
  async saveRecording(
    pcmBuffer: Buffer,
    sampleRate: number,
    channels: number = 1,
    bitDepth: number = 16,
    recordingDuration?: number
  ): Promise<RecordingResult> {
    this.logger.info('保存录音文件', {
      bufferSize: pcmBuffer.length,
      sampleRate,
      channels,
      bitDepth,
    });

    const startTime = new Date();

    try {
      // 生成文件名和路径
      const filename = this.generateFileName();
      const filePath = path.join(this.config.outputDir, filename);

      // 创建 WAV 文件写入器
      const writer = new FileWriter(filePath, {
        sampleRate,
        channels,
        bitDepth,
      });

      // 写入 PCM 数据
      return new Promise<RecordingResult>((resolve, reject) => {
        writer.on('finish', () => {
          const endTime = new Date();
          const duration = recordingDuration ?? (endTime.getTime() - startTime.getTime());

          // 获取文件信息
          fs.stat(filePath)
            .then((stats) => {
              const result: RecordingResult = {
                filePath,
                duration,
                fileSize: stats.size,
                startTime,
                endTime,
              };

              this.logger.info('录音文件保存成功', {
                filePath,
                fileSize: stats.size,
                duration,
              });

              resolve(result);
            })
            .catch((error) => {
              // 即使获取文件信息失败，也返回结果
              const result: RecordingResult = {
                filePath,
                duration,
                fileSize: pcmBuffer.length,
                startTime,
                endTime,
              };
              resolve(result);
            });
        });

        writer.on('error', (error: Error) => {
          this.logger.error('写入 WAV 文件失败', { error, filePath });
          reject(error);
        });

        // 写入数据
        writer.write(pcmBuffer);
        writer.end();
      });

    } catch (error) {
      this.logger.error('保存录音文件失败', { error });
      throw error;
    }
  }

  /**
   * 清理过期文件
   */
  async cleanupOldFiles(): Promise<void> {
    if (this.config.autoCleanupDays <= 0) {
      this.logger.debug('自动清理未启用');
      return;
    }

    this.logger.info('开始清理过期文件', { days: this.config.autoCleanupDays });

    try {
      const files = await fs.readdir(this.config.outputDir);
      const now = Date.now();
      const maxAge = this.config.autoCleanupDays * 24 * 60 * 60 * 1000;

      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.config.outputDir, file);
        const stats = await fs.stat(filePath);

        // 检查文件年龄
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
          this.logger.debug('删除过期文件', { filePath, age: now - stats.mtime.getTime() });
        }
      }

      this.logger.info('清理完成', { deletedCount, totalFiles: files.length });

    } catch (error) {
      this.logger.error('清理过期文件失败', { error });
    }
  }

  /**
   * 获取存储空间信息
   */
  async getStorageInfo(): Promise<{
    totalSize: number;
    fileCount: number;
    oldestFile: string | null;
  }> {
    try {
      const files = await fs.readdir(this.config.outputDir);
      let totalSize = 0;
      let oldestTime = Date.now();
      let oldestFile: string | null = null;

      for (const file of files) {
        const filePath = path.join(this.config.outputDir, file);
        const stats = await fs.stat(filePath);

        totalSize += stats.size;

        if (stats.mtime.getTime() < oldestTime) {
          oldestTime = stats.mtime.getTime();
          oldestFile = file;
        }
      }

      return {
        totalSize,
        fileCount: files.length,
        oldestFile,
      };

    } catch (error) {
      this.logger.error('获取存储信息失败', { error });
      return {
        totalSize: 0,
        fileCount: 0,
        oldestFile: null,
      };
    }
  }

  /**
   * 清理所有文件（慎用！）
   */
  async clearAllFiles(): Promise<void> {
    this.logger.warn('清理所有录音文件');

    try {
      const files = await fs.readdir(this.config.outputDir);

      for (const file of files) {
        const filePath = path.join(this.config.outputDir, file);
        await fs.unlink(filePath);
      }

      this.logger.info('所有文件已清理', { count: files.length });

    } catch (error) {
      this.logger.error('清理所有文件失败', { error });
      throw error;
    }
  }
}
