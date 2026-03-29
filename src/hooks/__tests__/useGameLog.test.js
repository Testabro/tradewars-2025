import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameLog } from '../useGameLog.js';
import { LOG_TYPES, GAME_CONFIG } from '../../constants/gameConstants.js';

describe('useGameLog', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with empty log', () => {
    const { result } = renderHook(() => useGameLog());
    
    expect(result.current.log).toEqual([]);
    expect(typeof result.current.addToLog).toBe('function');
    expect(typeof result.current.clearLog).toBe('function');
  });

  it('should add log entry with default type', () => {
    const { result } = renderHook(() => useGameLog());
    
    act(() => {
      result.current.addToLog('Test message');
    });

    expect(result.current.log).toHaveLength(1);
    expect(result.current.log[0]).toMatchObject({
      text: expect.stringContaining('Test message'),
      color: 'text-green-500', // Default color for STANDARD type
      type: LOG_TYPES.STANDARD,
      timestamp: expect.any(Number),
    });
  });

  it('should add log entry with specific type', () => {
    const { result } = renderHook(() => useGameLog());
    
    act(() => {
      result.current.addToLog('Success message', LOG_TYPES.SUCCESS);
    });

    expect(result.current.log[0]).toMatchObject({
      text: expect.stringContaining('Success message'),
      color: 'text-cyan-400',
      type: LOG_TYPES.SUCCESS,
    });
  });

  it('should include timestamp in log message', () => {
    const { result } = renderHook(() => useGameLog());
    
    act(() => {
      result.current.addToLog('Test message');
    });

    expect(result.current.log[0].text).toMatch(/^\[\d{1,2}:\d{2}:\d{2} [AP]M\] Test message$/);
  });

  it('should add multiple log entries in reverse order', () => {
    const { result } = renderHook(() => useGameLog());
    
    act(() => {
      result.current.addToLog('First message');
      result.current.addToLog('Second message');
      result.current.addToLog('Third message');
    });

    expect(result.current.log).toHaveLength(3);
    expect(result.current.log[0].text).toContain('Third message');
    expect(result.current.log[1].text).toContain('Second message');
    expect(result.current.log[2].text).toContain('First message');
  });

  it('should limit log entries to MAX_LOG_ENTRIES', () => {
    const { result } = renderHook(() => useGameLog());
    
    act(() => {
      // Add more entries than the limit
      for (let i = 0; i < GAME_CONFIG.MAX_LOG_ENTRIES + 10; i++) {
        result.current.addToLog(`Message ${i}`);
      }
    });

    expect(result.current.log).toHaveLength(GAME_CONFIG.MAX_LOG_ENTRIES);
    // Should keep the most recent entries
    expect(result.current.log[0].text).toContain(`Message ${GAME_CONFIG.MAX_LOG_ENTRIES + 9}`);
  });

  it('should clear all log entries', () => {
    const { result } = renderHook(() => useGameLog());
    
    act(() => {
      result.current.addToLog('Message 1');
      result.current.addToLog('Message 2');
      result.current.addToLog('Message 3');
    });

    expect(result.current.log).toHaveLength(3);

    act(() => {
      result.current.clearLog();
    });

    expect(result.current.log).toHaveLength(0);
  });

  it('should handle all log types with correct colors', () => {
    const { result } = renderHook(() => useGameLog());
    
    const testCases = [
      { type: LOG_TYPES.STANDARD, expectedColor: 'text-green-500' },
      { type: LOG_TYPES.EVENT, expectedColor: 'text-yellow-400' },
      { type: LOG_TYPES.COMBAT_SELF, expectedColor: 'text-red-400' },
      { type: LOG_TYPES.COMBAT_OTHER, expectedColor: 'text-orange-400' },
      { type: LOG_TYPES.SUCCESS, expectedColor: 'text-cyan-400' },
      { type: LOG_TYPES.WARNING, expectedColor: 'text-yellow-600' },
      { type: LOG_TYPES.EMERGENCY, expectedColor: 'text-red-500' },
    ];

    act(() => {
      testCases.forEach(({ type }, index) => {
        result.current.addToLog(`Message ${index}`, type);
      });
    });

    testCases.forEach(({ expectedColor }, index) => {
      expect(result.current.log[testCases.length - 1 - index].color).toBe(expectedColor);
    });
  });

  it('should use default color for unknown log type', () => {
    const { result } = renderHook(() => useGameLog());
    
    act(() => {
      result.current.addToLog('Test message', 'UNKNOWN_TYPE');
    });

    expect(result.current.log[0].color).toBe('text-green-500');
  });

  it('should maintain stable function references', () => {
    const { result, rerender } = renderHook(() => useGameLog());
    
    const initialAddToLog = result.current.addToLog;
    const initialClearLog = result.current.clearLog;

    rerender();

    expect(result.current.addToLog).toBe(initialAddToLog);
    expect(result.current.clearLog).toBe(initialClearLog);
  });

  it('should handle rapid successive log additions', () => {
    const { result } = renderHook(() => useGameLog());
    
    act(() => {
      // Add many messages rapidly
      for (let i = 0; i < 50; i++) {
        result.current.addToLog(`Rapid message ${i}`);
      }
    });

    expect(result.current.log).toHaveLength(50);
    expect(result.current.log[0].text).toContain('Rapid message 49');
    expect(result.current.log[49].text).toContain('Rapid message 0');
  });

  it('should handle empty and special character messages', () => {
    const { result } = renderHook(() => useGameLog());
    
    const specialMessages = [
      '',
      '   ',
      'Message with "quotes"',
      'Message with <tags>',
      'Message with & symbols',
      'Message\nwith\nnewlines',
      'Message with emoji 🚀',
    ];

    act(() => {
      specialMessages.forEach(message => {
        result.current.addToLog(message);
      });
    });

    expect(result.current.log).toHaveLength(specialMessages.length);
    specialMessages.forEach((message, index) => {
      expect(result.current.log[specialMessages.length - 1 - index].text).toContain(message);
    });
  });
});
