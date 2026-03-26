import { IPCChannel } from './types';

export * from './types';

// ============== Type Guards ==============

export function isValidIPCChannel(value: unknown): value is IPCChannel {
  return typeof value === 'string' && Object.values(IPCChannel).includes(value as IPCChannel);
}

export function isIPCMessage<T>(value: unknown): value is IPCMessage<T> {
  if (typeof value !== 'object' || value === null) return false;
  const msg = value as Record<string, unknown>;
  return (
    typeof msg.id === 'string' &&
    isValidIPCChannel(msg.channel) &&
    (msg.payload === undefined || msg.payload !== undefined) &&
    typeof msg.timestamp === 'number'
  );
}

export function isIPCRequest<T>(value: unknown): value is IPCRequest<T> {
  if (typeof value !== 'object' || value === null) return false;
  const req = value as Record<string, unknown>;
  return isValidIPCChannel(req.channel) && (req.payload === undefined || req.payload !== undefined);
}

export function isIPCResponse<T>(value: unknown): value is IPCResponse<T> {
  if (typeof value !== 'object' || value === null) return false;
  const res = value as Record<string, unknown>;
  return (
    typeof res.success === 'boolean' &&
    ((res.data !== undefined && res.data !== null) ||
      (res.error !== undefined && typeof res.error === 'string'))
  );
}

export function isAppInfo(value: unknown): value is AppInfo {
  if (typeof value !== 'object' || value === null) return false;
  const info = value as Record<string, unknown>;
  return (
    typeof info.name === 'string' &&
    typeof info.version === 'string' &&
    typeof info.electronVersion === 'string' &&
    typeof info.platform === 'string' &&
    typeof info.arch === 'string'
  );
}

export function isUserMessage(value: unknown): value is UserMessage {
  if (typeof value !== 'object' || value === null) return false;
  const msg = value as Record<string, unknown>;
  return (
    typeof msg.text === 'string' &&
    (msg.sender === 'main' || msg.sender === 'renderer') &&
    typeof msg.timestamp === 'number'
  );
}

export function isOpenExternalPayload(value: unknown): value is OpenExternalPayload {
  if (typeof value !== 'object' || value === null) return false;
  const payload = value as Record<string, unknown>;
  return typeof payload.url === 'string' && isValidUrl(payload.url);
}

export function isDialogOptions(value: unknown): value is DialogOptions {
  if (typeof value !== 'object' || value === null) return false;
  const opts = value as Record<string, unknown>;
  return (
    typeof opts.title === 'string' &&
    typeof opts.message === 'string' &&
    (opts.detail === undefined || typeof opts.detail === 'string')
  );
}

// ============== Type Builders ==============

export function buildRequest<T>(channel: IPCChannel, payload?: T): IPCRequest<T> {
  return { channel, payload };
}

export function buildResponse<T>(success: boolean, data?: T, error?: string): IPCResponse<T> {
  return { success, data, error };
}

export function createUserMessage(text: string, sender: 'main' | 'renderer'): UserMessage {
  return { text, sender, timestamp: getTimestamp() };
}

export function createIPCMessage<T>(channel: IPCChannel, payload?: T): IPCMessage<T> {
  return {
    id: generateId(),
    channel,
    payload,
    timestamp: getTimestamp(),
  };
}

// ============== ID & Timestamp Utilities ==============

export function generateId(): string {
  return `${getTimestamp()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function getTimestamp(): number {
  return Date.now();
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

// ============== Validation Utilities ==============

export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsed = new URL(url);
    // Reject javascript: and data: URLs for security
    if (parsed.protocol === 'javascript:' || parsed.protocol === 'data:') {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ============== JSON Utilities ==============

export function safeJSONParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export function safeJSONStringify(obj: unknown, fallback?: string): string | undefined {
  try {
    return JSON.stringify(obj);
  } catch {
    return fallback;
  }
}

// ============== Object Utilities ==============

export function deepClone<T>(obj: T): T {
  return structuredClone(obj);
}

export function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

export function omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}

// ============== Async Utilities ==============

export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

export function throttle<T extends (...args: any[]) => any>(fn: T, limit: number): T {
  let inThrottle: boolean;
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  delay: number
): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await sleep(delay);
      }
    }
  }
  throw lastError || new Error('Retry failed');
}
