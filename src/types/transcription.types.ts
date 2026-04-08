/**
 * 语音转文字（ASR）相关类型定义
 */

/**
 * 讯飞开放平台配置
 */
export interface XiFeiConfig {
  /** 应用 ID */
  appId: string;
  /** API Key */
  apiKey: string;
  /** API Secret */
  apiSecret: string;
  /** 语言，默认中文普通话 */
  language?: string;
  /** 口音，默认 mandarin */
  accent?: string;
}

/**
 * 转写状态枚举
 */
export enum TranscriptionStatus {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  TRANSCRIBING = 'transcribing',
  DONE = 'done',
  ERROR = 'error',
}

/**
 * 单次转写结果
 */
export interface TranscriptionResult {
  /** 识别出的完整文本 */
  text: string;
  /** 转写耗时（ms） */
  duration: number;
  /** 音频文件路径（如有） */
  filePath?: string;
}

/**
 * 转写事件类型
 */
export enum TranscriptionEventType {
  /** 收到中间识别结果 */
  PARTIAL = 'partial',
  /** 收到最终识别结果 */
  FINAL = 'final',
  /** 转写出错 */
  ERROR = 'error',
  /** 状态变化 */
  STATUS_CHANGE = 'statusChange',
}
