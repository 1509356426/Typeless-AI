// Mock for Electron APIs used in unit tests

const registeredShortcuts = new Map<string, () => void>();

const globalShortcut = {
  register: jest.fn((accelerator: string, callback: () => void): boolean => {
    if (registeredShortcuts.has(accelerator)) {
      return false; // simulate conflict
    }
    registeredShortcuts.set(accelerator, callback);
    return true;
  }),
  unregister: jest.fn((accelerator: string): void => {
    registeredShortcuts.delete(accelerator);
  }),
  unregisterAll: jest.fn((): void => {
    registeredShortcuts.clear();
  }),
  isRegistered: jest.fn((accelerator: string): boolean => {
    return registeredShortcuts.has(accelerator);
  }),
  _trigger: (accelerator: string): void => {
    const cb = registeredShortcuts.get(accelerator);
    if (cb) cb();
  },
  _reset: (): void => {
    registeredShortcuts.clear();
    (globalShortcut.register as jest.Mock).mockClear();
    (globalShortcut.unregister as jest.Mock).mockClear();
    (globalShortcut.unregisterAll as jest.Mock).mockClear();
    (globalShortcut.isRegistered as jest.Mock).mockClear();
    (globalShortcut.register as jest.Mock).mockImplementation(
      (accelerator: string, callback: () => void): boolean => {
        if (registeredShortcuts.has(accelerator)) return false;
        registeredShortcuts.set(accelerator, callback);
        return true;
      }
    );
    (globalShortcut.isRegistered as jest.Mock).mockImplementation(
      (accelerator: string): boolean => registeredShortcuts.has(accelerator)
    );
    (globalShortcut.unregister as jest.Mock).mockImplementation(
      (accelerator: string): void => { registeredShortcuts.delete(accelerator); }
    );
  },
};

interface MockWindow {
  webContents: { send: jest.Mock };
  isDestroyed: () => boolean;
}

const windowInstances: MockWindow[] = [];

const BrowserWindow = {
  getAllWindows: jest.fn((): MockWindow[] => [...windowInstances]),
  _addWindow: (wc: { send: jest.Mock }, destroyed = false) => {
    windowInstances.push({ webContents: wc, isDestroyed: () => destroyed });
  },
  _reset: () => {
    windowInstances.length = 0;
    (BrowserWindow.getAllWindows as jest.Mock).mockClear();
    (BrowserWindow.getAllWindows as jest.Mock).mockImplementation(
      (): MockWindow[] => [...windowInstances]
    );
  },
};

export { globalShortcut, BrowserWindow };
