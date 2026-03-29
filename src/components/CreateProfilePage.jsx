import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Add initial fuel constants
const INITIAL_FUEL = 100;
const INITIAL_MAX_FUEL = 100;

export default function CreateProfilePage({ user, PLAYERS_PATH, INITIAL_CREDITS, INITIAL_HOLDS, INITIAL_SHIP_HEALTH, COMMODITIES }) {
  const [captainName, setCaptainName] = useState('');
  const [error, setError] = useState('');

  const db = getFirestore();

  const handleProfileCreation = async (e) => {
    e.preventDefault();
    console.log("handleProfileCreation function started.");

    if (!captainName) {
      setError("Please provide a captain name.");
      return;
    }
    setError('');

    console.log("Captain Name entered:", captainName);
    console.log("User object received:", user);
    console.log("Attempting to write to path:", PLAYERS_PATH);

    try {
      // Create the player document in Firestore, now with fuel properties.
      const newPlayer = { 
        uid: user.uid, 
        name: captainName, 
        credits: INITIAL_CREDITS, 
        holds: INITIAL_HOLDS, 
        shipHealth: INITIAL_SHIP_HEALTH, 
        shields: 0, 
        maxShields: 0, 
        fuel: INITIAL_FUEL,           // ADDED
        maxFuel: INITIAL_MAX_FUEL,    // ADDED
        lastFuelRecharge: new Date().toISOString(), // ADDED: Track recharge time
        status: 'Normal', 
        bounty: 0, 
        lastCombatTimestamp: null, 
        currentSector: 1, 
        cargo: COMMODITIES.reduce((acc, comm) => ({ ...acc, [comm.name]: 0 }), {}) 
      };

      console.log("New player object created:", newPlayer);

      await setDoc(doc(db, PLAYERS_PATH, user.uid), newPlayer);
      
      console.log("SUCCESS: Player profile created in Firestore.");

    } catch (err) {
      console.error("ERROR during profile creation:", err);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center sector-font neon-profile-bg p-4">
      <div
        className="w-full max-w-md border-4 border-neon-cyan rounded-2xl shadow-2xl p-8 neon-profile-card"
        style={{
          background: 'linear-gradient(135deg, #12002a 0%, #2a0a4d 40%, #00fff7 100%)',
          boxShadow: '0 0 32px 8px #00fff7cc, 0 0 8px 2px #fff2',
          fontFamily: 'Orbitron, Share Tech Mono, Consolas, monospace',
          letterSpacing: '0.04em',
        }}
        tabIndex={0}
        aria-label="Create profile page"
      >
        <h2 className="text-2xl text-neon-cyan text-center tracking-widest mb-2 drop-shadow-lg" style={{textShadow: '0 0 12px #00fff7, 0 0 2px #fff'}}>WELCOME, CAPTAIN!</h2>
        <p className="text-center text-neon-green mb-6">One final step: choose your name.</p>
        <form onSubmit={handleProfileCreation}>
          <div className="mb-4">
            <label className="block text-neon-cyan mb-1" htmlFor="captainName">Captain Name</label>
            <input
              type="text"
              id="captainName"
              value={captainName}
              onChange={(e) => setCaptainName(e.target.value)}
              className="w-full bg-[#1a0033] text-neon-green border border-neon-green p-2 rounded-lg focus:outline-none focus:border-neon-cyan shadow-inner"
              required
              style={{boxShadow: '0 0 8px 2px #39ff14cc'}}
            />
          </div>
          {error && <p className="text-neon-pink text-sm mb-4 drop-shadow-md">{error}</p>}
          <button
            type="submit"
            className="w-full bg-neon-green text-black font-bold p-3 rounded-lg hover:bg-neon-cyan hover:text-black tracking-wider shadow-md transition-colors duration-150 border-2 border-neon-green focus:border-neon-cyan"
            style={{boxShadow: '0 0 16px 2px #39ff14cc'}}
          >
            CREATE PROFILE & ENTER GAME
          </button>
        </form>
        <style>{`
          .border-neon-cyan { border-color: #00fff7 !important; }
          .border-neon-green { border-color: #39ff14 !important; }
          .bg-neon-green { background: #39ff14 !important; }
          .text-neon-cyan { color: #00fff7 !important; }
          .text-neon-green { color: #39ff14 !important; }
          .text-neon-pink { color: #ff3cff !important; }
          .neon-profile-bg {
            background: linear-gradient(135deg, #12002a 0%, #2a0a4d 40%, #00fff7 100%);
          }
          .neon-profile-card {
            background: linear-gradient(135deg, #12002a 0%, #2a0a4d 40%, #00fff7 100%);
            box-shadow: 0 0 32px 8px #00fff7cc, 0 0 8px 2px #fff2;
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

