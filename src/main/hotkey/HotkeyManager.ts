import { globalShortcut, BrowserWindow } from 'electron';
import { DEFAULT_HOTKEY_CONFIG, HotkeyConfig, IPC_CHANNELS } from './types';

/**
 * HotkeyManager handles global shortcut registration and IPC notification
 * to renderer processes.
 *
 * Responsibilities:
 * - Register/unregister global shortcuts via Electron's globalShortcut API
 * - Detect hotkey conflicts and attempt re-registration after unregistering
 * - Broadcast IPC events to all renderer windows when a hotkey fires
 * - Load hotkey config (defaults + user overrides via loadConfig callback)
 */
export class HotkeyManager {
  private config: HotkeyConfig;
  /** Map from accelerator string → IPC channel it triggers */
  private hotkeyChannelMap = new Map<string, string>();

  constructor(config?: Partial<HotkeyConfig>) {
    this.config = { ...DEFAULT_HOTKEY_CONFIG, ...config };
  }

  /**
   * Register a hotkey. Returns true on success.
   * If the accelerator is already taken by another application, emits a
   * console warning, unregisters the conflicting key, and retries once.
   */
  register(accelerator: string, callback: () => void): boolean {
    if (globalShortcut.isRegistered(accelerator)) {
      console.warn(
        `[HotkeyManager] Conflict: "${accelerator}" is already registered. ` +
          `Unregistering and re-registering.`
      );
      globalShortcut.unregister(accelerator);
    }

    const success = globalShortcut.register(accelerator, callback);
    if (!success) {
      console.error(
        `[HotkeyManager] Failed to register "${accelerator}" after conflict resolution.`
      );
      return false;
    }
    return true;
  }

  /** Unregister a previously registered hotkey. */
  unregister(accelerator: string): void {
    globalShortcut.unregister(accelerator);
    this.hotkeyChannelMap.delete(accelerator);
  }

  /** Returns true if the given accelerator is currently registered. */
  isRegistered(accelerator: string): boolean {
    return globalShortcut.isRegistered(accelerator);
  }

  /**
   * Register all hotkeys defined in the config and wire them to IPC channels.
   * Call this once the Electron app is ready.
   */
  registerAll(): void {
    this._registerHotkey(
      this.config.startRecording,
      IPC_CHANNELS.HOTKEY_RECORD
    );
    this._registerHotkey(this.config.stopRecording, IPC_CHANNELS.HOTKEY_STOP);
  }

  /** Unregister all hotkeys managed by this instance. */
  unregisterAll(): void {
    for (const accelerator of this.hotkeyChannelMap.keys()) {
      globalShortcut.unregister(accelerator);
    }
    this.hotkeyChannelMap.clear();
  }

  /** Update the hotkey config and re-register all hotkeys. */
  updateConfig(newConfig: Partial<HotkeyConfig>): void {
    this.unregisterAll();
    this.config = { ...this.config, ...newConfig };
    this.registerAll();
  }

  /** Returns a copy of the current hotkey configuration. */
  getConfig(): HotkeyConfig {
    return { ...this.config };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _registerHotkey(accelerator: string, ipcChannel: string): void {
    const success = this.register(accelerator, () => {
      this._broadcastToRenderers(ipcChannel);
    });
    if (success) {
      this.hotkeyChannelMap.set(accelerator, ipcChannel);
    }
  }

  /** Send an IPC message to all open renderer windows. */
  private _broadcastToRenderers(channel: string): void {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send(channel);
      }
    }
  }
}
