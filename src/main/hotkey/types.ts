export interface HotkeyConfig {
  /** Accelerator string, e.g. "Alt+Space" */
  startRecording: string;
  /** Accelerator string, e.g. "Escape" */
  stopRecording: string;
}

export const DEFAULT_HOTKEY_CONFIG: HotkeyConfig = {
  startRecording: 'Alt+Space',
  stopRecording: 'Escape',
};

/** IPC channel names sent from main → renderer */
export const IPC_CHANNELS = {
  HOTKEY_RECORD: 'hotkey:record',
  HOTKEY_STOP: 'hotkey:stop',
} as const;
