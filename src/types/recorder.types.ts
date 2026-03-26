/**
 * Typeless-AI 录音模块类型定义
 * 包含录音状态、音频配置、事件类型等核心类型
 */

/**
 * 录音状态枚举
 */
export enum RecordingStatus {
  /** 空闲状态，未开始录音 */
  IDLE = 'idle',
  /** 正在录音 */
  RECORDING = 'recording',
  /** 已暂停 */
  PAUSED = 'paused',
}

/**
 * 音频配置接口
 */
export interface AudioConfig {
  /** 采样率（Hz），默认 16000（讯飞 ASR 要求） */
  sampleRate: number;
  /** 声道数，1 为单声道 */
  channels: number;
  /** 位深度，默认 16-bit */
  bitDepth: number;
  /** 静音检测阈值（0-1），用于自动停止录音 */
  threshold: number;
  /** 静音超时时间（毫秒），超过此时间无声音则自动停止 */
  silenceTimeout: number;
}

/**
 * 默认音频配置
 */
export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  sampleRate: 16000,
  channels: 1,
  bitDepth: 16,
  threshold: 0.5,
  silenceTimeout: 1500,
};

/**
 * 热键配置接口
 */
export interface HotkeyConfig {
  /** 主键码（如 'space'） */
  key: string;
  /** 修饰键数组（如 ['ctrl']） */
  modifiers: string[];
  /** 完整的热键字符串表示（如 'Ctrl+Space'） */
  toString(): string;
}

/**
 * 录音事件类型
 */
export enum RecorderEventType {
  /** 录音开始 */
  START = 'start',
  /** 录音停止 */
  STOP = 'stop',
  /** 录音暂停 */
  PAUSE = 'pause',
  /** 录音恢复 */
  RESUME = 'resume',
  /** 错误发生 */
  ERROR = 'error',
  /** 状态变化 */
  STATE_CHANGE = 'state_change',
}

/**
 * 录音事件数据接口
 */
export interface RecorderEventData {
  /** 事件类型 */
  type: RecorderEventType;
  /** 事件时间戳 */
  timestamp: number;
  /** 当前状态 */
  status: RecordingStatus;
  /** 错误信息（仅错误事件） */
  error?: Error;
  /** 录音文件路径（仅停止事件） */
  filePath?: string;
  /** 录音时长（毫秒，仅停止事件） */
  duration?: number;
}

/**
 * 热键监听器回调类型
 */
export type HotkeyCallback = () => void | Promise<void>;

/**
 * 音频数据块接口
 */
export interface AudioChunk {
  /** PCM 数据缓冲区 */
  buffer: Buffer;
  /** 数据块时间戳 */
  timestamp: number;
  /** 数据块大小（字节） */
  size: number;
}

/**
 * 录音结果接口
 */
export interface RecordingResult {
  /** 录音文件路径 */
  filePath: string;
  /** 录音时长（毫秒） */
  duration: number;
  /** 文件大小（字节） */
  fileSize: number;
  /** 录音开始时间 */
  startTime: Date;
  /** 录音结束时间 */
  endTime: Date;
}

/**
 * 文件管理器配置接口
 */
export interface FileManagerConfig {
  /** 录音文件保存目录 */
  outputDir: string;
  /** 文件命名模板，支持 {timestamp} 占位符 */
  filenameTemplate: string;
  /** 自动清理天数，0 表示不清理 */
  autoCleanupDays: number;
}

/**
 * 状态转换动作
 */
export enum StateAction {
  START = 'start',
  STOP = 'stop',
  PAUSE = 'pause',
  RESUME = 'resume',
}

/**
 * 状态转换规则
 */
export interface StateTransition {
  /** 当前状态 */
  from: RecordingStatus;
  /** 目标状态 */
  to: RecordingStatus;
  /** 触发动作 */
  action: StateAction;
}
