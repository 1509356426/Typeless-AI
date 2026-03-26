import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron'
import * as path from 'path'
import { IPCChannel } from '@shared/types'

let mainWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === 'development'

const createWindow = (): BrowserWindow => {
  mainWindow = new BrowserWindow({
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
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // 开发模式加载 Vite 服务器，生产模式加载构建文件
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173').catch((err) => {
      console.error('Failed to load Vite dev server:', err)
    })
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html')).catch((err) => {
      console.error('Failed to load built renderer:', err)
    })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  return mainWindow
}

// IPC 处理程序
const handleGetVersion = (): string => {
  return app.getVersion()
}

const handlePing = (): string => {
  return 'pong'
}

const handleGetAppInfo = (): { name: string; version: string } => {
  return {
    name: app.getName(),
    version: app.getVersion(),
  }
}

const handleSendMessage = (_event: IpcMainInvokeEvent, message: string): string => {
  return `Echo: ${message}`
}

// 注册 IPC 处理程序
const registerIpcHandlers = (): void => {
  ipcMain.handle(IPCChannel.GET_VERSION, handleGetVersion)
  ipcMain.handle('ping', handlePing)
  ipcMain.handle(IPCChannel.GET_APP_INFO, handleGetAppInfo)
  ipcMain.handle(IPCChannel.SEND_MESSAGE, handleSendMessage)
}

// 清理 IPC 处理程序
const unregisterIpcHandlers = (): void => {
  ipcMain.removeHandler(IPCChannel.GET_VERSION)
  ipcMain.removeHandler('ping')
  ipcMain.removeHandler(IPCChannel.GET_APP_INFO)
  ipcMain.removeHandler(IPCChannel.SEND_MESSAGE)
}

// 应用生命周期
app.on('ready', () => {
  createWindow()
  registerIpcHandlers()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('before-quit', () => {
  unregisterIpcHandlers()
})

// 导出用于测试
export { createWindow, registerIpcHandlers, unregisterIpcHandlers }
