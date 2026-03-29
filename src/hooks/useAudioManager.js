import { useRef, useCallback } from 'react';

// Audio file mappings
const AUDIO_FILES = {
  SECTOR_ENTER: '/audio/sector-enter.mp3',
  // We'll create these sound effects using Web Audio API for now
  BUTTON_CLICK: 'synth:click',
  TRADE_SUCCESS: 'synth:success',
  TRADE_FAIL: 'synth:error',
  ACHIEVEMENT: 'synth:achievement',
  WARNING: 'synth:warning',
  FUEL_LOW: 'synth:fuel_low',
  HULL_DAMAGE: 'synth:hull_damage',
  WARP_ENGAGE: 'synth:warp',
  CREDITS_GAIN: 'synth:credits'
};

export const useAudioManager = () => {
  const audioContextRef = useRef(null);
  const audioElementsRef = useRef({});

  // Initialize audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Create synthetic sounds using Web Audio API
  const createSyntheticSound = useCallback((type, frequency = 440, duration = 0.2) => {
    const audioContext = getAudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
      case 'click':
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.type = 'square';
        break;
      
      case 'success':
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.type = 'sine';
        duration = 0.3;
        break;
      
      case 'error':
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.type = 'sawtooth';
        duration = 0.3;
        break;
      
      case 'achievement':
        // Triumphant chord progression
        const frequencies = [523, 659, 784, 1047]; // C5, E5, G5, C6
        frequencies.forEach((freq, index) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          
          osc.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.1);
          gain.gain.setValueAtTime(0.1, audioContext.currentTime + index * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
          osc.type = 'sine';
          
          osc.start(audioContext.currentTime + index * 0.1);
          osc.stop(audioContext.currentTime + 0.8);
        });
        return; // Don't use the main oscillator for this complex sound
      
      case 'warning':
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.type = 'triangle';
        duration = 0.3;
        break;
      
      case 'fuel_low':
        oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.type = 'sine';
        duration = 0.4;
        break;
      
      case 'hull_damage':
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.type = 'sawtooth';
        duration = 0.5;
        break;
      
      case 'warp':
        oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(2000, audioContext.currentTime + 0.3);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.6);
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
        oscillator.type = 'sine';
        duration = 0.6;
        break;
      
      case 'credits':
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1500, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.type = 'sine';
        duration = 0.2;
        break;
      
      default:
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        oscillator.type = 'sine';
    }

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }, [getAudioContext]);

  // Play audio file or synthetic sound
  const playSound = useCallback((soundKey, volume = 0.3) => {
    try {
      const soundPath = AUDIO_FILES[soundKey];
      
      if (!soundPath) {
        console.warn(`Sound ${soundKey} not found`);
        return;
      }

      if (soundPath.startsWith('synth:')) {
        const synthType = soundPath.replace('synth:', '');
        createSyntheticSound(synthType);
        return;
      }

      // Handle audio files
      if (!audioElementsRef.current[soundKey]) {
        audioElementsRef.current[soundKey] = new Audio(soundPath);
        audioElementsRef.current[soundKey].preload = 'auto';
      }

      const audio = audioElementsRef.current[soundKey];
      audio.volume = volume;
      audio.currentTime = 0;
      audio.play().catch(error => {
        console.warn('Audio play failed:', error);
      });
    } catch (error) {
      console.warn('Audio error:', error);
    }
  }, [createSyntheticSound]);

  // Preload audio files
  const preloadSounds = useCallback(() => {
    Object.entries(AUDIO_FILES).forEach(([key, path]) => {
      if (!path.startsWith('synth:')) {
        audioElementsRef.current[key] = new Audio(path);
        audioElementsRef.current[key].preload = 'auto';
      }
    });
  }, []);

  return {
    playSound,
    preloadSounds,
    SOUNDS: AUDIO_FILES
  };
};
