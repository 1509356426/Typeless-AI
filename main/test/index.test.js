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
const vitest_1 = require("vitest");
const electron_1 = require("electron");
// Mock Electron modules
vitest_1.vi.mock('electron', () => ({
    app: {
        getVersion: vitest_1.vi.fn(() => '1.0.0'),
        getName: vitest_1.vi.fn(() => 'TestApp'),
        on: vitest_1.vi.fn(),
        quit: vitest_1.vi.fn(),
    },
    BrowserWindow: vitest_1.vi.fn().mockImplementation(() => ({
        loadURL: vitest_1.vi.fn().mockResolvedValue(undefined),
        loadFile: vitest_1.vi.fn().mockResolvedValue(undefined),
        on: vitest_1.vi.fn(),
        once: vitest_1.vi.fn(),
        webContents: {
            openDevTools: vitest_1.vi.fn(),
        },
        show: vitest_1.vi.fn(),
    })),
    ipcMain: {
        handle: vitest_1.vi.fn(),
        removeHandler: vitest_1.vi.fn(),
        on: vitest_1.vi.fn(),
        removeListener: vitest_1.vi.fn(),
    },
    IpcMainInvokeEvent: {},
}));
(0, vitest_1.describe)('Main Process - Window Lifecycle', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        vitest_1.vi.resetModules();
        process.env.NODE_ENV = 'test';
        // Reset BrowserWindow mock to return fresh instance
        electron_1.BrowserWindow.mockImplementation(() => ({
            loadURL: vitest_1.vi.fn().mockResolvedValue(undefined),
            loadFile: vitest_1.vi.fn().mockResolvedValue(undefined),
            on: vitest_1.vi.fn(),
            once: vitest_1.vi.fn(),
            webContents: {
                openDevTools: vitest_1.vi.fn(),
            },
            show: vitest_1.vi.fn(),
        }));
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('createWindow', () => {
        (0, vitest_1.it)('should create a BrowserWindow with correct configuration', async () => {
            const { createWindow } = await Promise.resolve().then(() => __importStar(require('../index')));
            createWindow();
            (0, vitest_1.expect)(electron_1.BrowserWindow).toHaveBeenCalledWith({
                width: 1200,
                height: 800,
                minWidth: 800,
                minHeight: 600,
                webPreferences: {
                    preload: vitest_1.expect.any(String),
                    nodeIntegration: false,
                    contextIsolation: true,
                    sandbox: true,
                },
                show: false,
            });
        });
        (0, vitest_1.it)('should load Vite dev server in development mode', async () => {
            process.env.NODE_ENV = 'development';
            vitest_1.vi.resetModules();
            const { createWindow } = await Promise.resolve().then(() => __importStar(require('../index')));
            createWindow();
            const mockWindow = electron_1.BrowserWindow.mock.results[0].value;
            (0, vitest_1.expect)(mockWindow.loadURL).toHaveBeenCalledWith('http://localhost:5173');
            (0, vitest_1.expect)(mockWindow.webContents.openDevTools).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should load built files in production mode', async () => {
            process.env.NODE_ENV = 'production';
            vitest_1.vi.resetModules();
            const { createWindow } = await Promise.resolve().then(() => __importStar(require('../index')));
            createWindow();
            const mockWindow = electron_1.BrowserWindow.mock.results[0].value;
            (0, vitest_1.expect)(mockWindow.loadFile).toHaveBeenCalled();
            (0, vitest_1.expect)(mockWindow.loadURL).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should show window when ready-to-show event fires', async () => {
            const { createWindow } = await Promise.resolve().then(() => __importStar(require('../index')));
            createWindow();
            const mockWindow = electron_1.BrowserWindow.mock.results[0].value;
            (0, vitest_1.expect)(mockWindow.once).toHaveBeenCalledWith('ready-to-show', vitest_1.expect.any(Function));
        });
        (0, vitest_1.it)('should set mainWindow to null on closed event', async () => {
            const { createWindow } = await Promise.resolve().then(() => __importStar(require('../index')));
            createWindow();
            const mockWindow = electron_1.BrowserWindow.mock.results[0].value;
            (0, vitest_1.expect)(mockWindow.on).toHaveBeenCalledWith('closed', vitest_1.expect.any(Function));
        });
    });
});
(0, vitest_1.describe)('Main Process - IPC Handlers', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        vitest_1.vi.resetModules();
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('registerIpcHandlers', () => {
        (0, vitest_1.it)('should register all IPC handlers', async () => {
            const { registerIpcHandlers } = await Promise.resolve().then(() => __importStar(require('../index')));
            registerIpcHandlers();
            (0, vitest_1.expect)(electron_1.ipcMain.handle).toHaveBeenCalledWith('get-version', vitest_1.expect.any(Function));
            (0, vitest_1.expect)(electron_1.ipcMain.handle).toHaveBeenCalledWith('ping', vitest_1.expect.any(Function));
            (0, vitest_1.expect)(electron_1.ipcMain.handle).toHaveBeenCalledWith('get-app-info', vitest_1.expect.any(Function));
            (0, vitest_1.expect)(electron_1.ipcMain.handle).toHaveBeenCalledWith('send-message', vitest_1.expect.any(Function));
        });
        (0, vitest_1.it)('should handle get-version request', async () => {
            const { registerIpcHandlers } = await Promise.resolve().then(() => __importStar(require('../index')));
            registerIpcHandlers();
            const getVersionHandler = electron_1.ipcMain.handle.mock.calls.find((call) => call[0] === 'get-version')?.[1];
            (0, vitest_1.expect)(getVersionHandler).toBeDefined();
            const result = await getVersionHandler();
            (0, vitest_1.expect)(result).toBe('1.0.0');
        });
        (0, vitest_1.it)('should handle ping request', async () => {
            const { registerIpcHandlers } = await Promise.resolve().then(() => __importStar(require('../index')));
            registerIpcHandlers();
            const pingHandler = electron_1.ipcMain.handle.mock.calls.find((call) => call[0] === 'ping')?.[1];
            (0, vitest_1.expect)(pingHandler).toBeDefined();
            const result = await pingHandler();
            (0, vitest_1.expect)(result).toBe('pong');
        });
        (0, vitest_1.it)('should handle get-app-info request', async () => {
            const { registerIpcHandlers } = await Promise.resolve().then(() => __importStar(require('../index')));
            registerIpcHandlers();
            const getAppInfoHandler = electron_1.ipcMain.handle.mock.calls.find((call) => call[0] === 'get-app-info')?.[1];
            (0, vitest_1.expect)(getAppInfoHandler).toBeDefined();
            const result = await getAppInfoHandler();
            (0, vitest_1.expect)(result).toEqual({
                name: 'TestApp',
                version: '1.0.0',
            });
        });
        (0, vitest_1.it)('should handle send-message request', async () => {
            const { registerIpcHandlers } = await Promise.resolve().then(() => __importStar(require('../index')));
            registerIpcHandlers();
            const sendMessageHandler = electron_1.ipcMain.handle.mock.calls.find((call) => call[0] === 'send-message')?.[1];
            (0, vitest_1.expect)(sendMessageHandler).toBeDefined();
            const result = await sendMessageHandler(null, 'Hello');
            (0, vitest_1.expect)(result).toBe('Echo: Hello');
        });
        (0, vitest_1.it)('should handle empty message in send-message', async () => {
            const { registerIpcHandlers } = await Promise.resolve().then(() => __importStar(require('../index')));
            registerIpcHandlers();
            const sendMessageHandler = electron_1.ipcMain.handle.mock.calls.find((call) => call[0] === 'send-message')?.[1];
            const result = await sendMessageHandler(null, '');
            (0, vitest_1.expect)(result).toBe('Echo: ');
        });
    });
    (0, vitest_1.describe)('unregisterIpcHandlers', () => {
        (0, vitest_1.it)('should remove all IPC handlers', async () => {
            const { registerIpcHandlers, unregisterIpcHandlers } = await Promise.resolve().then(() => __importStar(require('../index')));
            registerIpcHandlers();
            unregisterIpcHandlers();
            (0, vitest_1.expect)(electron_1.ipcMain.removeHandler).toHaveBeenCalledWith('get-version');
            (0, vitest_1.expect)(electron_1.ipcMain.removeHandler).toHaveBeenCalledWith('ping');
            (0, vitest_1.expect)(electron_1.ipcMain.removeHandler).toHaveBeenCalledWith('get-app-info');
            (0, vitest_1.expect)(electron_1.ipcMain.removeHandler).toHaveBeenCalledWith('send-message');
        });
    });
});
(0, vitest_1.describe)('Main Process - App Lifecycle', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        vitest_1.vi.resetModules();
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)('should register app event listeners', async () => {
        // Import main index to trigger app.on() calls
        await Promise.resolve().then(() => __importStar(require('../index')));
        (0, vitest_1.expect)(electron_1.app.on).toHaveBeenCalledWith('ready', vitest_1.expect.any(Function));
        (0, vitest_1.expect)(electron_1.app.on).toHaveBeenCalledWith('window-all-closed', vitest_1.expect.any(Function));
        (0, vitest_1.expect)(electron_1.app.on).toHaveBeenCalledWith('activate', vitest_1.expect.any(Function));
        (0, vitest_1.expect)(electron_1.app.on).toHaveBeenCalledWith('before-quit', vitest_1.expect.any(Function));
    });
    (0, vitest_1.it)('should quit app on window-all-closed for non-darwin platforms', async () => {
        Object.defineProperty(process, 'platform', {
            value: 'win32',
        });
        // Import main index
        await Promise.resolve().then(() => __importStar(require('../index')));
        const windowAllClosedCallback = electron_1.app.on.mock.calls.find((call) => call[0] === 'window-all-closed')?.[1];
        windowAllClosedCallback?.();
        (0, vitest_1.expect)(electron_1.app.quit).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should not quit app on window-all-closed for darwin platform', async () => {
        Object.defineProperty(process, 'platform', {
            value: 'darwin',
        });
        // Re-import to get fresh callbacks
        vitest_1.vi.resetModules();
        await Promise.resolve().then(() => __importStar(require('../index')));
        const windowAllClosedCallback = electron_1.app.on.mock.calls.find((call) => call[0] === 'window-all-closed')?.[1];
        windowAllClosedCallback?.();
        (0, vitest_1.expect)(electron_1.app.quit).not.toHaveBeenCalled();
    });
});
