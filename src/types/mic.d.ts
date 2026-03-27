/**
 * mic 类型声明
 */

declare module 'mic' {
  interface MicOptions {
    /** 采样率，如 '16000' */
    rate?: string;
    /** 声道数，如 '1' */
    channels?: string;
    /** 是否启用调试模式 */
    debug?: boolean;
    /** 静音后退出时间（秒） */
    exitOnSilence?: number;
    /** 文件编码 */
    encoding?: string;
    /** 比特深度 */
    bitwidth?: string;
  }

  interface Mic {
    /** 获取音频流 */
    getAudioStream(): any;
    /** 开始录音 */
    start(): void;
    /** 停止录音 */
    stop(): void;
    /** 暂停录音 */
    pause(): void;
    /** 恢复录音 */
    resume(): void;
  }

  interface MicModule {
    (options?: MicOptions): Mic;
  }

  const mic: MicModule;
  export = mic;
}
