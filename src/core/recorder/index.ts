/**
 * 录音器主控制器
 * 整合所有模块，提供统一的录音控制接口
 */

import { EventEmitter } from 'eventemitter3';
import { AudioCapture } from './audio-capture';
import { HotkeyListener } from './hotkey-listener';
import { FileManager } from './file-manager';
import { StateMachine } from './state-machine';
import {
  AudioConfig,
  RecordingStatus,
  RecordingResult,
  RecorderEventType,
  RecorderEventData,
  StateAction,
} from '../../types';
import { getLogger, Logger } from '../../utils/logger';

/**
 * 录音器配置接口
 */
export interface RecorderConfig {
  /** 音频配置 */
  audio?: Partial<AudioConfig>;
  /** 默认热键 */
  hotkey?: string;
  /** 是否启用热键监听 */
  enableHotkey?: boolean;
  /** 录音文件保存目录 */
  outputDir?: string;
}

/**
 * 录音器主类
 */
export class Recorder extends EventEmitter {
  private audioCapture: AudioCapture;
  private hotkeyListener: HotkeyListener;
  private fileManager: FileManager;
  private stateMachine: StateMachine;
  private logger: Logger;
  private config: RecorderConfig;
  private isInitialized: boolean = false;
  private currentRecording: RecordingResult | null = null;

  constructor(config: RecorderConfig = {}) {
    super();

    this.config = {
      hotkey: 'Ctrl+Space',
      enableHotkey: true,
      outputDir: process.cwd() + '/recordings',
      ...config,
    };

    this.logger = getLogger();

    // 初始化各模块
    this.audioCapture = new AudioCapture(this.config.audio);
    this.hotkeyListener = new HotkeyListener();
    this.fileManager = new FileManager({ outputDir: this.config.outputDir });
    this.stateMachine = new StateMachine();

    this.setupEventHandlers();
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 音频捕获事件
    this.audioCapture.on('data', (chunk) => {
      this.emit('audioData', chunk);
    });

    this.audioCapture.on('complete', async ({ buffer, duration }) => {
      this.logger.info('录音完成，开始保存文件', { duration, bufferSize: buffer.length });

      try {
        // 保存录音文件，传入真实录音时长
        const config = this.audioCapture.getConfig();
        const result = await this.fileManager.saveRecording(
          buffer,
          config.sampleRate,
          config.channels,
          config.bitDepth,
          duration
        );

        this.currentRecording = result;

        // 转换状态
        await this.stateMachine.transition(StateAction.STOP);

        // 发出录音完成事件
        this.emitEvent(RecorderEventType.STOP, {
          filePath: result.filePath,
          duration: result.duration,
        });

      } catch (error) {
        this.logger.error('保存录音文件失败', { error });
        this.emitEvent(RecorderEventType.ERROR, { error: error as Error });
      }
    });

    // 热键监听事件
    this.hotkeyListener.on('trigger', async () => {
      await this.handleHotkeyTrigger();
    });

    this.hotkeyListener.on('error', (error) => {
      this.logger.error('热键监听错误', { error });
      this.emitEvent(RecorderEventType.ERROR, { error });
    });

    // 状态机事件
    this.stateMachine.on('state', (status: RecordingStatus) => {
      this.emit('statusChange', status);
    });
  }

  /**
   * 处理热键触发
   */
  private async handleHotkeyTrigger(): Promise<void> {
    const currentState = this.stateMachine.getState();

    this.logger.debug('热键触发', { currentState });

    try {
      if (currentState === RecordingStatus.IDLE || currentState === RecordingStatus.PAUSED) {
        await this.startRecording();
      } else if (currentState === RecordingStatus.RECORDING) {
        await this.stopRecording();
      }
    } catch (error) {
      this.logger.error('处理热键触发失败', { error });
      this.emitEvent(RecorderEventType.ERROR, { error: error as Error });
    }
  }

