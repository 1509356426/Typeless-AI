/**
 * 状态机模块
 * 管理录音状态的转换，确保逻辑一致性
 */

import { EventEmitter } from 'eventemitter3';
import { RecordingStatus, StateAction, StateTransition } from '../../types';
import { getLogger, Logger } from '../../utils/logger';

/**
 * 状态机配置
 */
interface StateMachineConfig {
  /** 是否允许非法状态转换时抛出异常 */
  strict: boolean;
}

/**
 * 状态转换规则表
 * 格式: [当前状态, 动作] -> 目标状态
 */
const TRANSITION_RULES: Record<RecordingStatus, Record<StateAction, RecordingStatus | null>> = {
  [RecordingStatus.IDLE]: {
    [StateAction.START]: RecordingStatus.RECORDING,
    [StateAction.STOP]: RecordingStatus.IDLE,
    [StateAction.PAUSE]: null, // 无效
    [StateAction.RESUME]: null, // 无效
  },
  [RecordingStatus.RECORDING]: {
    [StateAction.START]: RecordingStatus.RECORDING, // 已在录音中
    [StateAction.STOP]: RecordingStatus.IDLE,
    [StateAction.PAUSE]: RecordingStatus.PAUSED,
    [StateAction.RESUME]: RecordingStatus.RECORDING, // 已在录音中
  },
  [RecordingStatus.PAUSED]: {
    [StateAction.START]: null, // 无效
    [StateAction.STOP]: RecordingStatus.IDLE,
    [StateAction.PAUSE]: RecordingStatus.PAUSED, // 已暂停
    [StateAction.RESUME]: RecordingStatus.RECORDING,
  },
};

/**
 * 状态机类
 */
export class StateMachine extends EventEmitter {
  private currentState: RecordingStatus = RecordingStatus.IDLE;
  private config: StateMachineConfig;
  private logger: Logger;

  constructor(config: Partial<StateMachineConfig> = {}) {
    super();
    this.config = {
      strict: true,
      ...config,
    };
    this.logger = getLogger();
  }

  /**
   * 获取当前状态
   */
  getState(): RecordingStatus {
    return this.currentState;
  }

  /**
   * 检查是否可以执行指定动作
   */
  canTransition(action: StateAction): boolean {
    const targetState = TRANSITION_RULES[this.currentState][action];
    return targetState !== null;
  }

  /**
   * 执行状态转换
   */
  async transition(action: StateAction): Promise<boolean> {
    const targetState = TRANSITION_RULES[this.currentState][action];

    // 检查转换是否有效
    if (targetState === null) {
      const error = `非法状态转换: ${this.currentState} + ${action}`;
      this.logger.warn(error);

      if (this.config.strict) {
        throw new Error(error);
      }

      return false;
    }

    // 如果目标状态与当前状态相同，不做处理
    if (targetState === this.currentState) {
      this.logger.debug('状态未改变', { state: this.currentState, action });
      return true;
    }

    // 执行状态转换
    const previousState = this.currentState;
    this.currentState = targetState;

    this.logger.info('状态转换', {
      from: previousState,
      to: this.currentState,
      action,
    });

    // 发出状态变化事件
    this.emit('stateChange', {
      from: previousState,
      to: this.currentState,
      action,
    });

    this.emit('state', this.currentState);

    return true;
  }

  /**
   * 重置状态机
   */
  reset(): void {
    this.logger.info('重置状态机', { previousState: this.currentState });
    this.currentState = RecordingStatus.IDLE;
    this.emit('reset');
    this.emit('state', this.currentState);
  }

  /**
   * 获取所有可能的状态转换
   */
  getPossibleTransitions(): StateAction[] {
    const actions: StateAction[] = [];

    for (const action of Object.values(StateAction)) {
      if (this.canTransition(action)) {
        actions.push(action);
      }
    }

    return actions;
  }

  /**
   * 获取状态信息
   */
  getStateInfo(): {
    current: RecordingStatus;
    possibleActions: StateAction[];
  } {
    return {
      current: this.currentState,
      possibleActions: this.getPossibleTransitions(),
    };
  }
}
