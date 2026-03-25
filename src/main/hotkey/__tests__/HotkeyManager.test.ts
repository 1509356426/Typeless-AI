import { globalShortcut, BrowserWindow } from 'electron';
import { HotkeyManager } from '../HotkeyManager';
import { DEFAULT_HOTKEY_CONFIG, IPC_CHANNELS } from '../types';

// Cast to access test helpers
const mockGlobalShortcut = globalShortcut as typeof globalShortcut & {
  _trigger: (acc: string) => void;
  _reset: () => void;
};
const mockBrowserWindow = BrowserWindow as typeof BrowserWindow & {
  _addWindow: (wc: { send: jest.Mock }, destroyed?: boolean) => void;
  _reset: () => void;
};

beforeEach(() => {
  mockGlobalShortcut._reset();
  mockBrowserWindow._reset();
});

// ---------------------------------------------------------------------------
// register / unregister / isRegistered
// ---------------------------------------------------------------------------

describe('register()', () => {
  it('registers a new hotkey and returns true', () => {
    const manager = new HotkeyManager();
    const cb = jest.fn();
    expect(manager.register('Alt+Space', cb)).toBe(true);
    expect(globalShortcut.register).toHaveBeenCalledWith('Alt+Space', expect.any(Function));
  });

  it('returns false when registration fails after conflict resolution', () => {
    // Make register always fail
    (globalShortcut.register as jest.Mock).mockReturnValue(false);
    // Simulate the key already being registered by another app
    (globalShortcut.isRegistered as jest.Mock).mockReturnValue(false);

    const manager = new HotkeyManager();
    expect(manager.register('Alt+Space', jest.fn())).toBe(false);
  });

  it('unregisters conflicting key before re-registering', () => {
    const manager = new HotkeyManager();
    // Pre-register via globalShortcut directly to simulate a conflict
    (globalShortcut.isRegistered as jest.Mock).mockReturnValueOnce(true);
    const cb = jest.fn();
    manager.register('Ctrl+Shift+R', cb);
    expect(globalShortcut.unregister).toHaveBeenCalledWith('Ctrl+Shift+R');
    expect(globalShortcut.register).toHaveBeenCalledWith('Ctrl+Shift+R', expect.any(Function));
  });
});

describe('unregister()', () => {
  it('delegates to globalShortcut.unregister', () => {
    const manager = new HotkeyManager();
    manager.unregister('Alt+Space');
    expect(globalShortcut.unregister).toHaveBeenCalledWith('Alt+Space');
  });
});

describe('isRegistered()', () => {
  it('returns true when globalShortcut reports registered', () => {
    const manager = new HotkeyManager();
    manager.register('Alt+Space', jest.fn());
    expect(manager.isRegistered('Alt+Space')).toBe(true);
  });

  it('returns false for unregistered keys', () => {
    const manager = new HotkeyManager();
    expect(manager.isRegistered('Ctrl+Q')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// registerAll() — default config
// ---------------------------------------------------------------------------

describe('registerAll()', () => {
  it('registers default start and stop hotkeys', () => {
    const manager = new HotkeyManager();
    manager.registerAll();
    expect(manager.isRegistered(DEFAULT_HOTKEY_CONFIG.startRecording)).toBe(true);
    expect(manager.isRegistered(DEFAULT_HOTKEY_CONFIG.stopRecording)).toBe(true);
  });

  it('uses custom config when provided', () => {
    const manager = new HotkeyManager({ startRecording: 'Ctrl+R', stopRecording: 'Ctrl+S' });
    manager.registerAll();
    expect(manager.isRegistered('Ctrl+R')).toBe(true);
    expect(manager.isRegistered('Ctrl+S')).toBe(true);
    expect(manager.isRegistered('Alt+Space')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// IPC broadcast
// ---------------------------------------------------------------------------

describe('IPC broadcast', () => {
  it('sends hotkey:record to all renderer windows when start hotkey fires', () => {
    const sendMock = jest.fn();
    mockBrowserWindow._addWindow({ send: sendMock });

    const manager = new HotkeyManager();
    manager.registerAll();
    mockGlobalShortcut._trigger(DEFAULT_HOTKEY_CONFIG.startRecording);

    expect(sendMock).toHaveBeenCalledWith(IPC_CHANNELS.HOTKEY_RECORD);
  });

  it('sends hotkey:stop to all renderer windows when stop hotkey fires', () => {
    const sendMock = jest.fn();
    mockBrowserWindow._addWindow({ send: sendMock });

    const manager = new HotkeyManager();
    manager.registerAll();
    mockGlobalShortcut._trigger(DEFAULT_HOTKEY_CONFIG.stopRecording);

    expect(sendMock).toHaveBeenCalledWith(IPC_CHANNELS.HOTKEY_STOP);
  });

  it('broadcasts to multiple windows', () => {
    const send1 = jest.fn();
    const send2 = jest.fn();
    mockBrowserWindow._addWindow({ send: send1 });
    mockBrowserWindow._addWindow({ send: send2 });

    const manager = new HotkeyManager();
    manager.registerAll();
    mockGlobalShortcut._trigger(DEFAULT_HOTKEY_CONFIG.startRecording);

    expect(send1).toHaveBeenCalledWith(IPC_CHANNELS.HOTKEY_RECORD);
    expect(send2).toHaveBeenCalledWith(IPC_CHANNELS.HOTKEY_RECORD);
  });

  it('does not broadcast to destroyed windows', () => {
    const sendMock = jest.fn();
    mockBrowserWindow._addWindow({ send: sendMock }, true); // destroyed=true

    const manager = new HotkeyManager();
    manager.registerAll();
    mockGlobalShortcut._trigger(DEFAULT_HOTKEY_CONFIG.startRecording);

    expect(sendMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// unregisterAll() / updateConfig()
// ---------------------------------------------------------------------------

describe('unregisterAll()', () => {
  it('unregisters all managed hotkeys', () => {
    const manager = new HotkeyManager();
    manager.registerAll();
    manager.unregisterAll();
    expect(globalShortcut.unregister).toHaveBeenCalledWith(DEFAULT_HOTKEY_CONFIG.startRecording);
    expect(globalShortcut.unregister).toHaveBeenCalledWith(DEFAULT_HOTKEY_CONFIG.stopRecording);
  });
});

describe('updateConfig()', () => {
  it('re-registers with new accelerators after config update', () => {
    const manager = new HotkeyManager();
    manager.registerAll();
    manager.updateConfig({ startRecording: 'Ctrl+Shift+R' });

    expect(manager.isRegistered('Ctrl+Shift+R')).toBe(true);
  });

  it('unregisters old accelerators after config update', () => {
    const manager = new HotkeyManager();
    manager.registerAll();
    manager.updateConfig({ startRecording: 'Ctrl+Shift+R' });

    // The old key should have been unregistered
    expect(globalShortcut.unregister).toHaveBeenCalledWith(DEFAULT_HOTKEY_CONFIG.startRecording);
  });
});

describe('getConfig()', () => {
  it('returns a copy of the current config', () => {
    const manager = new HotkeyManager({ startRecording: 'Ctrl+R' });
    const config = manager.getConfig();
    expect(config.startRecording).toBe('Ctrl+R');
    expect(config.stopRecording).toBe(DEFAULT_HOTKEY_CONFIG.stopRecording);
    // Mutating the returned config should not affect the manager
    config.startRecording = 'X';
    expect(manager.getConfig().startRecording).toBe('Ctrl+R');
  });
});
