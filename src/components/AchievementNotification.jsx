import React, { useState, useEffect } from 'react';
import { useAudioManager } from '../hooks/useAudioManager.js';

const ACHIEVEMENTS = {
  FIRST_TRADE: {
    id: 'first_trade',
    title: 'First Trade',
    description: 'Completed your first commodity trade',
    icon: '💰',
    threshold: 1
  },
  WEALTHY_TRADER: {
    id: 'wealthy_trader',
    title: 'Wealthy Trader',
    description: 'Accumulated 10,000 credits',
    icon: '💎',
    threshold: 10000
  },
  SPACE_EXPLORER: {
    id: 'space_explorer',
    title: 'Space Explorer',
    description: 'Visited 50 different sectors',
    icon: '🚀',
    threshold: 50
  },
  CARGO_MASTER: {
    id: 'cargo_master',
    title: 'Cargo Master',
    description: 'Upgraded cargo holds to 20+',
    icon: '📦',
    threshold: 20
  },
  MILLIONAIRE: {
    id: 'millionaire',
    title: 'Millionaire',
    description: 'Accumulated 1,000,000 credits',
    icon: '🏆',
    threshold: 1000000
  }
};

export default function AchievementNotification({ player, onAchievementUnlocked }) {
  const [currentAchievement, setCurrentAchievement] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const { playSound } = useAudioManager();

  useEffect(() => {
    if (!player) return;

    // Check for achievements
    const checkAchievements = () => {
      // Credits-based achievements
      if (player.credits >= ACHIEVEMENTS.MILLIONAIRE.threshold && !player.achievements?.includes('millionaire')) {
        showAchievement(ACHIEVEMENTS.MILLIONAIRE);
        onAchievementUnlocked?.('millionaire');
      } else if (player.credits >= ACHIEVEMENTS.WEALTHY_TRADER.threshold && !player.achievements?.includes('wealthy_trader')) {
        showAchievement(ACHIEVEMENTS.WEALTHY_TRADER);
        onAchievementUnlocked?.('wealthy_trader');
      }

      // Cargo-based achievements
      if (player.holds >= ACHIEVEMENTS.CARGO_MASTER.threshold && !player.achievements?.includes('cargo_master')) {
        showAchievement(ACHIEVEMENTS.CARGO_MASTER);
        onAchievementUnlocked?.('cargo_master');
      }
    };

    checkAchievements();
  }, [player, onAchievementUnlocked]);

  const showAchievement = (achievement) => {
    setCurrentAchievement(achievement);
    setIsVisible(true);
    
    // Play achievement sound
    playSound('ACHIEVEMENT');
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setCurrentAchievement(null), 500);
    }, 4000);
  };

  if (!currentAchievement) return null;

  return (
    <div
      className={`fixed top-20 right-4 z-50 transform transition-all duration-500 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="achievement-notification bg-gradient-to-r from-purple-900 via-blue-900 to-purple-900 border-2 border-yellow-400 rounded-lg p-4 shadow-2xl max-w-sm">
        <div className="flex items-center space-x-3">
          <div className="text-4xl animate-bounce">{currentAchievement.icon}</div>
          <div className="flex-1">
            <div className="text-yellow-400 font-bold text-lg sector-font">
              🎉 Achievement Unlocked!
            </div>
            <div className="text-white font-semibold sector-font">
              {currentAchievement.title}
            </div>
            <div className="text-gray-300 text-sm sector-font">
              {currentAchievement.description}
            </div>
          </div>
        </div>
        
        {/* Sparkle effects */}
        <div className="absolute -top-1 -right-1 text-yellow-400 animate-ping">✨</div>
        <div className="absolute -bottom-1 -left-1 text-yellow-400 animate-ping" style={{ animationDelay: '0.5s' }}>✨</div>
      </div>

      <style>{`
        .achievement-notification {
          background: linear-gradient(135deg, #4c1d95 0%, #1e3a8a 50%, #4c1d95 100%);
          box-shadow: 0 0 20px rgba(251, 191, 36, 0.5), 0 0 40px rgba(147, 51, 234, 0.3);
          animation: achievementGlow 2s infinite alternate;
        }
        
        @keyframes achievementGlow {
          from { box-shadow: 0 0 20px rgba(251, 191, 36, 0.5), 0 0 40px rgba(147, 51, 234, 0.3); }
          to { box-shadow: 0 0 30px rgba(251, 191, 36, 0.7), 0 0 60px rgba(147, 51, 234, 0.5); }
        }
        
        .sector-font {
          font-family: 'Orbitron', 'Share Tech Mono', 'Consolas', 'monospace';
          letter-spacing: 0.04em;
        }
      `}</style>
    </div>
  );
}
