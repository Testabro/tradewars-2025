
export default function Header() {
  return (
    <div className="border-2 border-neon-purple px-4 py-3 sm:px-8 sm:py-4 text-center bg-[#181c24] text-neon-cyan font-mono shadow-sm rounded-b-xl mb-2 toned-header-bg fade-in" style={{background: '#181c24'}}>
      <h1 className="text-2xl sm:text-4xl tracking-widest font-bold sector-font text-neon-pink" style={{textShadow: '0 0 6px #ff3cff'}}>TRADE WARS 2025</h1>
      <style>{`
        .border-neon-purple { border-color: #a259ff !important; }
        .text-neon-purple { color: #a259ff !important; }
        .text-neon-pink { color: #ff3cff !important; }
        .text-neon-cyan { color: #00fff7 !important; }
        .toned-header-bg {
          background: #181c24 !important;
          opacity: 1;
        }
        .fade-in {
          animation: fadeInHeader 0.7s;
        }
        @keyframes fadeInHeader {
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

