// 共享类型定义

export interface AppConfig {
  version: string
  name: string
  description: string
}

export interface ElectronAPI {
  getVersion: () => Promise<string>
  on: (channel: string, callback: (...args: any[]) => void) => void
  removeListener: (channel: string, callback: (...args: any[]) => void) => void
}

// IPC 通道枚举
export enum IPCChannel {
  GET_VERSION = 'get-version',
  GET_APP_INFO = 'get-app-info',
  SEND_MESSAGE = 'send-message',
  RECEIVE_MESSAGE = 'receive-message',
  OPEN_EXTERNAL = 'open-external',
  SHOW_ERROR = 'show-error',
  SHOW_INFO = 'show-info'
}

// IPC 消息类型
export interface IPCMessage<T = unknown> {
  id: string
  channel: IPCChannel
  payload?: T
  timestamp: number
}

export interface IPCRequest<T = unknown> {
  channel: IPCChannel
  payload?: T
}

export interface IPCResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// 应用数据类型
export interface AppInfo {
  name: string
  version: string
  electronVersion: string
  platform: string
  arch: string
}

export interface UserMessage {
  text: string
  sender: 'main' | 'renderer'
  timestamp: number
}

export interface DialogOptions {
  title: string
  message: string
  detail?: string
}

export interface OpenExternalPayload {
  url: string
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
