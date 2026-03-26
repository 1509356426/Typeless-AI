"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const types_1 = require("@shared/types");
// 定义暴露给渲染进程的 API
const electronAPI = {
    // 获取应用版本
    getVersion: () => electron_1.ipcRenderer.invoke(types_1.IPCChannel.GET_VERSION),
    // 测试连接
    ping: () => electron_1.ipcRenderer.invoke('ping'),
    // 获取应用信息
    getAppInfo: () => electron_1.ipcRenderer.invoke(types_1.IPCChannel.GET_APP_INFO),
    // 发送消息并接收回显
    sendMessage: (message) => electron_1.ipcRenderer.invoke(types_1.IPCChannel.SEND_MESSAGE, message),
    // 监听主进程事件
    on: (channel, callback) => {
        const validChannels = ['app-update', types_1.IPCChannel.RECEIVE_MESSAGE];
        if (validChannels.includes(channel)) {
            electron_1.ipcRenderer.on(channel, (_, ...args) => callback(...args));
        }
    },
    // 移除事件监听器
    removeListener: (channel, callback) => {
        electron_1.ipcRenderer.removeListener(channel, callback);
    },
};
// 使用 contextBridge 安全地暴露 API
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
