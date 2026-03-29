import { useState, useCallback } from 'react';
import { LOG_COLORS, LOG_TYPES, GAME_CONFIG } from '../constants/gameConstants.js';

/**
 * Custom hook for managing game log messages
 */
export const useGameLog = () => {
  const [log, setLog] = useState([]);

  const addToLog = useCallback((message, type = LOG_TYPES.STANDARD) => {
    const timestamp = new Date().toLocaleTimeString();
    const color = LOG_COLORS[type] || LOG_COLORS[LOG_TYPES.STANDARD];
    
    setLog(prev => [
      { 
        text: `[${timestamp}] ${message}`, 
        color,
        type,
        timestamp: Date.now()
      }, 
      ...prev.slice(0, GAME_CONFIG.MAX_LOG_ENTRIES - 1)
    ]);
  }, []);

  const clearLog = useCallback(() => {
    setLog([]);
  }, []);

  return {
    log,
    addToLog,
    clearLog
  };
};
