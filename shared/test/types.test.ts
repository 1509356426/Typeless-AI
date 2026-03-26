/**
 * Tests for shared types and utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  IPCChannel,
  type IPCMessage,
  type IPCRequest,
  type IPCResponse,
  type AppInfo,
  type UserMessage,
} from '../types';
import {
  generateId,
  getTimestamp,
  isValidIPCChannel,
  isIPCMessage,
  isIPCRequest,
  isIPCResponse,
  isAppInfo,
  isUserMessage,
  isOpenExternalPayload,
  isDialogOptions,
  buildRequest,
  buildResponse,
  createUserMessage,
  createIPCMessage,
  formatTimestamp,
  isValidUrl,
  safeJSONParse,
  safeJSONStringify,
  deepClone,
  debounce,
  throttle,
  sleep,
  retry,
  pick,
  omit,
} from '../index';

describe('IPCChannel', () => {
  it('should have all expected channels', () => {
    expect(IPCChannel.GET_VERSION).toBe('get-version');
    expect(IPCChannel.GET_APP_INFO).toBe('get-app-info');
    expect(IPCChannel.SEND_MESSAGE).toBe('send-message');
    expect(IPCChannel.RECEIVE_MESSAGE).toBe('receive-message');
    expect(IPCChannel.OPEN_EXTERNAL).toBe('open-external');
    expect(IPCChannel.SHOW_ERROR).toBe('show-error');
    expect(IPCChannel.SHOW_INFO).toBe('show-info');
  });
});

describe('Type builders', () => {
  it('should build a valid request', () => {
    const request = buildRequest(IPCChannel.GET_VERSION);
    expect(request.channel).toBe(IPCChannel.GET_VERSION);
    expect(request.payload).toBeUndefined();
  });

  it('should build a request with payload', () => {
    const payload = { url: 'https://example.com' };
    const request = buildRequest(IPCChannel.OPEN_EXTERNAL, payload);
    expect(request.channel).toBe(IPCChannel.OPEN_EXTERNAL);
    expect(request.payload).toEqual(payload);
  });

  it('should build a successful response', () => {
    const response = buildResponse(true, { data: 'test' });
    expect(response.success).toBe(true);
    expect(response.data).toEqual({ data: 'test' });
    expect(response.error).toBeUndefined();
  });

  it('should build an error response', () => {
    const response = buildResponse(false, undefined, 'Error occurred');
    expect(response.success).toBe(false);
    expect(response.data).toBeUndefined();
    expect(response.error).toBe('Error occurred');
  });
});

describe('generateId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
  });

  it('should generate IDs with timestamp prefix', () => {
    const id = generateId();
    const parts = id.split('-');
    expect(parts[0]).toMatch(/^\d+$/);
  });
});

describe('getTimestamp', () => {
  it('should return a number timestamp', () => {
    const timestamp = getTimestamp();
    expect(typeof timestamp).toBe('number');
    expect(timestamp).toBeGreaterThan(0);
  });

  it('should return current time', () => {
    const before = Date.now();
    const timestamp = getTimestamp();
    const after = Date.now();
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});

describe('Type guards', () => {
  describe('isValidIPCChannel', () => {
    it('should return true for valid channels', () => {
      expect(isValidIPCChannel(IPCChannel.GET_VERSION)).toBe(true);
      expect(isValidIPCChannel('get-version')).toBe(true);
    });

    it('should return false for invalid channels', () => {
      expect(isValidIPCChannel('invalid-channel')).toBe(false);
      expect(isValidIPCChannel('')).toBe(false);
      expect(isValidIPCChannel(null)).toBe(false);
      expect(isValidIPCChannel(undefined)).toBe(false);
    });
  });

  describe('isIPCMessage', () => {
    it('should return true for valid IPC messages', () => {
      const message: IPCMessage<string> = {
        id: '123',
        channel: IPCChannel.GET_VERSION,
        timestamp: Date.now(),
      };
      expect(isIPCMessage(message)).toBe(true);
    });

    it('should return true for messages with payload', () => {
      const message: IPCMessage<{ text: string }> = {
        id: '123',
        channel: IPCChannel.SEND_MESSAGE,
        payload: { text: 'hello' },
        timestamp: Date.now(),
      };
      expect(isIPCMessage(message)).toBe(true);
    });

    it('should return false for invalid messages', () => {
      expect(isIPCMessage(null)).toBe(false);
      expect(isIPCMessage({})).toBe(false);
      expect(isIPCMessage({ id: '123' })).toBe(false);
      expect(isIPCMessage({ id: '123', channel: 'invalid' })).toBe(false);
    });
  });

  describe('isIPCRequest', () => {
    it('should return true for valid IPC requests', () => {
      const request: IPCRequest = { channel: IPCChannel.GET_VERSION };
      expect(isIPCRequest(request)).toBe(true);
    });

    it('should return true for requests with payload', () => {
      const request: IPCRequest<{ text: string }> = {
        channel: IPCChannel.SEND_MESSAGE,
        payload: { text: 'hello' },
      };
      expect(isIPCRequest(request)).toBe(true);
    });

    it('should return false for invalid requests', () => {
      expect(isIPCRequest(null)).toBe(false);
      expect(isIPCRequest({})).toBe(false);
      expect(isIPCRequest({ channel: 'invalid' })).toBe(false);
    });
  });

  describe('isIPCResponse', () => {
    it('should return true for successful responses', () => {
      const response: IPCResponse<string> = {
        success: true,
        data: 'result',
      };
      expect(isIPCResponse(response)).toBe(true);
    });

    it('should return true for error responses', () => {
      const response: IPCResponse = {
        success: false,
        error: 'Error',
      };
      expect(isIPCResponse(response)).toBe(true);
    });

    it('should return false for invalid responses', () => {
      expect(isIPCResponse(null)).toBe(false);
      expect(isIPCResponse({})).toBe(false);
      expect(isIPCResponse({ success: true })).toBe(false);
    });
  });

  describe('isAppInfo', () => {
    const validAppInfo: AppInfo = {
      name: 'Test App',
      version: '1.0.0',
      electronVersion: '28.0.0',
      platform: 'darwin',
      arch: 'x64',
    };

    it('should return true for valid AppInfo', () => {
      expect(isAppInfo(validAppInfo)).toBe(true);
    });

    it('should return false for invalid AppInfo', () => {
      expect(isAppInfo(null)).toBe(false);
      expect(isAppInfo({})).toBe(false);
      expect(isAppInfo({ name: 'Test' })).toBe(false);
    });
  });

  describe('isUserMessage', () => {
    const validMessage: UserMessage = {
      text: 'Hello',
      sender: 'main',
      timestamp: Date.now(),
    };

    it('should return true for valid UserMessage', () => {
      expect(isUserMessage(validMessage)).toBe(true);
    });

    it('should return true for renderer sender', () => {
      const message: UserMessage = {
        text: 'Hello',
        sender: 'renderer',
        timestamp: Date.now(),
      };
      expect(isUserMessage(message)).toBe(true);
    });

    it('should return false for invalid UserMessage', () => {
      expect(isUserMessage(null)).toBe(false);
      expect(isUserMessage({})).toBe(false);
      expect(isUserMessage({ text: 'Hello', sender: 'invalid' })).toBe(false);
    });
  });

  describe('isOpenExternalPayload', () => {
    it('should return true for valid payload', () => {
      expect(isOpenExternalPayload({ url: 'https://example.com' })).toBe(true);
    });

    it('should return false for invalid payload', () => {
      expect(isOpenExternalPayload(null)).toBe(false);
      expect(isOpenExternalPayload({})).toBe(false);
      expect(isOpenExternalPayload({ url: 123 })).toBe(false);
    });
  });

  describe('isDialogOptions', () => {
    it('should return true for valid options', () => {
      expect(isDialogOptions({ title: 'Error', message: 'Test' })).toBe(true);
    });

    it('should return true with detail', () => {
      const options = { title: 'Error', message: 'Test', detail: 'Details' };
      expect(isDialogOptions(options)).toBe(true);
    });

    it('should return false for invalid options', () => {
      expect(isDialogOptions(null)).toBe(false);
      expect(isDialogOptions({})).toBe(false);
      expect(isDialogOptions({ title: 'Error' })).toBe(false);
    });
  });
});

describe('createUserMessage', () => {
  it('should create a message with main sender', () => {
    const message = createUserMessage('Hello', 'main');
    expect(message.text).toBe('Hello');
    expect(message.sender).toBe('main');
    expect(message.timestamp).toBeLessThanOrEqual(Date.now());
  });

  it('should create a message with renderer sender', () => {
    const message = createUserMessage('World', 'renderer');
    expect(message.text).toBe('World');
    expect(message.sender).toBe('renderer');
  });
});

describe('createIPCMessage', () => {
  it('should create a message without payload', () => {
    const message = createIPCMessage(IPCChannel.GET_VERSION);
    expect(message.channel).toBe(IPCChannel.GET_VERSION);
    expect(message.payload).toBeUndefined();
    expect(message.id).toBeDefined();
    expect(message.timestamp).toBeDefined();
  });

  it('should create a message with payload', () => {
    const payload = { text: 'test' };
    const message = createIPCMessage(IPCChannel.SEND_MESSAGE, payload);
    expect(message.payload).toEqual(payload);
  });
});

describe('formatTimestamp', () => {
  it('should format timestamp to ISO string', () => {
    const timestamp = 1234567890000;
    const formatted = formatTimestamp(timestamp);
    expect(formatted).toBe('2009-02-13T23:31:30.000Z');
  });
});

describe('isValidUrl', () => {
  it('should return true for valid URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://localhost:3000')).toBe(true);
    expect(isValidUrl('file:///path/to/file')).toBe(true);
  });

  it('should return false for invalid URLs', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
    expect(isValidUrl('')).toBe(false);
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
  });
});

describe('safeJSONParse', () => {
  it('should parse valid JSON', () => {
    const result = safeJSONParse('{"key":"value"}', {});
    expect(result).toEqual({ key: 'value' });
  });

  it('should return fallback for invalid JSON', () => {
    const fallback = { default: true };
    const result = safeJSONParse('invalid json', fallback);
    expect(result).toEqual(fallback);
  });
});

describe('safeJSONStringify', () => {
  it('should stringify valid objects', () => {
    const result = safeJSONStringify({ key: 'value' });
    expect(result).toBe('{"key":"value"}');
  });

  it('should return fallback for circular references', () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    const result = safeJSONStringify(obj, 'fallback');
    expect(result).toBe('fallback');
  });
});

describe('deepClone', () => {
  it('should clone simple objects', () => {
    const original = { a: 1, b: 'test' };
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
  });

  it('should clone nested objects', () => {
    const original = { a: { b: { c: 1 } } };
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned.a).not.toBe(original.a);
  });
});

describe('debounce', () => {
  it('should debounce function calls', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});

describe('throttle', () => {
  it('should throttle function calls', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn();
    throttledFn();
    throttledFn();

    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});

describe('sleep', () => {
  it('should sleep for specified time', async () => {
    const start = Date.now();
    await sleep(100);
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(100);
  });
});

describe('retry', () => {
  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await retry(fn, 3, 10);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    let attempts = 0;
    const fn = vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 3) throw new Error('failed');
      return 'success';
    });

    const result = await retry(fn, 3, 10);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('failed'));
    await expect(retry(fn, 3, 10)).rejects.toThrow('failed');
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

describe('pick', () => {
  it('should pick specified keys', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = pick(obj, ['a', 'c']);
    expect(result).toEqual({ a: 1, c: 3 });
  });

  it('should handle non-existent keys', () => {
    const obj = { a: 1 };
    const result = pick(obj, ['a', 'b'] as any);
    expect(result).toEqual({ a: 1 });
  });
});

describe('omit', () => {
  it('should omit specified keys', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = omit(obj, ['b']);
    expect(result).toEqual({ a: 1, c: 3 });
  });

  it('should handle multiple keys', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = omit(obj, ['a', 'c']);
    expect(result).toEqual({ b: 2 });
  });

  it('should not modify original object', () => {
    const obj = { a: 1, b: 2 };
    omit(obj, ['a']);
    expect(obj).toEqual({ a: 1, b: 2 });
  });
});
