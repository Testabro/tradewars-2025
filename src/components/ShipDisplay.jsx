import React, { useState, useEffect, useRef } from 'react';
import { SHIP_TYPES as GAME_SHIP_TYPES } from '../constants/gameConstants.js';

// Ship display configuration with images
const SHIP_DISPLAY_CONFIG = {
  ESCAPE_POD: {
    name: 'Emergency Escape Pod',
    imageSrc: '/images/ship_pod.png',
    baseStats: {
      holds: 1,
      maxFuel: 10,
      maxShields: 0,
      speed: 'Crawling',
      armor: 'Paper-thin'
    }
  },
  SCOUT: {
    name: 'Scout Ship',
    imageSrc: '/images/ship_scout.png',
    baseStats: {
      holds: 15,
      maxFuel: 150,
      maxShields: 25,
      speed: 'Fast',
      armor: 'Light'
    }
  },
  MERCHANT: {
    name: 'Merchant Vessel',
    imageSrc: '/images/ship_merchant.png',
    baseStats: {
      holds: 30,
      maxFuel: 200,
      maxShields: 50,
      speed: 'Medium',
      armor: 'Medium'
    }
  },
  FREIGHTER: {
    name: 'Heavy Freighter',
    imageSrc: '/images/ship_freighter.png',
    baseStats: {
      holds: 60,
      maxFuel: 250,
      maxShields: 75,
      speed: 'Slow',
      armor: 'Heavy'
    }
  },
  CRUISER: {
    name: 'Battle Cruiser',
    imageSrc: '/images/ship_cruiser.png',
    baseStats: {
      holds: 25,
      maxFuel: 300,
      maxShields: 150,
      speed: 'Fast',
      armor: 'Heavy'
    }
  },
  FLAGSHIP: {
    name: 'Corporate Flagship',
    imageSrc: '/images/ship_flagship.png',
    baseStats: {
      holds: 50,
      maxFuel: 400,
      maxShields: 200,
      speed: 'Medium',
      armor: 'Ultra-Heavy'
    }
  }
};

// Ship Upgrade System Display - matches the new game constants
const SHIP_UPGRADE_DISPLAY = {
  CARGO_EXPANSION: {
    name: 'Cargo Bay Systems',
    icon: '📦',
    baseValue: 15, // Base ship cargo
    increment: 5,
    maxUpgrades: 10,
    getLevel: (currentValue, baseValue) => Math.floor((currentValue - baseValue) / 5),
    getLevelName: (level) => {
      const levels = ['Standard', 'Expanded', 'Enhanced', 'Advanced', 'Professional', 'Industrial', 'Commercial', 'Corporate', 'Massive', 'Ultimate', 'Legendary'];
      return levels[Math.min(level, levels.length - 1)];
    }
  },
  SHIELD_UPGRADE: {
    name: 'Shield Generator',
    icon: '🛡️',
    baseValue: 25, // Base ship shields
    increment: 25,
    maxUpgrades: 8,
    getLevel: (currentValue, baseValue) => Math.floor((currentValue - baseValue) / 25),
    getLevelName: (level) => {
      const levels = ['Basic', 'Enhanced', 'Military', 'Advanced', 'Reinforced', 'Battle-Grade', 'Fortress', 'Impenetrable', 'Legendary'];
      return levels[Math.min(level, levels.length - 1)];
    }
  },
  FUEL_TANK_UPGRADE: {
    name: 'Fuel Systems',
    icon: '⛽',
    baseValue: 150, // Base ship fuel
    increment: 50,
    maxUpgrades: 6,
    getLevel: (currentValue, baseValue) => Math.floor((currentValue - baseValue) / 50),
    getLevelName: (level) => {
      const levels = ['Standard', 'Extended', 'Long-Range', 'Deep-Space', 'Explorer', 'Expedition', 'Legendary'];
      return levels[Math.min(level, levels.length - 1)];
    }
  },
  ARMOR_PLATING: {
    name: 'Hull Armor',
    icon: '🔧',
    baseValue: 100, // Base hull is always 100%
    increment: 10,
    maxUpgrades: 5,
    getLevel: (currentValue, baseValue) => Math.floor(((currentValue || 100) - baseValue) / 10),
    getLevelName: (level) => {
      const levels = ['Standard', 'Reinforced', 'Armored', 'Battle-Hardened', 'Fortress', 'Legendary'];
      return levels[Math.min(level, levels.length - 1)];
    }
  },
  WEAPON_SYSTEMS: {
    name: 'Weapon Systems',
    icon: '⚔️',
    baseValue: 15, // Base weapon damage - all ships start with basic weapons
    increment: 5,
    maxUpgrades: 4,
    getLevel: (currentValue, baseValue) => Math.floor(((currentValue || baseValue) - baseValue) / 5),
    getLevelName: (level) => {
      const levels = ['Basic', 'Enhanced', 'Advanced', 'Heavy', 'Devastating', 'Legendary'];
      return levels[Math.min(level, levels.length - 1)];
    }
  }
};

