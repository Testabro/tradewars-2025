import React, { useState, useEffect, useRef } from 'react';
import SectorDisplay from './SectorDisplay.jsx';
import Leaderboard from './Leaderboard.jsx';

// Animation styles for different elements
const animationStyles = `
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0.3; }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
  
  @keyframes twinkle {
    0%, 100% { opacity: 0.3; }
    25% { opacity: 1; }
    75% { opacity: 0.6; }
  }
  
  @keyframes drift {
    0% { transform: translateX(0px); }
    50% { transform: translateX(2px); }
    100% { transform: translateX(0px); }
  }
  
  @keyframes nebula-flow {
    0% { opacity: 0.4; }
    33% { opacity: 0.7; }
    66% { opacity: 0.5; }
    100% { opacity: 0.4; }
  }
  
  @keyframes scanner {
    0% { opacity: 0.3; }
    50% { opacity: 1; }
    100% { opacity: 0.3; }
  }
  
  .blink { animation: blink 2s infinite; }
  .pulse { animation: pulse 3s infinite; }
  .twinkle { animation: twinkle 4s infinite; }
  .drift { animation: drift 6s infinite ease-in-out; }
  .nebula-flow { animation: nebula-flow 5s infinite ease-in-out; }
  .scanner { animation: scanner 2s infinite; }
  
  .twinkle-1 { animation-delay: 0s; }
  .twinkle-2 { animation-delay: 1s; }
  .twinkle-3 { animation-delay: 2s; }
  .twinkle-4 { animation-delay: 3s; }
  
  .drift-1 { animation-delay: 0s; }
  .drift-2 { animation-delay: 2s; }
  .drift-3 { animation-delay: 4s; }
`;

function GameScreen({ sector, children }) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [pulse, setPulse] = useState(false);
  const audioRef = useRef(null);
  const containerRef = useRef(null);

  // Audio-visual feedback on sector change
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
        audioRef.current.volume = 0.15;
        audioRef.current.play().catch(() => {
          // Ignore autoplay errors - audio will work after user interaction
        });
      }
  }, [sector]);

  // Special sector for particles: rareplanet, starport, homeworld
  let specialType = null;
  if (sector) {
    if (sector.port && (sector.port.isStarPort || (sector.port.name && sector.port.name.toLowerCase().includes('starport')))) {
      specialType = 'starport';
    } else if (sector.planet && ['s','x'].includes((sector.planet.classRating || '').toLowerCase())) {
      specialType = 'rareplanet';
    } else if (sector.planet && sector.planet.isHomeworld) {
      specialType = 'homeworld';
    }
  }

  return (
    <div
      ref={containerRef}
      className={`w-full h-full p-4 bg-neon-dark text-neon-green font-mono border-4 border-neon-purple max-w-6xl mx-auto flex-grow flex flex-col shadow-[0_0_32px_#a259ff] relative game-gradient-bg fade-in rounded-2xl${pulse ? ' game-pulse' : ''}`}
      style={{minHeight: '100vh', background: 'linear-gradient(135deg, #12002a 0%, #2a0a4d 40%, #3a1c71 70%, #00fff7 100%)'}}
    >
      {/* Audio handled by useAudioManager hook */}
      {/* Subtle particle effects for special sectors */}
      {specialType && (
        <>
          {/* Sparkle particles */}
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              className="game-particle sparkle"
              style={{
                left: `${120 + Math.sin(i * 1.1) * 80}px`,
                top: `${60 + Math.cos(i * 1.3) * 40}px`,
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
              className="game-particle dust"
              style={{
                left: `${180 + Math.sin(i * 2.2) * 120}px`,
                top: `${120 + Math.cos(i * 2.7) * 60}px`,
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
      {/* Expandable Leaderboard Button */}
      <button
        className="fixed top-6 right-8 z-40 bg-neon-purple hover:bg-neon-pink text-white font-bold py-2 px-4 rounded-lg shadow-lg border-2 border-neon-cyan transition-all duration-200 sector-font"
        style={{textShadow: '0 0 8px #ff3cff, 0 0 2px #fff'}}
        onClick={() => setShowLeaderboard(true)}
        aria-label="Show Leaderboard"
      >
        🏆 Leaderboard
      </button>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <Leaderboard onClose={() => setShowLeaderboard(false)} />
      )}

      {sector && <SectorDisplay sector={sector} />}
      <div className={sector ? "border-t-2 border-neon-cyan pt-2" : ""}>
        {children}
      </div>
      {/* Neon/retro-modern theme CSS and game particles */}
      <style>{`
        .game-pulse {
          animation: gamePulse 0.6s cubic-bezier(.4,1.6,.6,1);
        }
        @keyframes gamePulse {
          0% { box-shadow: 0 0 0 0 #fff6, 0 0 32px 8px #a0f8; }
          60% { box-shadow: 0 0 0 16px #fff2, 0 0 48px 16px #a0f8; }
          100% { box-shadow: 0 0 0 0 #fff0, 0 0 32px 8px #a0f8; }
        }
        .game-particle {
          position: absolute;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          pointer-events: none;
          background: radial-gradient(circle, #fff 60%, #00fff7 100%);
          opacity: 0.32;
          animation: gameParticleFloat 2.2s infinite alternate;
        }
        .game-particle.sparkle {
          background: radial-gradient(circle, #fff 60%, #ff3cff 100%);
          width: 13px;
          height: 13px;
          opacity: 0.38;
          animation: gameSparkleParticle 1.7s infinite alternate;
        }
        .game-particle.dust {
          background: radial-gradient(circle, #fff 40%, #ffe600 100%);
          width: 10px;
          height: 10px;
          opacity: 0.18;
          animation: gameDustParticle 2.8s infinite alternate;
        }
        @keyframes gameParticleFloat {
          from { transform: translateY(0) scale(1); opacity: 0.22; }
          50% { transform: translateY(-8px) scale(1.12); opacity: 0.38; }
          to { transform: translateY(0) scale(1); opacity: 0.22; }
        }
        @keyframes gameSparkleParticle {
          from { transform: scale(0.8) rotate(-10deg); opacity: 0.22; }
          50% { transform: scale(1.2) rotate(10deg); opacity: 0.48; }
          to { transform: scale(0.8) rotate(-10deg); opacity: 0.22; }
        }
        @keyframes gameDustParticle {
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
        .bg-neon-purple { background: #a259ff !important; }
        .bg-neon-pink { background: #ff3cff !important; }
        .border-neon-cyan { border-color: #00fff7 !important; }
        .game-gradient-bg {
          background: linear-gradient(135deg, #12002a 0%, #2a0a4d 40%, #3a1c71 70%, #00fff7 100%);
          opacity: 0.96;
          transition: background 0.8s;
        }
        .fade-in {
          animation: fadeInGame 0.7s;
        }
        @keyframes fadeInGame {
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

export default GameScreen;
