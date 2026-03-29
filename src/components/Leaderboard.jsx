import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { FIREBASE_PATHS } from '../constants/gameConstants.js';

export default function Leaderboard({ onClose }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const db = getFirestore();
        const playersQuery = query(
          collection(db, FIREBASE_PATHS.PLAYERS),
          orderBy('credits', 'desc'),
          limit(10)
        );
        
        const snapshot = await getDocs(playersQuery);
        const leaderboardData = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || 'Unknown Captain',
          score: doc.data().credits || 0,
          currentSector: doc.data().currentSector || 1
        }));
        
        setLeaders(leaderboardData);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        // Fallback to empty array if there's an error
        setLeaders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 flex items-center justify-center z-50 neon-leaderboard-modal">
      <div
        className="relative border-4 border-neon-purple rounded-2xl shadow-2xl p-7 w-full max-w-md neon-leaderboard-bg sector-font"
        style={{
          background: 'linear-gradient(135deg, #12002a 0%, #2a0a4d 40%, #3a1c71 70%, #00fff7 100%)',
          boxShadow: '0 0 32px 8px #a0f8, 0 0 8px 2px #fff2',
          fontFamily: 'Orbitron, Share Tech Mono, Consolas, monospace',
          letterSpacing: '0.04em',
        }}
        tabIndex={0}
        aria-label="Leaderboard modal"
      >
        <button
          className="absolute top-2 right-3 text-neon-pink hover:text-white text-3xl font-extrabold drop-shadow-lg focus:outline-none focus:ring-2 focus:ring-neon-cyan transition-colors duration-150"
          onClick={onClose}
          aria-label="Close Leaderboard"
          style={{textShadow: '0 0 12px #ff3cff, 0 0 2px #fff'}}
        >
          ×
        </button>
        <h2 className="text-2xl font-extrabold text-neon-cyan mb-5 text-center drop-shadow-lg sector-font" style={{textShadow: '0 2px 16px #00fff7, 0 0px 2px #000'}}>Season Leaderboard</h2>
        {loading ? (
          <div className="text-center text-neon-purple animate-pulse sector-font">Loading...</div>
        ) : leaders.length === 0 ? (
          <div className="text-center text-neon-purple sector-font">No players found. Start playing to appear on the leaderboard!</div>
        ) : (
          <ol className="text-lg space-y-3">
            {leaders.map((player, idx) => (
              <li
                key={player.id}
                className={`flex justify-between items-center border-b border-neon-purple pb-2 px-1 ${idx === 0 ? 'bg-gradient-to-r from-neon-cyan/30 to-neon-pink/20 rounded-lg shadow-lg' : ''}`}
                style={idx === 0 ? {boxShadow: '0 0 24px 4px #00fff7cc, 0 0 8px 2px #ff3cffcc'} : {}}
              >
                <span className={`font-bold sector-font ${idx === 0 ? 'text-neon-cyan text-xl' : 'text-neon-purple'}`}>{idx + 1}. {player.name}</span>
                <span className={`font-mono font-bold ${idx === 0 ? 'text-neon-green text-lg' : 'text-neon-cyan'}`}>${player.score.toLocaleString()}</span>
                {idx === 0 && (
                  <span className="ml-2 px-2 py-1 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white rounded-full text-xs font-extrabold shadow-md border-2 border-neon-pink animate-pulse" style={{textShadow: '0 0 8px #ff3cff, 0 0 2px #fff'}}>TOP</span>
                )}
              </li>
            ))}
          </ol>
        )}
        <style>{`
          .border-neon-purple { border-color: #a259ff !important; }
          .text-neon-purple { color: #a259ff !important; }
          .text-neon-pink { color: #ff3cff !important; }
          .text-neon-cyan { color: #00fff7 !important; }
          .text-neon-green { color: #39ff14 !important; }
          .border-neon-pink { border-color: #ff3cff !important; }
          .neon-leaderboard-bg {
            background: linear-gradient(135deg, #12002a 0%, #2a0a4d 40%, #3a1c71 70%, #00fff7 100%);
            box-shadow: 0 0 32px 8px #a0f8, 0 0 8px 2px #fff2;
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
    </div>
  );
}
