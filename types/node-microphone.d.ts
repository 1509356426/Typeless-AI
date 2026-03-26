/**
 * node-microphone 类型声明
 */

declare module 'node-microphone' {
  interface MicOptions {
    /** 采样率，如 16000 */
    rate?: number;
    /** 声道数，如 1 */
    channels?: number;
    /** 比特深度，如 16 */
    bitwidth?: number;
    /** 编码方式 */
    encoding?: string;
    /** 字节序 */
    endian?: string;
    /** 音频设备 */
    device?: string;
  }

  interface MicStream extends NodeJS.ReadableStream {
    on(event: 'data', callback: (data: Buffer) => void): this;
    on(event: 'error', callback: (error: Error) => void): this;
    on(event: 'close', callback: () => void): this;
    on(event: string, callback: (...args: any[]) => void): this;
  }

  class Microphone {
    constructor(options?: MicOptions);

    /** 开始录音，返回音频流 */
    startRecording(): MicStream;

    /** 停止录音 */
    stopRecording(): void;
  }

  export = Microphone;
}