  /**
   * 发出事件
   */
  private emitEvent(type: RecorderEventType, data: Partial<RecorderEventData> = {}): void {
    const eventData: RecorderEventData = {
      type,
      timestamp: Date.now(),
      status: this.stateMachine.getState(),
      ...data,
    };

    this.emit('event', eventData);
    this.emit(type, eventData);
  }

  /**
   * 初始化录音器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('录音器已初始化');
      return;
    }

    this.logger.info('初始化录音器', { config: this.config });

    try {
      // 初始化文件管理器
      await this.fileManager.initialize();

      // 注册热键
      if (this.config.enableHotkey && this.config.hotkey) {
        await this.hotkeyListener.register(this.config.hotkey, async () => {
          await this.handleHotkeyTrigger();
        });

        // 启动热键监听
        this.hotkeyListener.start();

        this.logger.info('热键监听已启动', { hotkey: this.config.hotkey });
      }

      this.isInitialized = true;
      this.logger.info('录音器初始化完成');

    } catch (error) {
      this.logger.error('录音器初始化失败', { error });
      throw error;
    }
  }

  /**
   * 开始录音
   */
  async startRecording(): Promise<void> {
    this.logger.info('开始录音');

    // 检查状态
    if (!this.stateMachine.canTransition(StateAction.START)) {
      throw new Error(`当前状态不允许开始录音: ${this.stateMachine.getState()}`);
    }

    try {
      // 转换状态
      await this.stateMachine.transition(StateAction.START);

      // 开始音频捕获
      await this.audioCapture.startRecording();

      this.currentRecording = null;
      this.emitEvent(RecorderEventType.START);

      this.logger.info('录音已开始');

    } catch (error) {
      this.logger.error('开始录音失败', { error });
      await this.stateMachine.reset();
      this.emitEvent(RecorderEventType.ERROR, { error: error as Error });
      throw error;
    }
  }

  /**
   * 停止录音
   */
  async stopRecording(): Promise<RecordingResult | null> {
    this.logger.info('停止录音');

    // 检查状态
    if (!this.stateMachine.canTransition(StateAction.STOP)) {
      throw new Error(`当前状态不允许停止录音: ${this.stateMachine.getState()}`);
    }

    try {
      // 停止音频捕获
      const buffer = await this.audioCapture.stopRecording();

      this.logger.info('录音已停止，正在保存文件...');

      // 等待文件保存完成（在 audioCapture.complete 事件中处理）
      // 返回结果（可能为 null，如果保存还未完成）
      return this.currentRecording;

    } catch (error) {
      this.logger.error('停止录音失败', { error });
      this.emitEvent(RecorderEventType.ERROR, { error: error as Error });
      throw error;
    }
  }

  /**
   * 获取当前状态
   */
  getStatus(): RecordingStatus {
    return this.stateMachine.getState();
  }

  /**
   * 获取状态信息
   */
  getStateInfo() {
    return this.stateMachine.getStateInfo();
  }

  /**
   * 获取当前录音结果（如果存在）
   */
  getCurrentRecording(): RecordingResult | null {
    return this.currentRecording;
  }

  /**
   * 清理资源
   */
  async dispose(): Promise<void> {
    this.logger.info('清理录音器资源');

    try {
      // 停止热键监听
      this.hotkeyListener.dispose();

      // 清理音频捕获器
      this.audioCapture.dispose();

      // 重置状态机
      this.stateMachine.reset();

      // 移除所有监听器
      this.removeAllListeners();

      this.isInitialized = false;
      this.logger.info('录音器资源已清理');

    } catch (error) {
      this.logger.error('清理录音器资源失败', { error });
    }
  }
}

/**
 * 导出所有模块
 */
export { AudioCapture } from './audio-capture';
export { HotkeyListener } from './hotkey-listener';
export { FileManager } from './file-manager';
export { StateMachine } from './state-machine';

/**
 * 导出类型
 */
export { RecordingStatus, RecorderEventType, RecorderEventData } from '../../types';
