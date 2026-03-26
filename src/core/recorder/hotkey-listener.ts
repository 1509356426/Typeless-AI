/**
 * 热键监听器模块
 * 负责监听系统级全局快捷键
 */

import { EventEmitter } from 'eventemitter3';
import * as uiohookModule from 'uiohook-napi';
import { HotkeyCallback } from '../../types';
import { getLogger, Logger } from '../../utils/logger';

// 获取 uIOhook 实例
const uIOhook = (uiohookModule as any).uIOhook || uiohookModule;

/**
 * 热键组合接口
 */
interface KeyCombination {
  key: number;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
}

/**
 * 热键监听器类
 */
export class HotkeyListener extends EventEmitter {
  private callback: HotkeyCallback | null = null;
  private isListening: boolean = false;
  private hotkey: KeyCombination | null = null;
  private logger: Logger;

  constructor() {
    super();
    this.logger = getLogger();
    this.setupEventHandlers();
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 监听键盘按下事件
    uIOhook.on('keydown', (event: any) => {
      if (!this.isListening || !this.hotkey) {
        return;
      }

      // 检查是否匹配注册的热键
      if (this.matchesHotkey(event, this.hotkey)) {
        this.logger.debug('热键被触发', {
          keycode: event.keycode,
          ctrl: event.ctrlKey,
          shift: event.shiftKey,
          alt: event.altKey,
          meta: event.metaKey,
        });

        // 触发回调
        this.emit('trigger');
        if (this.callback) {
          try {
            this.callback();
          } catch (error) {
            this.logger.error('热键回调执行失败', { error });
          }
        }
      }
    });
  }

  /**
   * 检查事件是否匹配热键
   */
  private matchesHotkey(event: any, hotkey: KeyCombination): boolean {
    return (
      event.keycode === hotkey.key &&
      !!event.ctrlKey === hotkey.ctrl &&
      !!event.shiftKey === hotkey.shift &&
      !!event.altKey === hotkey.alt &&
      !!event.metaKey === hotkey.meta
    );
  }

  /**
   * 获取键码
   */
  private getKeyCode(keyName: string): number {
    const keyMap: Record<string, number> = {
      space: 57, // UiohookKey.Space
      a: 30, // UiohookKey.A
      b: 48,
      c: 46,
      d: 32,
      e: 18,
      f: 33,
      g: 34,
      h: 35,
      i: 23,
      j: 36,
      k: 37,
      l: 38,
      m: 50,
      n: 49,
      o: 24,
      p: 25,
      q: 16,
      r: 19,
      s: 31,
      t: 20,
      u: 22,
      v: 47,
      w: 17,
      x: 45,
      y: 21,
      z: 44,
      f1: 59,
      f2: 60,
      f3: 61,
      f4: 62,
      f5: 63,
      f6: 64,
      f7: 65,
      f8: 66,
      f9: 67,
      f10: 68,
      f11: 87,
      f12: 88,
    };

    const key = keyMap[keyName.toLowerCase()];
    if (key === undefined) {
      throw new Error(`不支持的键名: ${keyName}`);
    }

    return key;
  }

  /**
   * 解析热键字符串为 KeyCombination
   * 支持格式：'Ctrl+Space', 'Alt+A', 'Ctrl+Shift+S' 等
   */
  private parseHotkey(hotkeyString: string): KeyCombination {
    const parts = hotkeyString.toLowerCase().split('+');
    const keyPart = parts.pop() || '';

    const combination: KeyCombination = {
      key: this.getKeyCode(keyPart),
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
    };

    // 解析修饰键
    for (const part of parts) {
      switch (part.trim()) {
        case 'ctrl':
        case 'control':
          combination.ctrl = true;
          break;
        case 'shift':
          combination.shift = true;
          break;
        case 'alt':
          combination.alt = true;
          break;
        case 'meta':
        case 'cmd':
        case 'win':
          combination.meta = true;
          break;
      }
    }

    return combination;
  }

  /**
   * 注册热键
   * @param hotkeyString 热键字符串，如 'Ctrl+Space'
   * @param callback 热键触发时的回调函数
   */
  async register(hotkeyString: string, callback: HotkeyCallback): Promise<void> {
    this.logger.info('注册热键', { hotkey: hotkeyString });

    try {
      // 解析热键
      this.hotkey = this.parseHotkey(hotkeyString);
      this.callback = callback;

      this.logger.info('热键注册成功', {
        hotkey: hotkeyString,
        parsed: this.hotkey,
      });

    } catch (error) {
      this.logger.error('热键注册失败', { error, hotkey: hotkeyString });
      throw error;
    }
  }

  /**
   * 启动监听
   */
  start(): void {
    if (this.isListening) {
      this.logger.warn('热键监听已在运行');
      return;
    }

    this.logger.info('启动热键监听');
    uIOhook.start();
    this.isListening = true;
    this.emit('start');
  }

  /**
   * 停止监听
   */
  stop(): void {
    if (!this.isListening) {
      return;
    }

    this.logger.info('停止热键监听');
    uIOhook.stop();
    this.isListening = false;
    this.emit('stop');
  }

  /**
   * 获取监听状态
   */
  isActive(): boolean {
    return this.isListening;
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.logger.info('清理热键监听器资源');
    this.stop();
    this.callback = null;
    this.hotkey = null;
    this.removeAllListeners();
  }
}
