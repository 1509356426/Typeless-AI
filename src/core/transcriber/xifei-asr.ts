/**
 * 讯飞语音识别 WebSocket 客户端
 * 文档：https://www.xfyun.cn/doc/asr/voicedictation/API.html
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import { EventEmitter } from 'eventemitter3';
import WebSocket from 'ws';
import { XiFeiConfig, TranscriptionStatus, TranscriptionEventType } from '../../types';
import { getLogger, Logger } from '../../utils/logger';

/** 每帧发送的音频字节数（40ms @ 16kHz 16bit mono） */
const FRAME_SIZE = 1280;
/** 帧发送间隔（ms） */
const FRAME_INTERVAL = 40;

/** 讯飞 WebSocket 实时语音识别地址 */
const XIFEI_ASR_HOST = 'wss://ws-api.xfyun.cn/v2/iat';

/**
 * 讯飞实时语音识别客户端
 */
export class XiFeiASR extends EventEmitter {
  private config: Required<XiFeiConfig>;
  private ws: WebSocket | null = null;
  private status: TranscriptionStatus = TranscriptionStatus.IDLE;
  private logger: Logger;

  constructor(config: XiFeiConfig) {
    super();
    this.config = {
      language: 'zh_cn',
      accent: 'mandarin',
      ...config,
    };
    this.logger = getLogger();
  }

  /**
   * 生成鉴权 URL
   * 讯飞鉴权：HMAC-SHA256(apiSecret, "host: ws-api.xfyun.cn\ndate: <date>\nGET /v2/iat HTTP/1.1")
   */
  private buildAuthUrl(): string {
    const date = new Date().toUTCString();
    const signatureOrigin = `host: ws-api.xfyun.cn\ndate: ${date}\nGET /v2/iat HTTP/1.1`;
    const signature = crypto
      .createHmac('sha256', this.config.apiSecret)
      .update(signatureOrigin)
      .digest('base64');

    const authorizationOrigin =
      `api_key="${this.config.apiKey}", algorithm="hmac-sha256", ` +
      `headers="host date request-line", signature="${signature}"`;
    const authorization = Buffer.from(authorizationOrigin).toString('base64');

    return (
      `${XIFEI_ASR_HOST}?authorization=${encodeURIComponent(authorization)}` +
      `&date=${encodeURIComponent(date)}` +
      `&host=ws-api.xfyun.cn`
    );
  }

  /**
   * 转写 WAV 文件
   * @param filePath WAV 文件路径
   * @returns 识别出的完整文本
   */
  transcribeFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.status !== TranscriptionStatus.IDLE) {
        return reject(new Error('转写器正忙，请等待当前任务完成'));
      }

      if (!fs.existsSync(filePath)) {
        return reject(new Error(`文件不存在: ${filePath}`));
      }

      this.logger.info('开始转写文件', { filePath });
      this.setStatus(TranscriptionStatus.CONNECTING);

      // WAV 文件头 44 字节，跳过直接读 PCM 数据
      const pcmBuffer = this.readPCMFromWav(filePath);
      if (!pcmBuffer || pcmBuffer.length === 0) {
        this.setStatus(TranscriptionStatus.IDLE);
        return reject(new Error('WAV 文件为空或无法读取'));
      }

      const url = this.buildAuthUrl();
      this.ws = new WebSocket(url);
      const resultParts: string[] = [];
      const startTime = Date.now();

      this.ws.on('open', () => {
        this.logger.info('WebSocket 连接成功，开始发送音频');
        this.setStatus(TranscriptionStatus.TRANSCRIBING);
        this.sendAudio(pcmBuffer);
      });

      this.ws.on('message', (data: WebSocket.RawData) => {
        try {
          const msg = JSON.parse(data.toString());
          this.handleMessage(msg, resultParts);
        } catch (e) {
          this.logger.warn('解析讯飞响应失败', { data: data.toString() });
        }
      });

      this.ws.on('close', () => {
        const text = resultParts.join('');
        const duration = Date.now() - startTime;
        this.logger.info('转写完成', { text, duration });
        this.setStatus(TranscriptionStatus.DONE);

        this.emit(TranscriptionEventType.FINAL, { text, duration, filePath });
        this.ws = null;
        this.setStatus(TranscriptionStatus.IDLE);
        resolve(text);
      });

      this.ws.on('error', (err: Error) => {
        this.logger.error('WebSocket 错误', { error: err.message });
        this.setStatus(TranscriptionStatus.ERROR);
        this.emit(TranscriptionEventType.ERROR, err);
        this.ws = null;
        this.setStatus(TranscriptionStatus.IDLE);
        reject(err);
      });
    });
  }

  /**
   * 从 WAV 文件中读取 PCM 数据（跳过 44 字节的 WAV 头）
   */
  private readPCMFromWav(filePath: string): Buffer {
    const buf = fs.readFileSync(filePath);
    const WAV_HEADER_SIZE = 44;
    return buf.slice(WAV_HEADER_SIZE);
  }

  /**
   * 按帧发送音频数据
   */
  private sendAudio(pcmBuffer: Buffer): void {
    let offset = 0;
    let frameIndex = 0;

    const sendFrame = () => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const isFirst = frameIndex === 0;
      const chunk = pcmBuffer.slice(offset, offset + FRAME_SIZE);
      const isLast = offset + FRAME_SIZE >= pcmBuffer.length;

      // 帧状态：0=第一帧，1=中间帧，2=最后一帧
      const status = isFirst ? 0 : isLast ? 2 : 1;

      const frame: Record<string, unknown> = {
        data: {
          status,
          format: 'audio/L16;rate=16000',
          audio: chunk.toString('base64'),
          encoding: 'raw',
        },
      };

      // 第一帧附带业务参数
      if (isFirst) {
        frame.common = { app_id: this.config.appId };
        frame.business = {
          language: this.config.language,
          domain: 'iat',
          accent: this.config.accent,
          vad_eos: 10000,
          dwa: 'wpgs',  // 开启动态修正
        };
      }

      this.ws.send(JSON.stringify(frame));

      offset += FRAME_SIZE;
      frameIndex++;

      if (!isLast) {
        setTimeout(sendFrame, FRAME_INTERVAL);
      }
    };

    sendFrame();
  }

  /**
   * 处理讯飞返回的消息
   */
  private handleMessage(msg: any, resultParts: string[]): void {
    if (msg.code !== 0) {
      this.logger.error('讯飞返回错误', { code: msg.code, message: msg.message });
      this.emit(TranscriptionEventType.ERROR, new Error(`讯飞错误 ${msg.code}: ${msg.message}`));
      return;
    }

    // 拼接识别结果
    const ws = msg.data?.result?.ws;
    if (ws && Array.isArray(ws)) {
      const partial = ws
        .map((w: any) => w.cw?.map((c: any) => c.w).join('') ?? '')
        .join('');

      if (partial) {
        // 动态修正：status=0 追加，status=1 替换上一段
        if (msg.data.result.pgs === 'rpl') {
          resultParts.pop();
        }
        resultParts.push(partial);

        this.emit(TranscriptionEventType.PARTIAL, resultParts.join(''));
        this.logger.debug('中间识别结果', { partial, full: resultParts.join('') });
      }
    }

    // 最后一帧（status=2），服务端会主动关闭连接
    if (msg.data?.status === 2) {
      this.logger.info('服务端发送完毕');
    }
  }

  private setStatus(status: TranscriptionStatus): void {
    this.status = status;
    this.emit(TranscriptionEventType.STATUS_CHANGE, status);
  }

  getStatus(): TranscriptionStatus {
    return this.status;
  }

  dispose(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.removeAllListeners();
  }
}
