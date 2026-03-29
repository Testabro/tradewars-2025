import React, { useEffect, useRef, useState } from 'react';
import { createParticleEffect, createMatrixRain, createPulsingGlow, createFloatingText } from '../utils/animations.js';

// ASCII art and display info for sector types
const SECTOR_TYPES = {
  EMPTY: {
    name: 'Deep Space',
    imageSrc: '/images/sector_empty.png'
  },
  NEBULA: {
    name: 'Nebula',
    imageSrc: '/images/sector_nebula.png'
  },
  ASTEROID_FIELD: {
    name: 'Asteroid Field',
    imageSrc: '/images/sector_asteroid.png'
  },
  STARPORT: {
    name: 'Orbital Starport',
    imageSrc: '/images/sector_shipyard.png'
  },
  TRADING_POST: {
    name: 'Trading Post',
    imageSrc: '/images/sector_tradingpost.png'
  },
  PLANET: {
    name: 'Planet',
    imageSrc: '' // Set dynamically below based on planet class
  }
};



function SectorDisplay({ sector }) {
  const containerRef = useRef(null);
  const imageFrameRef = useRef(null);
  const [popover, setPopover] = useState(null); // { type: 'planet'|'port', x, y, content }
  const audioRef = useRef(null);
  const [pulse, setPulse] = useState(false);
  const [matrixCleanup, setMatrixCleanup] = useState(null);

  useEffect(() => {
    if (!sector || !containerRef.current) return;

    // Enhanced sector transition effects
    containerRef.current.classList.add('fade-in');
    
    // Determine special type for effects
    let currentSpecialType = null;
    if (sector.port) {
      if (sector.port.isStarPort) {
        currentSpecialType = 'starport';
      } else if (sector.port.isTradingPost) {
        currentSpecialType = 'tradingpost';
      }
    } else if (sector.planet) {
      const classKey = sector.planet.classRating ? sector.planet.classRating.toLowerCase() : 'm';
      if (['s','x'].includes(classKey)) {
        currentSpecialType = 'rareplanet';
      }
    }
    
    // Add particle effects for special sectors
    if (currentSpecialType === 'starport' || currentSpecialType === 'rareplanet') {
      setTimeout(() => {
        if (imageFrameRef.current) {
          createParticleEffect(imageFrameRef.current, {
            count: currentSpecialType === 'rareplanet' ? 25 : 15,
            colors: currentSpecialType === 'rareplanet' 
              ? ['#ff3cff', '#ff00ff', '#ffff00', '#00ffff']
              : ['#00ffff', '#ffffff', '#00ff00'],
            duration: 3000,
            spread: 120
          });
        }
      }, 300);
    }

    // Add matrix rain effect for nebula sectors
    if (sector.type === 'NEBULA' && containerRef.current) {
      const cleanup = createMatrixRain(containerRef.current, {
        characters: '✦✧✩✪✫⋆',
        fontSize: 12,
        color: '#00ffff',
        speed: 80,
        density: 0.015
      });
      setMatrixCleanup(() => cleanup);
    }

    // Add pulsing glow for special sectors
    if (currentSpecialType && imageFrameRef.current) {
      setTimeout(() => {
        if (imageFrameRef.current) {
          const glowColor = currentSpecialType === 'starport' ? '#00ffff' : 
                          currentSpecialType === 'rareplanet' ? '#ff3cff' : '#ffff00';
          createPulsingGlow(imageFrameRef.current, glowColor, 2000);
        }
      }, 500);
    }

    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.classList.remove('fade-in');
      }
    }, 700);
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
    
    setPopover(null); // Close popover on sector change
    
    // Handle audio with user interaction check
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.10; // Softer entry sound
      audioRef.current.play().catch(() => {
        // Ignore autoplay errors - audio will work after user interaction
      });
    }

    // Cleanup matrix rain on sector change
    return () => {
      if (matrixCleanup) {
        matrixCleanup();
        setMatrixCleanup(null);
      }
    };
  }, [sector]);

  // Handle interactive clicks with visual feedback
  const handleImageClick = (e) => {
    if (imageFrameRef.current) {
      createFloatingText(imageFrameRef.current, displayName, {
        color: specialType === 'starport' ? '#00ffff' : 
               specialType === 'rareplanet' ? '#ff3cff' : '#ffffff',
        fontSize: '18px',
        duration: 2500
      });
    }
    setPopover({ type: 'image', x: e.clientX, y: e.clientY, content: displayName });
  };

  const handleBadgeClick = (e, type, content) => {
    e.stopPropagation();
    
    // Create particle effect on badge click
    createParticleEffect(e.target, {
      count: 8,
      colors: type === 'planet' ? ['#39ff14', '#00ffff'] : ['#00ffff', '#ffffff'],
      duration: 1500,
      spread: 60
    });
    
    setPopover({ type, x: e.clientX, y: e.clientY, content });
  };

  if (!sector) return null;

  // Priority: Starport > Trading Post > Planet > Asteroid > Nebula > Empty
  let typeKey = 'EMPTY';
  let imageSrc = null;
  let displayName = '';
  let specialType = null;
  let displayColor = 'text-purple-200';
  let infoColor = '';
  if (sector.port) {
    if (sector.port.isStarPort) {
      typeKey = 'STARPORT';
      specialType = 'starport';
      displayColor = 'text-cyan-300';
    } else if (sector.port.isTradingPost) {
      typeKey = 'TRADING_POST';
      specialType = 'tradingpost';
      displayColor = 'text-yellow-300';
    } else if (sector.port.name && sector.port.name.toLowerCase().includes('starport')) {
      typeKey = 'STARPORT';
      specialType = 'starport';
      displayColor = 'text-cyan-300';
    } else if (sector.port.name && sector.port.name.toLowerCase().includes('trading post')) {
      typeKey = 'TRADING_POST';
      specialType = 'tradingpost';
      displayColor = 'text-yellow-300';
    } else {
      typeKey = 'TRADING_POST';
      specialType = 'tradingpost';
      displayColor = 'text-yellow-300';
    }
    imageSrc = SECTOR_TYPES[typeKey].imageSrc;
    displayName = SECTOR_TYPES[typeKey].name;
    infoColor = 'text-cyan-200';
  } else if (sector.planet) {
    typeKey = 'PLANET';
    const classKey = sector.planet.classRating ? sector.planet.classRating.toLowerCase() : 'm';
    imageSrc = `/images/planets/planet_class_${classKey}.png`;
    displayName = `Class ${sector.planet.classRating} Planet`;
    if (['s','x'].includes(classKey)) {
      specialType = 'rareplanet';
      displayColor = 'text-pink-400';
    } else {
      displayColor = 'text-green-300';
    }
    infoColor = 'text-green-200';
  } else if (sector.type === 'ASTEROID_FIELD') {
    typeKey = 'ASTEROID_FIELD';
    imageSrc = SECTOR_TYPES[typeKey].imageSrc;
    displayName = SECTOR_TYPES[typeKey].name;
    displayColor = 'text-yellow-200';
    infoColor = 'text-yellow-100';
  } else if (sector.type === 'NEBULA') {
    typeKey = 'NEBULA';
    imageSrc = SECTOR_TYPES[typeKey].imageSrc;
    displayName = SECTOR_TYPES[typeKey].name;
    displayColor = 'text-blue-300';
    infoColor = 'text-blue-200';
  } else {
    imageSrc = SECTOR_TYPES.EMPTY.imageSrc;
    displayName = SECTOR_TYPES.EMPTY.name;
    displayColor = 'text-purple-200';
    infoColor = 'text-purple-100';
  }

  return (
    <div
      ref={containerRef}
      className={`relative border-4 border-neon-purple px-3 py-4 sm:px-8 sm:py-8 md:px-14 md:py-10 text-neon-purple font-mono text-xs text-center mb-6 rounded-2xl shadow-2xl overflow-hidden sector-gradient-bg fade-in max-w-2xl mx-auto ${pulse ? 'sector-pulse' : ''}`}
      style={{ minHeight: 280, maxWidth: '98vw', background: 'linear-gradient(135deg, #12002a 0%, #2a0a4d 40%, #3a1c71 70%, #00fff7 100%)' }}
    >
      {/* Audio for sector enter */}
      <audio ref={audioRef} src="/audio/sector-enter.mp3" preload="auto" />
      {/* Animated gradient background */}
      <div className="absolute inset-0 z-0 sector-gradient-bg" aria-hidden="true" style={{background: 'linear-gradient(135deg, #12002a 0%, #2a0a4d 40%, #3a1c71 70%, #00fff7 100%)', opacity: 0.92}}></div>
      {/* Glowing border overlay */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl border-4 border-neon-purple animate-glow z-10" />
      <div className="mb-6 flex justify-center relative z-20">
        <span
          className={`sci-fi-img-frame ${specialType ? `frame-${specialType}` : ''} float-zoom interactive-frame`}
          style={{ display: 'inline-block', borderRadius: '18px', padding: 0, boxShadow: '0 0 32px 8px #a0f8, 0 0 8px 2px #fff2', position: 'relative', cursor: 'pointer', background: 'rgba(20,0,40,0.7)' }}
          tabIndex={0}
          aria-label="Sector image. Click for details."
          ref={imageFrameRef}
          onClick={handleImageClick}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleImageClick({ clientX: 120, clientY: 120 }); }}
        >
          {/* Subtle particle effects for special sectors */}
          {(specialType === 'rareplanet' || specialType === 'starport' || (sector.planet && sector.planet.isHomeworld)) && (
            <>
              {/* Sparkle particles */}
              {[...Array(6)].map((_, i) => (
                <span
                  key={i}
                  className="sector-particle sparkle"
                  style={{
                    left: `${18 + Math.sin(i * 1.1) * 32}px`,
                    top: `${10 + Math.cos(i * 1.3) * 22}px`,
                    opacity: 0.45 + 0.2 * Math.sin(i * 2),
                    filter: 'blur(0.5px)',
                    zIndex: 40,
                  }}
                  aria-hidden="true"
                />
              ))}
              {/* Dust particles */}
              {[...Array(4)].map((_, i) => (
                <span
                  key={i}
                  className="sector-particle dust"
                  style={{
                    left: `${40 + Math.sin(i * 2.2) * 38}px`,
                    top: `${38 + Math.cos(i * 2.7) * 18}px`,
                    opacity: 0.18 + 0.12 * Math.cos(i * 1.7),
                    filter: 'blur(1.2px)',
                    zIndex: 39,
                  }}
                  aria-hidden="true"
                />
              ))}
            </>
          )}
          {/* Feature Icons and Badges */}
          {sector.planet && (
            <span
              className="absolute top-2 left-2 bg-neon-dark rounded-full px-2 py-1 flex items-center gap-1 text-neon-green text-xs font-bold sector-font shadow-md hover:bg-neon-green/80 focus:bg-neon-green/80 transition-colors duration-150 cursor-pointer border border-neon-green"
              style={{zIndex: 30, textShadow: '0 0 8px #0f0, 0 0 2px #fff'}}
              tabIndex={0}
              aria-label={`Planet class ${sector.planet.classRating}. Click for details.`}
              onClick={e => handleBadgeClick(e, 'planet', `Planet Class ${sector.planet.classRating}: ${sector.planet.type || 'Unknown'}${sector.planet.isHomeworld ? ' (Homeworld)' : ''}`)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setPopover({ type: 'planet', x: 120, y: 120, content: `Planet Class ${sector.planet.classRating}: ${sector.planet.type || 'Unknown'}${sector.planet.isHomeworld ? ' (Homeworld)' : ''}` }); }}
            >
              <span role="img" aria-label="Planet" className="mr-1">🪐</span>
              {sector.planet.classRating}
            </span>
          )}
          {sector.port && (
            <span
              className="absolute top-2 right-2 bg-neon-dark rounded-full px-2 py-1 flex items-center gap-1 text-neon-cyan text-xs font-bold sector-font shadow-md hover:bg-neon-cyan/80 focus:bg-neon-cyan/80 transition-colors duration-150 cursor-pointer border border-neon-cyan"
              style={{zIndex: 30, textShadow: '0 0 8px #0ff, 0 0 2px #fff'}}
              tabIndex={0}
              aria-label="Port. Click for details."
              onClick={e => {
                e.stopPropagation();
                setPopover({ type: 'port', x: e.clientX, y: e.clientY, content: `Port: ${sector.port.name || 'Unknown'}` });
              }}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setPopover({ type: 'port', x: 120, y: 120, content: `Port: ${sector.port.name || 'Unknown'}` }); }}
            >
              <span role="img" aria-label="Port" className="mr-1">⚓</span>
              Port
            </span>
          )}
          {/* Rare planet or homeworld badge */}
          {specialType === 'rareplanet' && (
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white px-3 py-1 rounded-full text-xs font-extrabold sector-font shadow-lg animate-pulse border-2 border-neon-pink" style={{zIndex: 30, textShadow: '0 0 12px #ff3cff, 0 0 2px #fff'}}>RARE FIND</span>
          )}
          {sector.planet && sector.planet.isHomeworld && (
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-full text-xs font-extrabold sector-font shadow-lg border-2 border-neon-yellow" style={{zIndex: 30, textShadow: '0 0 8px #ff0, 0 0 2px #fff'}}>HOMEWORLD</span>
          )}
          <img
            src={imageSrc}
            alt={displayName}
            className="fade-in-img responsive-img"
            style={{
              width: 'min(270px, 60vw)',
              maxWidth: '100%',
              height: 'auto',
              objectFit: 'contain',
              background: 'rgba(20,0,40,0.8)',
              borderRadius: '15px',
              border: '2.5px solid #a0f',
              margin: '0 auto',
              boxShadow: '0 6px 32px #a0f8, 0 0 16px #fff4, 0 0 0 8px #222 inset',
              padding: '0.5rem',
            }}
          />
        </span>
      </div>
      <div className={`text-neon-pink text-lg font-bold mb-3 drop-shadow-lg relative z-20 info-animate sector-font`} style={{textShadow: '0 2px 16px #ff3cff, 0 0px 2px #000'}}>{displayName}</div>

      {/* Interactive Popover */}
      {popover && (
        <div
          className="fixed z-50 bg-neon-dark/95 text-neon-cyan px-4 py-2 rounded-xl border-2 border-neon-cyan shadow-2xl sector-font text-sm animate-popover"
          style={{ left: popover.x + 8, top: popover.y + 8, minWidth: 120, maxWidth: 260, textShadow: '0 0 8px #00fff7, 0 0 2px #fff' }}
          tabIndex={0}
          onClick={e => e.stopPropagation()}
          onBlur={() => setPopover(null)}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold">Info</span>
            <button className="ml-2 text-neon-cyan hover:text-white font-bold" onClick={() => setPopover(null)} aria-label="Close info">×</button>
          </div>
          <div>{popover.content}</div>
        </div>
      )}
      {sector.planet && (
        <div className={`text-neon-green text-base font-semibold mb-2 relative z-20 drop-shadow-md info-animate sector-font`} style={{textShadow: '0 1px 8px #0f0, 0 0px 2px #000'}}>Class {sector.planet.classRating} {sector.planet.type} Planet</div>
      )}
      {sector.port && (
        <div className={`text-neon-cyan text-base font-semibold mb-2 relative z-20 drop-shadow-md info-animate sector-font`} style={{textShadow: '0 1px 8px #0ff, 0 0px 2px #000'}}>{sector.port.name}</div>
      )}
  {/* CSS for animation, background, and particles */}
  <style>{`
        .sector-particle {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          pointer-events: none;
          background: radial-gradient(circle, #fff 60%, #00fff7 100%);
          opacity: 0.32;
          animation: particleFloat 2.2s infinite alternate;
        }
        .sector-particle.sparkle {
          background: radial-gradient(circle, #fff 60%, #ff3cff 100%);
          width: 10px;
          height: 10px;
          opacity: 0.38;
          animation: sparkleParticle 1.7s infinite alternate;
        }
        .sector-particle.dust {
          background: radial-gradient(circle, #fff 40%, #ffe600 100%);
          width: 8px;
          height: 8px;
          opacity: 0.18;
          animation: dustParticle 2.8s infinite alternate;
        }
        @keyframes particleFloat {
          from { transform: translateY(0) scale(1); opacity: 0.22; }
          50% { transform: translateY(-8px) scale(1.12); opacity: 0.38; }
          to { transform: translateY(0) scale(1); opacity: 0.22; }
        }
        @keyframes sparkleParticle {
          from { transform: scale(0.8) rotate(-10deg); opacity: 0.22; }
          50% { transform: scale(1.2) rotate(10deg); opacity: 0.48; }
          to { transform: scale(0.8) rotate(-10deg); opacity: 0.22; }
        }
        @keyframes dustParticle {
          from { transform: scale(0.7) translateY(0); opacity: 0.12; }
          50% { transform: scale(1.1) translateY(-6px); opacity: 0.22; }
          to { transform: scale(0.7) translateY(0); opacity: 0.12; }
        }
        .border-neon-purple { border-color: #a259ff !important; }
        .text-neon-purple { color: #a259ff !important; }
        .text-neon-pink { color: #ff3cff !important; }
        .text-neon-cyan { color: #00fff7 !important; }
        .text-neon-green { color: #39ff14 !important; }
        .bg-neon-dark { background: #1a0033 !important; }
        .border-neon-cyan { border-color: #00fff7 !important; }
        .border-neon-pink { border-color: #ff3cff !important; }
        .border-neon-yellow { border-color: #ffe600 !important; }
        .border-neon-green { border-color: #39ff14 !important; }
        .sector-pulse {
          animation: sectorPulse 0.6s cubic-bezier(.4,1.6,.6,1);
        }
        @keyframes sectorPulse {
          0% { box-shadow: 0 0 0 0 #fff6, 0 0 32px 8px #a0f8; }
          60% { box-shadow: 0 0 0 16px #fff2, 0 0 48px 16px #a0f8; }
          100% { box-shadow: 0 0 0 0 #fff0, 0 0 32px 8px #a0f8; }
        }
        .animate-sparkle {
          animation: sparkleTwinkle 1.2s infinite alternate;
        }
        @keyframes sparkleTwinkle {
          from { opacity: 0.7; transform: scale(0.9) rotate(-10deg); }
          50% { opacity: 1; transform: scale(1.1) rotate(10deg); }
          to { opacity: 0.7; transform: scale(0.9) rotate(-10deg); }
        }
        .interactive-frame:hover, .interactive-frame:focus {
          box-shadow: 0 0 48px 16px #ff3cff, 0 0 32px 8px #00fff7, 0 0 0 8px #222 inset;
          border-color: #ff3cff;
          outline: 2px solid #00fff7;
        }
        .animate-popover {
          animation: popoverFadeIn 0.22s cubic-bezier(.4,1.6,.6,1) both;
        }
        @keyframes popoverFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @media (max-width: 640px) {
          .sector-font { font-size: 0.95rem !important; }
          .responsive-img { width: 90vw !important; max-width: 98vw !important; }
          .sci-fi-img-frame { margin-bottom: 1.5rem !important; }
        }
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800&display=swap');
        .sector-font {
          font-family: 'Orbitron', 'Share Tech Mono', 'Consolas', 'monospace';
          letter-spacing: 0.04em;
        }
        .float-zoom {
          animation: floatZoom 4.5s ease-in-out infinite alternate;
        }
        @keyframes floatZoom {
          0% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-10px) scale(1.04); }
          100% { transform: translateY(0px) scale(1); }
        }
        .info-animate {
          animation: infoSlideFade 0.8s cubic-bezier(.4,1.6,.6,1) both;
        }
        @keyframes infoSlideFade {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .sector-gradient-bg {
          background: linear-gradient(135deg, #12002a 0%, #2a0a4d 40%, #3a1c71 70%, #00fff7 100%);
          opacity: 0.92;
          transition: background 0.8s;
        }
        .fade-in {
          animation: fadeInSector 0.7s;
        }
        @keyframes fadeInSector {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .fade-in-img {
          animation: fadeInImg 0.8s;
        }
        @keyframes fadeInImg {
          from { opacity: 0; filter: blur(4px); }
          to { opacity: 1; filter: blur(0); }
        }
        .animate-glow {
          box-shadow: 0 0 32px 8px #a0f8, 0 0 8px 2px #00fff7;
          animation: borderGlow 2.5s infinite alternate;
        }
        @keyframes borderGlow {
          from { box-shadow: 0 0 16px 2px #a0f8, 0 0 8px 2px #00fff7; }
          to { box-shadow: 0 0 32px 12px #a0f8, 0 0 16px 4px #00fff7; }
        }
        .sci-fi-img-frame {
          border-radius: 18px;
          box-shadow: 0 0 32px 8px #a0f8, 0 0 8px 2px #00fff7, 0 0 0 8px #222 inset;
          border: 3.5px solid #a259ff;
          transition: border-color 0.5s, box-shadow 0.5s;
          animation: frameGlow 2.5s infinite alternate;
        }
        @keyframes frameGlow {
          from { box-shadow: 0 0 16px 2px #a0f8, 0 0 8px 2px #00fff7, 0 0 0 8px #222 inset; }
          to { box-shadow: 0 0 32px 12px #a0f8, 0 0 16px 4px #00fff7, 0 0 0 8px #222 inset; }
        }
        .frame-starport {
          border-color: #00fff7;
          box-shadow: 0 0 32px 12px #00fff7cc, 0 0 16px 4px #fff4, 0 0 0 8px #222 inset;
          animation: frameStarportGlow 2.2s infinite alternate;
        }
        @keyframes frameStarportGlow {
          from { box-shadow: 0 0 16px 2px #00fff7cc, 0 0 8px 2px #fff2, 0 0 0 8px #222 inset; }
          to { box-shadow: 0 0 32px 16px #00fff7cc, 0 0 24px 8px #fff4, 0 0 0 8px #222 inset; }
        }
        .frame-tradingpost {
          border-color: #ffe600;
          box-shadow: 0 0 32px 12px #ffe600cc, 0 0 16px 4px #fff4, 0 0 0 8px #222 inset;
          animation: frameTradingGlow 2.2s infinite alternate;
        }
        @keyframes frameTradingGlow {
          from { box-shadow: 0 0 16px 2px #ffe600cc, 0 0 8px 2px #fff2, 0 0 0 8px #222 inset; }
          to { box-shadow: 0 0 32px 16px #ffe600cc, 0 0 24px 8px #fff4, 0 0 0 8px #222 inset; }
        }
        .frame-rareplanet {
          border-color: #ff3cff;
          box-shadow: 0 0 40px 16px #ff3cffcc, 0 0 32px 8px #fff4, 0 0 0 8px #222 inset;
          animation: frameRareGlow 2.2s infinite alternate;
        }
        @keyframes frameRareGlow {
          from { box-shadow: 0 0 24px 4px #ff3cffcc, 0 0 12px 2px #fff2, 0 0 0 8px #222 inset; }
          to { box-shadow: 0 0 48px 24px #ff3cffcc, 0 0 32px 12px #fff4, 0 0 0 8px #222 inset; }
        }
      `}</style>
    </div>
  );
}

export default SectorDisplay;
