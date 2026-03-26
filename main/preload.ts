import { contextBridge, ipcRenderer } from 'electron';
import { IPCChannel } from '@shared/types';

// 定义暴露给渲染进程的 API
const electronAPI = {
  // 获取应用版本
  getVersion: (): Promise<string> => ipcRenderer.invoke(IPCChannel.GET_VERSION),

  // 测试连接
  ping: (): Promise<string> => ipcRenderer.invoke('ping'),

  // 获取应用信息
  getAppInfo: (): Promise<{ name: string; version: string }> =>
    ipcRenderer.invoke(IPCChannel.GET_APP_INFO),

  // 发送消息并接收回显
  sendMessage: (message: string): Promise<string> =>
    ipcRenderer.invoke(IPCChannel.SEND_MESSAGE, message),

  // 监听主进程事件
  on: (channel: string, callback: (...args: unknown[]) => void): void => {
    const validChannels = ['app-update', IPCChannel.RECEIVE_MESSAGE];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_, ...args) => callback(...args));
    }
  },

  // 移除事件监听器
  removeListener: (channel: string, callback: (...args: unknown[]) => void): void => {
    ipcRenderer.removeListener(channel, callback as any);
  },
};

// 使用 contextBridge 安全地暴露 API
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// TypeScript 类型定义
export interface ElectronAPI {
  getVersion: () => Promise<string>;
  ping: () => Promise<string>;
  getAppInfo: () => Promise<{ name: string; version: string }>;
  sendMessage: (message: string) => Promise<string>;
  on: (channel: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (channel: string, callback: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
