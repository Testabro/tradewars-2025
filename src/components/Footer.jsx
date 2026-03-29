

export default function Footer({ userId }) {
  return (
    <footer
      className="relative border-t-2 border-neon-cyan px-3 py-2 mt-8 bg-[#181c24] text-neon-cyan text-xs text-center rounded-b-xl shadow-sm overflow-hidden toned-footer sector-font"
      style={{
        boxShadow: '0 0 4px 1px #00fff733',
        fontFamily: 'Orbitron, Share Tech Mono, Consolas, monospace',
        letterSpacing: '0.04em',
        zIndex: 30,
      }}
      tabIndex={0}
      aria-label="Footer with user ID and game info"
    >
      <div className="flex flex-col items-center gap-1">
        {userId && (
          <p className="text-neon-green text-xs font-medium tracking-wider" style={{textShadow: '0 0 2px #39ff14'}}>
            USER ID: <span className="font-mono">{userId}</span>
          </p>
        )}
        <p className="text-neon-cyan text-xs font-normal tracking-wide" style={{textShadow: '0 0 2px #00fff7'}}>A multiplayer trading simulation.</p>
      </div>
      <style>{`
        .border-neon-cyan { border-color: #00fff7 !important; }
        .text-neon-cyan { color: #00fff7 !important; }
        .text-neon-green { color: #39ff14 !important; }
        .toned-footer {
          background: #181c24 !important;
          border-top: 2px solid #00fff7;
          box-shadow: 0 0 4px 1px #00fff733;
        }
        .sector-font {
          font-family: 'Orbitron', 'Share Tech Mono', 'Consolas', 'monospace';
          letter-spacing: 0.04em;
        }
        @media (max-width: 640px) {
          .sector-font { font-size: 0.95rem !important; }
        }
      `}</style>
    </footer>
  );
}