// Captain rank system
const CAPTAIN_RANKS = {
  0: { title: 'Cadet', insignia: '○' },
  1000: { title: 'Ensign', insignia: '◐' },
  5000: { title: 'Lieutenant', insignia: '◑' },
  15000: { title: 'Commander', insignia: '◒' },
  50000: { title: 'Captain', insignia: '●' },
  100000: { title: 'Admiral', insignia: '◆' },
  500000: { title: 'Fleet Admiral', insignia: '◈' },
  1000000: { title: 'Grand Admiral', insignia: '★' }
};

function getRankInfo(netWorth) {
  const ranks = Object.entries(CAPTAIN_RANKS)
    .map(([threshold, info]) => ({ threshold: parseInt(threshold), ...info }))
    .sort((a, b) => b.threshold - a.threshold);
  
  return ranks.find(rank => netWorth >= rank.threshold) || CAPTAIN_RANKS[0];
}

function getShipType(player) {
  // Check if hull is destroyed or escape pod is activated - emergency escape pod!
  if ((player.hull || 100) <= 2 || player.shipType === 'ESCAPE_POD' || player.escapePodActivated) {
    return 'ESCAPE_POD';
  }
  
  // Use the actual ship type if it's set (from ship purchases)
  if (player.shipType && GAME_SHIP_TYPES[player.shipType]) {
    return player.shipType;
  }
  
  // Fallback: Determine ship type based on player's upgrades and stats (for legacy players)
  if (player.holds >= 50) return 'FREIGHTER';
  if (player.maxShields >= 100) return 'CRUISER';
  if (player.holds >= 25) return 'MERCHANT';
  if (player.holds >= 40 && player.maxShields >= 150) return 'FLAGSHIP';
  return 'SCOUT';
}

