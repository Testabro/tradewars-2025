
import React, { useState, useEffect } from 'react';

export default function CountdownTimer({ endDate }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!endDate) return;

    const intervalId = setInterval(() => {
      const now = new Date();
      const end = endDate.toDate ? endDate.toDate() : new Date(endDate);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Season Concluded");
        clearInterval(intervalId);
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [endDate]);

  return (
    <div
      className="text-center px-2 py-2 border-t-2 border-b-2 border-neon-yellow bg-[#181c24] text-neon-yellow font-medium sector-font shadow-sm toned-timer"
      style={{
        fontFamily: 'Orbitron, Share Tech Mono, Consolas, monospace',
        letterSpacing: '0.04em',
        textShadow: '0 0 2px #ffe600',
        boxShadow: '0 0 4px 1px #ffe60033',
      }}
      tabIndex={0}
      aria-label="Countdown timer"
    >
      <span className="text-neon-cyan mr-2">TIME REMAINING:</span> {timeLeft}
      <style>{`
        .border-neon-yellow { border-color: #ffe600 !important; }
        .text-neon-yellow { color: #ffe600 !important; }
        .text-neon-cyan { color: #00fff7 !important; }
        .toned-timer {
          background: #181c24 !important;
          box-shadow: 0 0 4px 1px #ffe60033;
        }
        .sector-font {
          font-family: 'Orbitron', 'Share Tech Mono', 'Consolas', 'monospace';
          letter-spacing: 0.04em;
        }
        @media (max-width: 640px) {
          .sector-font { font-size: 0.95rem !important; }
        }
      `}</style>
    </div>
  );
}

