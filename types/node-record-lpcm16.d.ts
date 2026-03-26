/**
 * node-record-lpcm16 类型声明
 */

import { Readable } from 'stream';

interface RecordOptions {
  /** 采样率（Hz） */
  sampleRateHertz?: number;
  /** 静音检测阈值 */
  threshold?: number;
  /** 静音超时（秒） */
  silence?: string;
  /** 录音器类型 */
  recorder?: 'sox' | 'arecord';
  /** 设备名称 */
  device?: string | null;
}

interface Recording {
  /** 获取音频流 */
  stream(): Readable;
  /** 开始录音 */
  start(): void;
  /** 停止录音 */
  stop(): void;
}

declare function record(options?: RecordOptions): Recording;

export = record;
