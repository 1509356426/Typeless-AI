/**
 * Typeless-AI CLI 测试工具
 * 用于测试录音功能
 */

import { Recorder, RecorderEventType, RecordingStatus } from '../core/recorder';
import { transcribeFile } from '../core/transcriber';
import { getLogger, LogLevel } from '../utils/logger';
import readline from 'readline';

/**
 * CLI 应用类
 */
class CLI {
  private recorder: Recorder;
  private logger = getLogger();

  constructor() {
    this.recorder = new Recorder({
      hotkey: 'Ctrl+Space',
      enableHotkey: true,
    });

    this.setupEventHandlers();
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 监听录音器事件
    this.recorder.on('event', (event) => {
      this.logger.info('录音事件', {
        type: event.type,
        status: event.status,
        filePath: event.filePath,
        duration: event.duration,
      });
    });

    this.recorder.on('statusChange', (status: RecordingStatus) => {
      this.displayStatus(status);
    });

    this.recorder.on(RecorderEventType.START, () => {
      console.log('\n🎤 录音已开始！请说话...\n');
    });

    this.recorder.on(RecorderEventType.STOP, (event) => {
      console.log('\n✅ 录音已停止！');
      console.log(`📁 文件路径: ${event.filePath}`);
      console.log(`⏱️  录音时长: ${Math.round(event.duration! / 1000)}秒\n`);
    });

    this.recorder.on(RecorderEventType.ERROR, (event) => {
      console.error(`\n❌ 错误: ${event.error?.message}\n`);
    });
  }

  /**
   * 显示当前状态
   */
  private displayStatus(status: RecordingStatus): void {
    const statusMap = {
      [RecordingStatus.IDLE]: '💤 空闲',
      [RecordingStatus.RECORDING]: '🔴 录音中',
      [RecordingStatus.PAUSED]: '⏸️  已暂停',
    };

    console.log(`\n当前状态: ${statusMap[status]}`);
  }

  /**
   * 处理转写命令
   */
  private async handleTranscribe(filePath: string): Promise<void> {
    if (!filePath) {
      console.log('\n用法: transcribe <WAV文件路径>\n');
      return;
    }

    console.log(`\n🔄 开始转写: ${filePath}`);
    console.log('识别中...');

    try {
      const result = await transcribeFile(filePath, (partial) => {
        process.stdout.write(`\r📝 ${partial}`);
      });

      console.log(`\n\n✅ 转写完成！`);
      console.log(`📝 识别结果: ${result.text || '（未识别到内容）'}`);
      console.log(`⏱️  耗时: ${Math.round(result.duration / 1000)}秒\n`);
    } catch (err) {
      console.error(`\n❌ 转写失败: ${(err as Error).message}\n`);
    }
  }

  /**
   * 显示帮助信息
   */
  private displayHelp(): void {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           Typeless-AI 录音测试工具 v0.1.0                    ║
╠═══════════════════════════════════════════════════════════════╣
║  命令:                                                       ║
║    start               - 开始录音                             ║
║    stop                - 停止录音                             ║
║    transcribe <file>   - 转写音频文件为文字                   ║
║    status              - 查看状态                             ║
║    help                - 显示帮助                             ║
║    quit                - 退出程序                             ║
║                                                               ║
║  快捷键:                                                      ║
║    Ctrl+Space - 开始/停止录音                                ║
║                                                               ║
║  转写需设置: XIFEI_APP_ID / XIFEI_API_KEY / XIFEI_API_SECRET ║
╚═══════════════════════════════════════════════════════════════╝
    `);
  }

  /**
   * 启动 CLI
   */
  async start(): Promise<void> {
    try {
      // 初始化录音器
      await this.recorder.initialize();

      this.displayHelp();
      this.displayStatus(this.recorder.getStatus());

      // 创建命令行接口
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      // 命令处理循环
      const processCommand = async () => {
        rl.question('\n> ', async (input) => {
          const command = input.trim().toLowerCase();

          try {
            switch (command) {
              case 'start':
                await this.recorder.startRecording();
                break;

              case 'stop':
                await this.recorder.stopRecording();
                break;

              case 'status':
                const info = this.recorder.getStateInfo();
                console.log('\n状态信息:');
                console.log(`  当前状态: ${info.current}`);
                console.log(`  可用操作: ${info.possibleActions.join(', ')}`);

                const recording = this.recorder.getCurrentRecording();
                if (recording) {
                  console.log('\n最近的录音:');
                  console.log(`  文件: ${recording.filePath}`);
                  console.log(`  时长: ${Math.round(recording.duration / 1000)}秒`);
                  console.log(`  大小: ${recording.fileSize} 字节`);
                }
                break;

              case 'help':
                this.displayHelp();
                break;

              case 'quit':
              case 'exit':
                console.log('\n👋 再见！\n');
                await this.recorder.dispose();
                rl.close();
                process.exit(0);
                break;

              default:
                if (input.trim().toLowerCase().startsWith('transcribe ')) {
                  const filePath = input.trim().slice('transcribe '.length).trim();
                  await this.handleTranscribe(filePath);
                } else {
                  console.log(`\n未知命令: ${command}`);
                  console.log('输入 "help" 查看可用命令\n');
                }
            }
          } catch (error) {
            console.error(`\n❌ 执行命令失败: ${(error as Error).message}\n`);
          }

          // 继续等待输入
          processCommand();
        });
      };

      // 开始处理命令
      processCommand();

      // 处理进程退出
      process.on('SIGINT', async () => {
        console.log('\n\n正在退出...\n');
        await this.recorder.dispose();
        rl.close();
        process.exit(0);
      });

    } catch (error) {
      this.logger.error('CLI 启动失败', { error });
      console.error('启动失败:', error);
      process.exit(1);
    }
  }
}

// 启动 CLI 应用
const cli = new CLI();
cli.start().catch((error) => {
  console.error('未处理的错误:', error);
  process.exit(1);
});
