/**
 * 转写器主控制器
 * 从环境变量或 .env 文件读取讯飞配置，提供简单的 transcribe() API
 */

import { XiFeiASR } from './xifei-asr';
import { XiFeiConfig, TranscriptionResult, TranscriptionEventType } from '../../types';
import { getLogger } from '../../utils/logger';

// 加载 .env 文件（如果存在）
import { config as loadEnv } from 'dotenv';
loadEnv();

const logger = getLogger();

/**
 * 从环境变量加载讯飞配置
 */
function loadXiFeiConfig(): XiFeiConfig {
  const appId = process.env.XIFEI_APP_ID;
  const apiKey = process.env.XIFEI_API_KEY;
  const apiSecret = process.env.XIFEI_API_SECRET;

  if (!appId || !apiKey || !apiSecret) {
    throw new Error(
      '缺少讯飞 API 配置，请设置环境变量：\n' +
      '  XIFEI_APP_ID=your_app_id\n' +
      '  XIFEI_API_KEY=your_api_key\n' +
      '  XIFEI_API_SECRET=your_api_secret'
    );
  }

  return { appId, apiKey, apiSecret };
}

/**
 * 转写 WAV 文件为文字
 * @param filePath WAV 文件路径
 * @param onPartial 可选的中间结果回调
 */
export async function transcribeFile(
  filePath: string,
  onPartial?: (text: string) => void
): Promise<TranscriptionResult> {
  const config = loadXiFeiConfig();
  const asr = new XiFeiASR(config);
  const startTime = Date.now();

  if (onPartial) {
    asr.on(TranscriptionEventType.PARTIAL, onPartial);
  }

  try {
    const text = await asr.transcribeFile(filePath);
    return {
      text,
      duration: Date.now() - startTime,
      filePath,
    };
  } finally {
    asr.dispose();
  }
}

export { XiFeiASR };
export type { XiFeiConfig, TranscriptionResult };
