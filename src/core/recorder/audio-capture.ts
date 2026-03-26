/**
 * 音频捕获模块
 * 负责从麦克风捕获音频数据并转换为 PCM 格式
 */

import { EventEmitter } from 'eventemitter3';
import * as path from 'path';
import * as childProcess from 'child_process';
import { AudioConfig, RecordingStatus, AudioChunk, DEFAULT_AUDIO_CONFIG } from '../../types';
import { getLogger, Logger } from '../../utils/logger';

// 将项目内置的 sox 添加到 PATH，确保能找到它
const soxDir = path.resolve(__dirname, '../../../sox-14.4.2');
if (!process.env.PATH?.includes(soxDir)) {
  process.env.PATH = soxDir + path.delimiter + (process.env.PATH || '');
}

/**
 * 音频捕获器类
 * Windows 上直接调用 sox 录音并重采样，避免 node-microphone 的采样率问题
 */
export class AudioCapture extends EventEmitter {
  private config: AudioConfig;
  private soxProcess: childProcess.ChildProcess | null = null;
  private status: RecordingStatus = RecordingStatus.IDLE;
  private startTime: number = 0;
  private audioChunks: Buffer[] = [];
  private logger: Logger;

  constructor(config: Partial<AudioConfig> = {}) {
    super();
    this.config = { ...DEFAULT_AUDIO_CONFIG, ...config };
    this.logger = getLogger();
  }

  /**
   * 开始录音
   */
  async startRecording(): Promise<void> {
    this.logger.info('开始录音', { config: this.config });

    if (this.status === RecordingStatus.RECORDING) {
      throw new Error('录音已在进行中');
    }

    return new Promise((resolve, reject) => {
      try {
        this.audioChunks = [];

        const { sampleRate, channels, bitDepth } = this.config;

        // sox 命令：从 waveaudio 设备录制，直接输出目标采样率的 PCM raw 数据
        // -t waveaudio default  : 从 Windows 默认麦克风录制
        // -r <rate>             : 让 sox 直接以目标采样率采集（Windows waveaudio 驱动支持任意采样率转换）
        // -t raw -              : 输出原始 PCM 到 stdout
        const soxArgs = [
          '-q',                    // 静默模式，不输出进度信息
          '-t', 'waveaudio',
          '-r', String(sampleRate),
          '-c', String(channels),
          '-b', String(bitDepth),
          '-e', 'signed-integer',
          'default',
          '-t', 'raw',
          '-r', String(sampleRate),
          '-c', String(channels),
          '-b', String(bitDepth),
          '-e', 'signed-integer',
          '--endian', 'little',
          '-',
        ];

        this.logger.info('启动 sox 录音进程', { args: soxArgs });

        this.soxProcess = childProcess.spawn('sox', soxArgs, {
          env: process.env,
        });

        this.soxProcess.stdout!.on('data', (data: Buffer) => {
          this.audioChunks.push(data);
          this.emit('data', {
            buffer: data,
            timestamp: Date.now(),
            size: data.length,
          } as AudioChunk);
        });

        this.soxProcess.stderr!.on('data', (data: Buffer) => {
          const msg = data.toString().trim();
          if (msg) this.logger.debug('sox stderr', { msg });
        });

        this.soxProcess.on('error', (error: Error) => {
          this.logger.error('sox 进程错误', { error: error.message });
          this.emit('error', error);
          reject(error);
        });

        this.soxProcess.on('close', (code) => {
          if (code !== null && code !== 0 && this.status === RecordingStatus.RECORDING) {
            const err = new Error(`sox 进程异常退出，code: ${code}`);
            this.logger.error('sox 进程异常退出', { code });
            this.emit('error', err);
          }
        });

        this.status = RecordingStatus.RECORDING;
        this.startTime = Date.now();

        this.logger.info('录音已开始', { startTime: this.startTime });
        this.emit('statusChange', this.status);
        resolve();

      } catch (error) {
        this.logger.error('启动录音失败', { error });
        reject(error);
      }
    });
  }

  /**
   * 停止录音
   */
  async stopRecording(): Promise<Buffer> {
    this.logger.info('停止录音');

    if (this.status !== RecordingStatus.RECORDING) {
      throw new Error('没有正在进行的录音');
    }

    return new Promise((resolve, reject) => {
      try {
        if (!this.soxProcess) {
          reject(new Error('录音进程不存在'));
          return;
        }

        this.soxProcess.kill('SIGTERM');

        setTimeout(() => {
          const audioBuffer = Buffer.concat(this.audioChunks);
          const duration = Date.now() - this.startTime;

          this.logger.info('录音已停止', {
            duration,
            bufferSize: audioBuffer.length,
            sampleRate: this.config.sampleRate,
          });

          this.status = RecordingStatus.IDLE;
          this.soxProcess = null;
          this.audioChunks = [];

          this.emit('statusChange', this.status);
          this.emit('complete', { buffer: audioBuffer, duration });

          resolve(audioBuffer);
        }, 100);

      } catch (error) {
        this.logger.error('停止录音失败', { error });
        reject(error);
      }
    });
  }

  /**
   * 获取当前状态
   */
  getStatus(): RecordingStatus {
    return this.status;
  }

  /**
   * 获取录音时长（毫秒）
   */
  getDuration(): number {
    if (this.status === RecordingStatus.RECORDING) {
      return Date.now() - this.startTime;
    }
    return 0;
  }

  /**
   * 获取音频配置
   */
  getConfig(): AudioConfig {
    return { ...this.config };
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.logger.info('清理音频捕获器资源');

    if (this.soxProcess) {
      try {
        this.soxProcess.kill('SIGTERM');
      } catch (error) {
        this.logger.warn('停止录音进程时出错', { error });
      }
      this.soxProcess = null;
    }

    this.audioChunks = [];
    this.status = RecordingStatus.IDLE;
    this.removeAllListeners();
  }
}
