import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { FIREBASE_PATHS } from '../constants/gameConstants.js';
import Button from './Button.jsx';

export default function AdminPanel({ onSetEndDate, onResetUniverse, onGenerateUniverse }) {
  const [days, setDays] = useState(30);
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Galaxy Generation Settings
  const [galaxySettings, setGalaxySettings] = useState({
    sectorCount: 100,
    shipyardPercent: 3,
    tradingPostPercent: 15, // Increased from 12% to compensate for removing stations
    planetPercent: 6,
    nebulaPercent: 30,
    asteroidPercent: 15
  });

  const db = getFirestore();

  // Load all players
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const playersQuery = query(collection(db, FIREBASE_PATHS.PLAYERS), orderBy('name'));
        const snapshot = await getDocs(playersQuery);
        const playersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPlayers(playersList);
      } catch (error) {
        console.error('Error loading players:', error);
      }
    };

    loadPlayers();
  }, [db]);

  const handlePlayerSelect = (player) => {
    setSelectedPlayer(player);
    setEditValues({
      credits: player.credits || 0,
      fuel: player.fuel || 0,
      maxFuel: player.maxFuel || 100,
      hull: player.hull || 100,
      holds: player.holds || 10,
      shields: player.shields || 0,
      maxShields: player.maxShields || 0,
      currentSector: player.currentSector || 1,
      status: player.status || 'Trader'
    });
    setEditMode(false);
  };

  const handleSaveChanges = async () => {
    if (!selectedPlayer) return;

    setLoading(true);
    try {
      const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, selectedPlayer.id);
      await updateDoc(playerRef, editValues);
      
      // Update local state
      setPlayers(prev => prev.map(p => 
        p.id === selectedPlayer.id ? { ...p, ...editValues } : p
      ));
      setSelectedPlayer({ ...selectedPlayer, ...editValues });
      setEditMode(false);
      
      alert('Player updated successfully!');
    } catch (error) {
      console.error('Error updating player:', error);
      alert('Error updating player: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = {
    giveCredits: (amount) => {
      setEditValues(prev => ({ ...prev, credits: prev.credits + amount }));
    },
    fillFuel: () => {
      setEditValues(prev => ({ ...prev, fuel: prev.maxFuel }));
    },
    repairHull: () => {
      setEditValues(prev => ({ ...prev, hull: 100 }));
    },
    upgradeShip: () => {
      setEditValues(prev => ({ 
        ...prev, 
        holds: prev.holds + 10,
        maxFuel: prev.maxFuel + 50,
        maxShields: prev.maxShields + 25,
        shields: prev.maxShields + 25
      }));
    },
    makePirate: () => {
      setEditValues(prev => ({ ...prev, status: 'Pirate' }));
    },
    makeTrader: () => {
      setEditValues(prev => ({ ...prev, status: 'Trader' }));
    }
  };

  return (
    <div className="bg-red-900 border-2 border-red-500 p-4 text-white font-mono rounded-lg">
      <h3 className="text-lg mb-3 pb-2 border-b border-red-400 font-bold">🛡️ ADMINISTRATION</h3>
      
        {/* Universe Management */}
        <div className="mb-6 p-3 bg-red-800 rounded border border-red-600">
          <h4 className="font-semibold mb-2">Universe Management</h4>
          
          {/* Galaxy Generation Settings */}
          <div className="mb-4 p-2 bg-red-700 rounded">
            <h5 className="text-sm font-semibold mb-2">Galaxy Generation Settings</h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block mb-1">Sector Count:</label>
                <input
                  type="number"
                  min="20"
                  max="10000"
                  value={galaxySettings.sectorCount}
                  onChange={(e) => setGalaxySettings(prev => ({ ...prev, sectorCount: parseInt(e.target.value) || 100 }))}
                  className="w-full bg-black text-white p-1 rounded border border-red-600"
                />
              </div>
              <div>
                <label className="block mb-1">Shipyards (%):</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.1"
                  value={galaxySettings.shipyardPercent}
                  onChange={(e) => setGalaxySettings(prev => ({ ...prev, shipyardPercent: parseFloat(e.target.value) || 3 }))}
                  className="w-full bg-black text-white p-1 rounded border border-red-600"
                />
              </div>
              <div>
                <label className="block mb-1">Trading Posts (%):</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={galaxySettings.tradingPostPercent}
                  onChange={(e) => setGalaxySettings(prev => ({ ...prev, tradingPostPercent: parseFloat(e.target.value) || 15 }))}
                  className="w-full bg-black text-white p-1 rounded border border-red-600"
                />
              </div>
              <div>
                <label className="block mb-1">Planets (%):</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.1"
                  value={galaxySettings.planetPercent}
                  onChange={(e) => setGalaxySettings(prev => ({ ...prev, planetPercent: parseFloat(e.target.value) || 6 }))}
                  className="w-full bg-black text-white p-1 rounded border border-red-600"
                />
              </div>
              <div>
                <label className="block mb-1">Nebulas (%):</label>
                <input
                  type="number"
                  min="0"
                  max="80"
                  step="0.1"
                  value={galaxySettings.nebulaPercent}
                  onChange={(e) => setGalaxySettings(prev => ({ ...prev, nebulaPercent: parseFloat(e.target.value) || 30 }))}
                  className="w-full bg-black text-white p-1 rounded border border-red-600"
                />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-300">
              Total Objects: {(galaxySettings.shipyardPercent + galaxySettings.tradingPostPercent + galaxySettings.planetPercent).toFixed(1)}%
            </div>
          </div>
          
          <div className="space-y-2">
            <Button onClick={() => onGenerateUniverse(galaxySettings)} variant="primary" size="sm">
              Generate Custom Universe
            </Button>
            <Button onClick={onResetUniverse} variant="danger" size="sm">
              FORCE UNIVERSE RESET
            </Button>
            
            <div className="flex gap-2 items-center mt-3">
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value, 10))}
                className="bg-black text-white p-2 w-20 rounded border border-red-600"
                placeholder="Days"
              />
              <Button onClick={() => onSetEndDate(days)} variant="warning" size="sm">
                Set Season End
              </Button>
            </div>
          </div>
        </div>

      {/* Player Management */}
      <div className="mb-4 p-3 bg-red-800 rounded border border-red-600">
        <h4 className="font-semibold mb-2">Player Management</h4>
        
        {/* Player Selection */}
        <div className="mb-3">
          <label className="block text-sm mb-1">Select Player:</label>
          <select 
            className="w-full bg-black text-white p-2 rounded border border-red-600"
            onChange={(e) => {
              const player = players.find(p => p.id === e.target.value);
              if (player) handlePlayerSelect(player);
            }}
            value={selectedPlayer?.id || ''}
          >
            <option value="">Choose a player...</option>
            {players.map(player => (
              <option key={player.id} value={player.id}>
                {player.name} (${(player.credits || 0).toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        {/* Player Details & Editing */}
        {selectedPlayer && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h5 className="font-semibold">Editing: {selectedPlayer.name}</h5>
              <div className="space-x-2">
                <Button 
                  onClick={() => setEditMode(!editMode)} 
                  variant="secondary" 
                  size="sm"
                >
                  {editMode ? 'Cancel' : 'Edit'}
                </Button>
                {editMode && (
                  <Button 
                    onClick={handleSaveChanges} 
                    variant="success" 
                    size="sm"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                )}
              </div>
            </div>

            {editMode ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="block text-xs mb-1">Credits:</label>
                  <input
                    type="number"
                    value={editValues.credits}
                    onChange={(e) => setEditValues(prev => ({ ...prev, credits: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-black text-white p-1 rounded border border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Fuel:</label>
                  <input
                    type="number"
                    value={editValues.fuel}
                    onChange={(e) => setEditValues(prev => ({ ...prev, fuel: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-black text-white p-1 rounded border border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Max Fuel:</label>
                  <input
                    type="number"
                    value={editValues.maxFuel}
                    onChange={(e) => setEditValues(prev => ({ ...prev, maxFuel: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-black text-white p-1 rounded border border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Hull %:</label>
                  <input
                    type="number"
                    value={editValues.hull}
                    onChange={(e) => setEditValues(prev => ({ ...prev, hull: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-black text-white p-1 rounded border border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Cargo Holds:</label>
                  <input
                    type="number"
                    value={editValues.holds}
                    onChange={(e) => setEditValues(prev => ({ ...prev, holds: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-black text-white p-1 rounded border border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Shields:</label>
                  <input
                    type="number"
                    value={editValues.shields}
                    onChange={(e) => setEditValues(prev => ({ ...prev, shields: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-black text-white p-1 rounded border border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Max Shields:</label>
                  <input
                    type="number"
                    value={editValues.maxShields}
                    onChange={(e) => setEditValues(prev => ({ ...prev, maxShields: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-black text-white p-1 rounded border border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Current Sector:</label>
                  <input
                    type="number"
                    value={editValues.currentSector}
                    onChange={(e) => setEditValues(prev => ({ ...prev, currentSector: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-black text-white p-1 rounded border border-red-600"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs mb-1">Status:</label>
                  <select
                    value={editValues.status}
                    onChange={(e) => setEditValues(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-black text-white p-1 rounded border border-red-600"
                  >
                    <option value="Trader">Trader</option>
                    <option value="Pirate">Pirate</option>
                    <option value="Merchant">Merchant</option>
                    <option value="Explorer">Explorer</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Credits: ${(selectedPlayer.credits || 0).toLocaleString()}</div>
                <div>Fuel: {selectedPlayer.fuel || 0}/{selectedPlayer.maxFuel || 100}</div>
                <div>Hull: {selectedPlayer.hull || 100}%</div>
                <div>Holds: {selectedPlayer.holds || 10}</div>
                <div>Shields: {selectedPlayer.shields || 0}/{selectedPlayer.maxShields || 0}</div>
                <div>Sector: {selectedPlayer.currentSector || 1}</div>
                <div className="col-span-2">Status: {selectedPlayer.status || 'Trader'}</div>
              </div>
            )}

            {/* Quick Actions */}
            {editMode && (
              <div className="mt-3 p-2 bg-red-700 rounded">
                <h6 className="text-xs font-semibold mb-2">Quick Actions:</h6>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <button 
                    onClick={() => quickActions.giveCredits(10000)}
                    className="bg-green-600 hover:bg-green-500 p-1 rounded"
                  >
                    +10K Credits
                  </button>
                  <button 
                    onClick={() => quickActions.giveCredits(100000)}
                    className="bg-green-600 hover:bg-green-500 p-1 rounded"
                  >
                    +100K Credits
                  </button>
                  <button 
                    onClick={() => quickActions.fillFuel()}
                    className="bg-blue-600 hover:bg-blue-500 p-1 rounded"
                  >
                    Fill Fuel
                  </button>
                  <button 
                    onClick={() => quickActions.repairHull()}
                    className="bg-cyan-600 hover:bg-cyan-500 p-1 rounded"
                  >
                    Repair Hull
                  </button>
                  <button 
                    onClick={() => quickActions.upgradeShip()}
                    className="bg-purple-600 hover:bg-purple-500 p-1 rounded"
                  >
                    Upgrade Ship
                  </button>
                  <button 
                    onClick={() => quickActions.makePirate()}
                    className="bg-red-600 hover:bg-red-500 p-1 rounded"
                  >
                    Make Pirate
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
