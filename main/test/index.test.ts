import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ipcMain, app, BrowserWindow } from 'electron'

// Mock Electron modules
vi.mock('electron', () => ({
  app: {
    getVersion: vi.fn(() => '1.0.0'),
    getName: vi.fn(() => 'TestApp'),
    on: vi.fn(),
    quit: vi.fn(),
  },
  BrowserWindow: vi.fn().mockImplementation(() => ({
    loadURL: vi.fn().mockResolvedValue(undefined),
    loadFile: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    once: vi.fn(),
    webContents: {
      openDevTools: vi.fn(),
    },
    show: vi.fn(),
  })),
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  },
  IpcMainInvokeEvent: {},
}))

describe('Main Process - Window Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.NODE_ENV = 'test'

    // Reset BrowserWindow mock to return fresh instance
    ;(BrowserWindow as any).mockImplementation(() => ({
      loadURL: vi.fn().mockResolvedValue(undefined),
      loadFile: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      once: vi.fn(),
      webContents: {
        openDevTools: vi.fn(),
      },
      show: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createWindow', () => {
    it('should create a BrowserWindow with correct configuration', async () => {
      const { createWindow } = await import('../index')
      createWindow()

      expect(BrowserWindow).toHaveBeenCalledWith({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
          preload: expect.any(String),
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
        },
        show: false,
      })
    })

    it('should load Vite dev server in development mode', async () => {
      process.env.NODE_ENV = 'development'
      vi.resetModules()

      const { createWindow } = await import('../index')
      createWindow()

      const mockWindow = (BrowserWindow as any).mock.results[0].value
      expect(mockWindow.loadURL).toHaveBeenCalledWith('http://localhost:5173')
      expect(mockWindow.webContents.openDevTools).toHaveBeenCalled()
    })

    it('should load built files in production mode', async () => {
      process.env.NODE_ENV = 'production'
      vi.resetModules()

      const { createWindow } = await import('../index')
      createWindow()

      const mockWindow = (BrowserWindow as any).mock.results[0].value
      expect(mockWindow.loadFile).toHaveBeenCalled()
      expect(mockWindow.loadURL).not.toHaveBeenCalled()
    })

    it('should show window when ready-to-show event fires', async () => {
      const { createWindow } = await import('../index')
      createWindow()

      const mockWindow = (BrowserWindow as any).mock.results[0].value
      expect(mockWindow.once).toHaveBeenCalledWith('ready-to-show', expect.any(Function))
    })

    it('should set mainWindow to null on closed event', async () => {
      const { createWindow } = await import('../index')
      createWindow()

      const mockWindow = (BrowserWindow as any).mock.results[0].value
      expect(mockWindow.on).toHaveBeenCalledWith('closed', expect.any(Function))
    })
  })
})

describe('Main Process - IPC Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('registerIpcHandlers', () => {
    it('should register all IPC handlers', async () => {
      const { registerIpcHandlers } = await import('../index')
      registerIpcHandlers()

      expect(ipcMain.handle).toHaveBeenCalledWith('get-version', expect.any(Function))
      expect(ipcMain.handle).toHaveBeenCalledWith('ping', expect.any(Function))
      expect(ipcMain.handle).toHaveBeenCalledWith('get-app-info', expect.any(Function))
      expect(ipcMain.handle).toHaveBeenCalledWith('send-message', expect.any(Function))
    })

    it('should handle get-version request', async () => {
      const { registerIpcHandlers } = await import('../index')
      registerIpcHandlers()

      const getVersionHandler = (ipcMain.handle as any).mock.calls.find(
        (call: any[]) => call[0] === 'get-version'
      )?.[1]

      expect(getVersionHandler).toBeDefined()
      const result = await getVersionHandler()
      expect(result).toBe('1.0.0')
    })

    it('should handle ping request', async () => {
      const { registerIpcHandlers } = await import('../index')
      registerIpcHandlers()

      const pingHandler = (ipcMain.handle as any).mock.calls.find(
        (call: any[]) => call[0] === 'ping'
      )?.[1]

      expect(pingHandler).toBeDefined()
      const result = await pingHandler()
      expect(result).toBe('pong')
    })

    it('should handle get-app-info request', async () => {
      const { registerIpcHandlers } = await import('../index')
      registerIpcHandlers()

      const getAppInfoHandler = (ipcMain.handle as any).mock.calls.find(
        (call: any[]) => call[0] === 'get-app-info'
      )?.[1]

      expect(getAppInfoHandler).toBeDefined()
      const result = await getAppInfoHandler()
      expect(result).toEqual({
        name: 'TestApp',
        version: '1.0.0',
      })
    })

    it('should handle send-message request', async () => {
      const { registerIpcHandlers } = await import('../index')
      registerIpcHandlers()

      const sendMessageHandler = (ipcMain.handle as any).mock.calls.find(
        (call: any[]) => call[0] === 'send-message'
      )?.[1]

      expect(sendMessageHandler).toBeDefined()
      const result = await sendMessageHandler(null, 'Hello')
      expect(result).toBe('Echo: Hello')
    })

    it('should handle empty message in send-message', async () => {
      const { registerIpcHandlers } = await import('../index')
      registerIpcHandlers()

      const sendMessageHandler = (ipcMain.handle as any).mock.calls.find(
        (call: any[]) => call[0] === 'send-message'
      )?.[1]

      const result = await sendMessageHandler(null, '')
      expect(result).toBe('Echo: ')
    })
  })

  describe('unregisterIpcHandlers', () => {
    it('should remove all IPC handlers', async () => {
      const { registerIpcHandlers, unregisterIpcHandlers } = await import('../index')
      registerIpcHandlers()
      unregisterIpcHandlers()

      expect(ipcMain.removeHandler).toHaveBeenCalledWith('get-version')
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('ping')
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('get-app-info')
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('send-message')
    })
  })
})

describe('Main Process - App Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should register app event listeners', async () => {
    // Import main index to trigger app.on() calls
    await import('../index')

    expect(app.on).toHaveBeenCalledWith('ready', expect.any(Function))
    expect(app.on).toHaveBeenCalledWith('window-all-closed', expect.any(Function))
    expect(app.on).toHaveBeenCalledWith('activate', expect.any(Function))
    expect(app.on).toHaveBeenCalledWith('before-quit', expect.any(Function))
  })

  it('should quit app on window-all-closed for non-darwin platforms', async () => {
    Object.defineProperty(process, 'platform', {
      value: 'win32',
    })

    // Import main index
    await import('../index')

    const windowAllClosedCallback = (app.on as any).mock.calls.find(
      (call: any[]) => call[0] === 'window-all-closed'
    )?.[1]

    windowAllClosedCallback?.()
    expect(app.quit).toHaveBeenCalled()
  })

  it('should not quit app on window-all-closed for darwin platform', async () => {
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
    })

    // Re-import to get fresh callbacks
    vi.resetModules()
    await import('../index')

    const windowAllClosedCallback = (app.on as any).mock.calls.find(
      (call: any[]) => call[0] === 'window-all-closed'
    )?.[1]

    windowAllClosedCallback?.()
    expect(app.quit).not.toHaveBeenCalled()
  })
})
