"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.unregisterIpcHandlers = exports.registerIpcHandlers = exports.createWindow = void 0;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const types_1 = require("@shared/types");
let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development';
const createWindow = () => {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
        },
        show: false,
    });
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });
    // 开发模式加载 Vite 服务器，生产模式加载构建文件
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173').catch((err) => {
            console.error('Failed to load Vite dev server:', err);
        });
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html')).catch((err) => {
            console.error('Failed to load built renderer:', err);
        });
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    return mainWindow;
};
exports.createWindow = createWindow;
// IPC 处理程序
const handleGetVersion = () => {
    return electron_1.app.getVersion();
};
const handlePing = () => {
    return 'pong';
};
const handleGetAppInfo = () => {
    return {
        name: electron_1.app.getName(),
        version: electron_1.app.getVersion(),
    };
};
const handleSendMessage = (_event, message) => {
    return `Echo: ${message}`;
};
// 注册 IPC 处理程序
const registerIpcHandlers = () => {
    electron_1.ipcMain.handle(types_1.IPCChannel.GET_VERSION, handleGetVersion);
    electron_1.ipcMain.handle('ping', handlePing);
    electron_1.ipcMain.handle(types_1.IPCChannel.GET_APP_INFO, handleGetAppInfo);
    electron_1.ipcMain.handle(types_1.IPCChannel.SEND_MESSAGE, handleSendMessage);
};
exports.registerIpcHandlers = registerIpcHandlers;
// 清理 IPC 处理程序
const unregisterIpcHandlers = () => {
    electron_1.ipcMain.removeHandler(types_1.IPCChannel.GET_VERSION);
    electron_1.ipcMain.removeHandler('ping');
    electron_1.ipcMain.removeHandler(types_1.IPCChannel.GET_APP_INFO);
    electron_1.ipcMain.removeHandler(types_1.IPCChannel.SEND_MESSAGE);
};
exports.unregisterIpcHandlers = unregisterIpcHandlers;
// 应用生命周期
electron_1.app.on('ready', () => {
    createWindow();
    registerIpcHandlers();
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
electron_1.app.on('before-quit', () => {
    unregisterIpcHandlers();
});
