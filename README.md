# Typeless-AI

> AI 驱动的语音听写桌面工具

## 项目简介

Typeless-AI 是一款面向个人及小团队的 AI 驱动语音听写桌面工具，基于 Electron 框架构建，支持 Windows 和 macOS 平台。产品核心目标是提供高质量的中文语音识别体验，让用户能够通过语音完全替代日常手动打字场景。

## 当前状态

**✅ 已完成 - 音频录制监听模块（Core MVP）**

本项目已实现纯 Node.js 版本的音频录制监听模块，作为后续集成到 Electron 框架的基础。

### 核心功能

- ✅ **热键监听**：全局快捷键控制（默认 `Ctrl+Space`）
- ✅ **麦克风录音**：跨平台音频捕获，支持实时流式处理
- ✅ **WAV 文件保存**：自动将录音保存为标准 WAV 格式
- ✅ **状态管理**：完善的状态机管理录音状态
- ✅ **日志系统**：结构化日志记录，便于调试
- ✅ **CLI 测试工具**：命令行界面，方便功能验证

## 技术栈

### 核心依赖

- **node-record-lpcm16**: 跨平台麦克风录音
- **uiohook-napi**: 全局热键监听
- **wav**: 音频格式转换（PCM → WAV）
- **winston**: 日志系统
- **eventemitter3**: 事件发射器

### 开发依赖

- **TypeScript**: 类型安全
- **ts-node**: 开发时直接运行 TS

## 项目结构

```
Typeless-AI/
├── src/
│   ├── core/
│   │   └── recorder/          # 录音模块
│   │       ├── index.ts       # 主控制器
│   │       ├── audio-capture.ts   # 音频捕获
│   │       ├── hotkey-listener.ts # 热键监听
│   │       ├── file-manager.ts    # 文件管理
│   │       └── state-machine.ts   # 状态机
│   ├── types/                 # 类型定义
│   ├── utils/                 # 工具函数
│   └── cli/                   # CLI 测试工具
├── recordings/                # 录音文件存储
├── logs/                      # 日志文件
└── docs/                      # 项目文档
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 运行 CLI 测试工具

```bash
npm run dev
```

### 使用方法

启动后，您可以：

1. **使用快捷键**：按 `Ctrl+Space` 开始/停止录音
2. **使用命令**：
   - `start` - 开始录音
   - `stop` - 停止录音
   - `status` - 查看状态
   - `help` - 显示帮助
   - `quit` - 退出程序

### 录音文件

录音文件会自动保存到 `recordings/` 目录，文件名格式为 `recording_YYYY-MM-DDTHH-MM-SS.wav`

## 音频配置

默认音频参数（符合讯飞 ASR 要求）：

- 采样率：16kHz
- 声道：单声道
- 位深度：16-bit PCM

## 开发计划

### Phase 1: 音频录制监听模块 ✅
- [x] 项目初始化
- [x] 核心类型定义
- [x] 音频捕获模块
- [x] 热键监听器
- [x] 文件管理器
- [x] 状态机
- [x] 主控制器集成
- [x] CLI 测试工具

### Phase 2: ASR 集成（待开发）
- [ ] 讯飞 WebSocket 实时 ASR
- [ ] 长音频文件转写
- [ ] 文本后处理（去语气词、标点补全）

### Phase 3: Electron 集成（待开发）
- [ ] Electron 应用框架
- [ ] 系统托盘
- [ ] 设置界面
- [ ] 全局文本注入

### Phase 4: 增强功能（待开发）
- [ ] 语音命令控制
- [ ] 自定义词典
- [ ] 多 ASR 引擎切换
- [ ] 本地 Whisper 离线模式

## 文档

- [产品需求文档 (PRD)](./docs/typeless-ai-prd.md)
- [项目任务树](./docs/project-tree.txt)

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

---

**Made with ❤️ by Typeless-AI Team**
