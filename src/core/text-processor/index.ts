/**
 * 文本后处理器
 * 对 ASR 原始输出进行智能清洗：去语气词、补标点
 */

import { TextProcessorConfig, ProcessedText } from '../../types';

/** 默认中文语气词列表 */
const DEFAULT_FILLERS = [
  '嗯', '啊', '呃', '额', '喔', '哦',
  '就是说', '那个', '然后呢', '就是',
  '怎么说呢', '对吧', '是吧', '嘛',
  '你知道吧', '你懂吧', '对不对',
];

/** 默认配置 */
const DEFAULT_CONFIG: Required<TextProcessorConfig> = {
  removeFillers: true,
  addPunctuation: true,
  extraFillers: [],
};

/**
 * 文本后处理器类
 */
export class TextProcessor {
  private config: Required<TextProcessorConfig>;
  private fillers: Set<string>;

  constructor(config: TextProcessorConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.fillers = new Set([...DEFAULT_FILLERS, ...this.config.extraFillers]);
  }

  /**
   * 处理文本
   */
  process(text: string): ProcessedText {
    let processed = text;
    const removedFillers: string[] = [];
    let punctuationAdded = false;

    // 1. 去语气词
    if (this.config.removeFillers) {
      const result = this.removeFillers(processed);
      processed = result.text;
      removedFillers.push(...result.removed);
    }

    // 2. 标点补全
    if (this.config.addPunctuation) {
      const result = this.addPunctuation(processed);
      if (result !== processed) {
        punctuationAdded = true;
        processed = result;
      }
    }

    // 3. 清理多余空格
    processed = processed.replace(/\s+/g, ' ').trim();

    return {
      text: processed,
      original: text,
      removedFillers,
      punctuationAdded,
    };
  }

  /**
   * 移除语气词
   * 按长度降序排列，优先匹配长词（如"怎么说呢"优先于"说"）
   */
  private removeFillers(text: string): { text: string; removed: string[] } {
    const removed: string[] = [];
    let result = text;

    // 按长度降序排列，避免短词误匹配
    const sorted = [...this.fillers].sort((a, b) => b.length - a.length);

    for (const filler of sorted) {
      // 语气词可能独立出现（前后有空格/标点/边界）
      const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // 匹配：开头、空格、标点后跟语气词，再跟空格、标点或结尾
      const regex = new RegExp(
        `(?<=^|[\\s，。！？、；：""''（）\\[\\]{}])${escaped}(?=[\\s，。！？、；：""''（）\\[\\]{}]|$)`,
        'g'
      );
      const matches = result.match(regex);
      if (matches) {
        removed.push(...matches);
      }
      result = result.replace(regex, '');
    }

    return { text: result, removed };
  }

  /**
   * 补全标点
   * 简单规则：如果文本末尾没有标点，加上句号
   */
  private addPunctuation(text: string): string {
    if (!text) return text;

    // 末尾已有中文标点则不加
    if (/[。！？；…—]$/.test(text.trim())) {
      return text;
    }

    return text.trimEnd() + '。';
  }
}