export default function ShipDisplay({ player }) {
  if (!player) return null;

  const [showUpgrades, setShowUpgrades] = useState(false);
  const [pulse, setPulse] = useState(false);
  const audioRef = useRef(null);
  const containerRef = useRef(null);
  const shipType = getShipType(player);
  const ship = SHIP_DISPLAY_CONFIG[shipType];
  const netWorth = player.credits + Object.values(player.cargo || {}).reduce((sum, qty) => sum + qty * 100, 0);
  const rankInfo = getRankInfo(netWorth);

  // Audio-visual feedback on ship change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.classList.add('fade-in');
      setTimeout(() => {
        containerRef.current.classList.remove('fade-in');
      }, 700);
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    }
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 0.3;
        audioRef.current.play().catch(() => {
          // Ignore autoplay errors - audio will work after user interaction
        });
      }
  }, [shipType, player.name]);

  // Special ship types for particles: flagship, escape pod, high rank
  const isSpecial = shipType === 'FLAGSHIP' || shipType === 'ESCAPE_POD' || netWorth >= 1000000;

  return (
    <div
      ref={containerRef}
      className={
        `relative border-4 border-neon-purple px-3 py-4 sm:px-8 sm:py-8 md:px-14 md:py-10 text-neon-cyan font-mono text-xs text-center mb-6 rounded-2xl shadow-2xl overflow-hidden ship-gradient-bg fade-in max-w-2xl mx-auto${pulse ? ' ship-pulse' : ''}`
      }
      style={{ minHeight: 220, maxWidth: '98vw', background: 'linear-gradient(135deg, #12002a 0%, #2a0a4d 40%, #3a1c71 70%, #00fff7 100%)' }}
    >
      {/* Audio for ship change */}
      <audio ref={audioRef} src="/audio/ship-change.mp3" preload="auto" />
      {/* Captain Name Display */}
      <div className="mb-3 text-center border-2 border-neon-yellow p-2 bg-neon-dark rounded-lg shadow-lg">
        <div className="text-neon-yellow text-base font-bold sector-font" style={{textShadow: '0 0 8px #ffe600, 0 0 2px #fff'}}>
          {rankInfo.insignia} {rankInfo.title.toUpperCase()} {rankInfo.insignia}
        </div>
        <div className="text-neon-pink text-lg font-bold sector-font" style={{textShadow: '0 0 12px #ff3cff, 0 0 2px #fff'}}>
          {player.name.toUpperCase()}
        </div>
        <div className="text-neon-yellow text-base font-semibold sector-font" style={{textShadow: '0 0 8px #ffe600, 0 0 2px #fff'}}>
          NET WORTH: ${netWorth.toLocaleString()}
        </div>
      </div>
      {/* Ship Image with subtle particles for special ships */}
      <div className="mb-3 text-center relative">
        {isSpecial && (
          <>
            {/* Sparkle particles */}
            {[...Array(6)].map((_, i) => (
              <span
                key={i}
                className="ship-particle sparkle"
                style={{
                  left: `${60 + Math.sin(i * 1.1) * 48}px`,
                  top: `${30 + Math.cos(i * 1.3) * 22}px`,
                  opacity: 0.38 + 0.2 * Math.sin(i * 2),
                  filter: 'blur(0.5px)',
                  zIndex: 40,
                  position: 'absolute',
                }}
                aria-hidden="true"
              />
            ))}
            {/* Dust particles */}
            {[...Array(4)].map((_, i) => (
              <span
                key={i}
                className="ship-particle dust"
                style={{
                  left: `${90 + Math.sin(i * 2.2) * 38}px`,
                  top: `${58 + Math.cos(i * 2.7) * 18}px`,
                  opacity: 0.18 + 0.12 * Math.cos(i * 1.7),
                  filter: 'blur(1.2px)',
                  zIndex: 39,
                  position: 'absolute',
                }}
                aria-hidden="true"
              />
            ))}
          </>
        )}
        <img
          src={ship.imageSrc}
          alt={ship.name}
          style={{ width: '170px', height: 'auto', objectFit: 'contain', background: 'rgba(20,0,40,0.8)', borderRadius: '15px', border: '2.5px solid #00fff7', margin: '0 auto', boxShadow: '0 6px 32px #00fff7, 0 0 16px #fff4, 0 0 0 8px #222 inset', padding: '0.5rem' }}
        />
      </div>
      {/* Ship Stats */}
      <div className="border-t-2 border-neon-cyan pt-2">
        <h4 className="text-neon-purple text-base font-bold mb-2 sector-font" style={{textShadow: '0 2px 8px #a259ff, 0 0px 2px #000'}}>SHIP STATUS</h4>
        <div className="grid grid-cols-2 gap-2 text-base sector-font">
          <div className="text-neon-green">Hull: {Math.floor((player.hull || 100) / 100 * 100)}%</div>
          <div className="text-neon-cyan">Shields: {player.shields || 0}/{player.maxShields || 0}</div>
          <div className="text-neon-yellow">Fuel: {player.fuel}/{player.maxFuel}</div>
          <div className="text-neon-pink">Cargo: {Object.values(player.cargo || {}).reduce((a, b) => a + b, 0)}/{player.holds}</div>
        </div>
      </div>
      {/* Upgrade Status */}
      <div className="border-t-2 border-neon-cyan pt-2 mt-2">
        <button
          className="w-full text-left text-neon-cyan text-base font-bold mb-2 focus:outline-none focus:ring-2 focus:ring-neon-cyan bg-neon-dark hover:bg-neon-cyan/10 rounded transition-colors px-2 py-1 sector-font border border-neon-cyan shadow-md"
          onClick={() => setShowUpgrades((v) => !v)}
          aria-expanded={showUpgrades}
          style={{textShadow: '0 0 8px #00fff7, 0 0 2px #fff'}}
        >
          {showUpgrades ? '▼' : '►'} UPGRADES
        </button>
        {showUpgrades && (
          <div className="space-y-3 mt-3">
            {Object.entries(SHIP_UPGRADE_DISPLAY).map(([upgradeKey, upgrade]) => {
              // Get current player values for this upgrade type
              let currentValue = 0;
              switch (upgradeKey) {
                case 'CARGO_EXPANSION':
                  currentValue = player.holds || upgrade.baseValue;
                  break;
                case 'SHIELD_UPGRADE':
                  currentValue = player.maxShields || upgrade.baseValue;
                  break;
                case 'FUEL_TANK_UPGRADE':
                  currentValue = player.maxFuel || upgrade.baseValue;
                  break;
                case 'ARMOR_PLATING':
                  currentValue = player.maxHull || upgrade.baseValue;
                  break;
                case 'WEAPON_SYSTEMS':
                  currentValue = player.weaponDamage || upgrade.baseValue;
                  break;
              }

              const level = upgrade.getLevel(currentValue, upgrade.baseValue);
              const levelName = upgrade.getLevelName(level);
              const upgradesRemaining = upgrade.maxUpgrades - level;
              const isMaxed = level >= upgrade.maxUpgrades;

              return (
                <div key={upgradeKey} className="bg-neon-dark/50 border border-neon-purple/30 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{upgrade.icon}</span>
                      <span className="text-neon-purple font-semibold text-sm">{upgrade.name}</span>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${isMaxed ? 'text-neon-yellow' : 'text-neon-cyan'}`}>
                        {levelName}
                      </div>
                      <div className="text-xs text-gray-400">
                        Level {level}/{upgrade.maxUpgrades}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isMaxed ? 'bg-neon-yellow' : 'bg-neon-cyan'
                      }`}
                      style={{ width: `${Math.min(100, (level / upgrade.maxUpgrades) * 100)}%` }}
                    ></div>
                  </div>
                  
                  {/* Current Stats */}
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">
                      Current: {currentValue}
                      {upgradeKey === 'ARMOR_PLATING' && '%'}
                      {upgradeKey === 'WEAPON_SYSTEMS' && ' dmg'}
                    </span>
                    {!isMaxed && (
                      <span className="text-neon-green">
                        Next: +{upgrade.increment}
                        {upgradeKey === 'ARMOR_PLATING' && '%'}
                        {upgradeKey === 'WEAPON_SYSTEMS' && ' dmg'}
                      </span>
                    )}
                    {isMaxed && (
                      <span className="text-neon-yellow font-bold">
                        MAXED OUT
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Upgrade Instructions */}
            <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
              <div className="text-xs text-blue-200 text-center">
                <div className="font-semibold mb-1">🚀 UPGRADE YOUR SHIP</div>
                <div>Visit a Shipyard to purchase permanent upgrades</div>
                <div className="text-blue-300 mt-1">Each upgrade improves your ship's capabilities</div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Neon/retro-modern theme CSS and ship particles */}
      <style>{`
        .ship-pulse {
          animation: shipPulse 0.6s cubic-bezier(.4,1.6,.6,1);
        }
        @keyframes shipPulse {
          0% { box-shadow: 0 0 0 0 #fff6, 0 0 32px 8px #00fff7; }
          60% { box-shadow: 0 0 0 16px #fff2, 0 0 48px 16px #00fff7; }
          100% { box-shadow: 0 0 0 0 #fff0, 0 0 32px 8px #00fff7; }
        }
        .ship-particle {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          pointer-events: none;
          background: radial-gradient(circle, #fff 60%, #00fff7 100%);
          opacity: 0.32;
          animation: shipParticleFloat 2.2s infinite alternate;
        }
        .ship-particle.sparkle {
          background: radial-gradient(circle, #fff 60%, #ff3cff 100%);
          width: 10px;
          height: 10px;
          opacity: 0.38;
          animation: shipSparkleParticle 1.7s infinite alternate;
        }
        .ship-particle.dust {
          background: radial-gradient(circle, #fff 40%, #ffe600 100%);
          width: 8px;
          height: 8px;
          opacity: 0.18;
          animation: shipDustParticle 2.8s infinite alternate;
        }
        @keyframes shipParticleFloat {
          from { transform: translateY(0) scale(1); opacity: 0.22; }
          50% { transform: translateY(-8px) scale(1.12); opacity: 0.38; }
          to { transform: translateY(0) scale(1); opacity: 0.22; }
        }
        @keyframes shipSparkleParticle {
          from { transform: scale(0.8) rotate(-10deg); opacity: 0.22; }
          50% { transform: scale(1.2) rotate(10deg); opacity: 0.48; }
          to { transform: scale(0.8) rotate(-10deg); opacity: 0.22; }
        }
        @keyframes shipDustParticle {
          from { transform: scale(0.7) translateY(0); opacity: 0.12; }
          50% { transform: scale(1.1) translateY(-6px); opacity: 0.22; }
          to { transform: scale(0.7) translateY(0); opacity: 0.12; }
        }
        .border-neon-purple { border-color: #a259ff !important; }
        .text-neon-purple { color: #a259ff !important; }
        .text-neon-pink { color: #ff3cff !important; }
        .text-neon-cyan { color: #00fff7 !important; }
        .text-neon-green { color: #39ff14 !important; }
        .text-neon-yellow { color: #ffe600 !important; }
        .bg-neon-dark { background: #1a0033 !important; }
        .border-neon-cyan { border-color: #00fff7 !important; }
        .border-neon-yellow { border-color: #ffe600 !important; }
        .ship-gradient-bg {
          background: linear-gradient(135deg, #12002a 0%, #2a0a4d 40%, #3a1c71 70%, #00fff7 100%);
          opacity: 0.92;
          transition: background 0.8s;
        }
        .fade-in {
          animation: fadeInShip 0.7s;
        }
        @keyframes fadeInShip {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800&display=swap');
        .sector-font {
          font-family: 'Orbitron', 'Share Tech Mono', 'Consolas', 'monospace';
          letter-spacing: 0.04em;
        }
      `}</style>
    </div>
  );
}
