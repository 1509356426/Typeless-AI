/**
 * 文本后处理相关类型定义
 */

/**
 * 后处理配置
 */
export interface TextProcessorConfig {
  /** 是否启用去语气词 */
  removeFillers?: boolean;
  /** 是否启用标点补全 */
  addPunctuation?: boolean;
  /** 自定义语气词列表（追加到默认列表） */
  extraFillers?: string[];
}

/**
 * 后处理结果
 */
export interface ProcessedText {
  /** 处理后的文本 */
  text: string;
  /** 原始文本 */
  original: string;
  /** 被移除的语气词列表 */
  removedFillers: string[];
  /** 是否添加了标点 */
  punctuationAdded: boolean;
}
