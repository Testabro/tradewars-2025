
export default function StatusBar({ player }) {
  if (!player) return null;

  const fuelPercentage = player.maxFuel > 0 ? (player.fuel / player.maxFuel) * 100 : 0;
  const hullPercentage = (player.hull || 100);
  const cargoUsed = Object.values(player.cargo || {}).reduce((a, b) => a + b, 0);
  const cargoPercentage = player.holds > 0 ? (cargoUsed / player.holds) * 100 : 0;
  
  // Status indicators
  const isLowFuel = fuelPercentage < 20;
  const isLowHull = hullPercentage < 30;
  const isCargoFull = cargoPercentage >= 100;

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-7 gap-4 lg:gap-6 border-b-2 border-neon-green pb-4 mb-6 text-sm rounded-xl shadow-lg toned-statusbar sector-font p-4"
      style={{
        background: 'linear-gradient(90deg, #181c24 0%, #232a36 100%)',
        boxShadow: '0 0 8px 2px #39ff1444, inset 0 1px 0 rgba(255,255,255,0.1)',
        fontFamily: 'Orbitron, Share Tech Mono, Consolas, monospace',
        letterSpacing: '0.04em',
      }}
      tabIndex={0}
      aria-label="Player status bar"
    >
      <div className="flex flex-col space-y-1">
        <div className="text-neon-cyan text-xs uppercase tracking-wider opacity-75">Sector</div>
        <div className="text-neon-green font-bold text-lg">{player.currentSector}</div>
      </div>
      
      <div className="flex flex-col space-y-1">
        <div className="text-neon-cyan text-xs uppercase tracking-wider opacity-75">Credits</div>
        <div className="text-neon-green font-mono font-bold text-lg">${player.credits.toLocaleString()}</div>
      </div>
      
      <div className="flex flex-col space-y-1">
        <div className="text-neon-cyan text-xs uppercase tracking-wider opacity-75">Cargo</div>
        <div className={`font-bold text-lg flex items-center ${isCargoFull ? 'text-neon-pink animate-pulse' : 'text-neon-green'}`}>
          {cargoUsed}/{player.holds}
          {isCargoFull && <span className="ml-2 text-sm">⚠️</span>}
        </div>
      </div>
      
      <div className="flex flex-col space-y-1">
        <div className="text-neon-cyan text-xs uppercase tracking-wider opacity-75">Hull</div>
        <div className={`font-bold text-lg flex items-center ${isLowHull ? 'text-red-400 animate-pulse' : 'text-neon-pink'}`}>
          {hullPercentage}%
          {isLowHull && <span className="ml-2 text-sm">🚨</span>}
        </div>
      </div>
      
      <div className="flex flex-col space-y-1">
        <div className="text-neon-cyan text-xs uppercase tracking-wider opacity-75">Shields</div>
        <div className="text-neon-cyan font-bold text-lg">{player.shields || 0}/{player.maxShields || 0}</div>
      </div>
      <div className="col-span-2 sm:col-span-1 flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-neon-cyan text-xs uppercase tracking-wider opacity-75">Fuel</div>
          {isLowFuel && <span className="text-sm animate-pulse">⛽</span>}
        </div>
        <div className={`font-bold text-lg ${isLowFuel ? 'text-red-400 animate-pulse' : 'text-neon-yellow'}`}>
          {player.fuel || 0}/{player.maxFuel || 0}
        </div>
        <div className="w-full bg-[#1a0033] h-2 rounded-full border border-neon-yellow overflow-hidden shadow-inner">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${isLowFuel ? 'bg-gradient-to-r from-red-500 to-orange-500 animate-pulse' : 'bg-gradient-to-r from-yellow-400 via-orange-400 to-neon-green animate-fuelbar-glow'}`}
            style={{ width: `${fuelPercentage}%`, boxShadow: isLowFuel ? '0 0 6px 1px #ff000066' : '0 0 6px 1px #ffe60066' }}
          ></div>
        </div>
      </div>
      {player.status === 'Pirate' && <div className="text-neon-pink font-bold animate-pulse">Status: PIRATE</div>}
      <style>{`
        .border-neon-green { border-color: #39ff14 !important; }
        .text-neon-green { color: #39ff14 !important; }
        .text-neon-cyan { color: #00fff7 !important; }
        .text-neon-pink { color: #ff3cff !important; }
        .text-neon-yellow { color: #ffe600 !important; }
        .border-neon-yellow { border-color: #ffe600 !important; }
        .toned-statusbar {
          background: linear-gradient(90deg, #181c24 0%, #232a36 100%);
          box-shadow: 0 0 6px 1px #39ff1433;
        }
        .sector-font {
          font-family: 'Orbitron', 'Share Tech Mono', 'Consolas', 'monospace';
          letter-spacing: 0.04em;
        }
        .animate-fuelbar-glow {
          animation: fuelBarGlow 2.2s infinite alternate;
        }
        @keyframes fuelBarGlow {
          from { box-shadow: 0 0 4px 1px #ffe60066; }
          to { box-shadow: 0 0 8px 2px #ffe60066, 0 0 4px 1px #39ff1444; }
        }
        @media (max-width: 640px) {
          .sector-font { font-size: 0.95rem !important; }
        }
      `}</style>
    </div>
  );
}
