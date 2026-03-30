import React, { useState, useEffect, useCallback, useRef } from 'react';
import Button from './Button.jsx';
import { LOG_TYPES } from '../constants/gameConstants.js';

export default function PirateCombat({ 
  pirates = [], 
  player = {}, 
  onCombatEnd = () => {}, 
  onPlayerUpdate = () => {},
  playSound = () => {},
  addToLog = () => {}
}) {
  const [currentPirateIndex, setCurrentPirateIndex] = useState(0);
  const [currentPirate, setCurrentPirate] = useState(null);
  const [combatState, setCombatState] = useState({
    isPlayerTurn: true,
    actionInProgress: false,
    combatEnded: false
  });
  const [combatLog, setCombatLog] = useState([]);
  const [playerHull, setPlayerHull] = useState(player?.hull || 100);
  const [playerShields, setPlayerShields] = useState(player?.shields || 0);

  const combatLogRef = useRef(null);

  // Initialize combat
  useEffect(() => {
    if (pirates && pirates.length > 0) {
      const firstPirate = { ...pirates[0] };
      setCurrentPirate(firstPirate);
      addToCombatLog(`Combat begins! Facing ${firstPirate.name}`);
      
      // Play encounter sound
      if (playSound) {
        playSound('WARNING');
      }
    }
  }, [pirates, playSound]);

  const addToCombatLog = useCallback((message) => {
    setCombatLog(prev => [...prev, message]);
  }, []);

  const calculateDamage = useCallback((weaponPower, defense = 0) => {
    const baseDamage = weaponPower || 10;
    const actualDamage = Math.max(1, baseDamage - defense);
    return Math.floor(actualDamage + (Math.random() * 5)); // Add some variance
  }, []);

  const generateLoot = useCallback((pirate) => {
    if (!pirate) return { credits: 0 };

    const range = pirate.loot?.credits || { min: 50, max: 150 };
    const credits = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

    return { credits };
  }, []);

  const handlePirateTurn = useCallback((pirate) => {
    if (!pirate || combatState.combatEnded) return;

    const damage = calculateDamage(
      Math.floor(Math.random() * (pirate.damage.max - pirate.damage.min + 1)) + pirate.damage.min
    );
    
    // Damage shields first, then hull
    let remainingDamage = damage;
    let newShields = playerShields;
    let newHull = playerHull;
    
    if (newShields > 0) {
      const shieldDamage = Math.min(remainingDamage, newShields);
      newShields -= shieldDamage;
      remainingDamage -= shieldDamage;
      addToCombatLog(`${pirate.name} attacks! Shields absorb ${shieldDamage} damage.`);
    }
    
    if (remainingDamage > 0) {
      newHull = Math.max(0, newHull - remainingDamage);
      addToCombatLog(`${pirate.name} deals ${remainingDamage} hull damage!`);
    }
    
    setPlayerShields(newShields);
    setPlayerHull(newHull);
    
    // Update player in game
    onPlayerUpdate({
      shields: newShields,
      hull: newHull
    });
    
    if (playSound) {
      playSound('WARNING');
    }

    if (newHull <= 0) {
      // Player defeated
      setCombatState(prev => ({ ...prev, combatEnded: true }));
      addToCombatLog('Your ship has been destroyed!');
      setTimeout(() => {
        onCombatEnd('DEFEAT');
      }, 1000);
    } else {
      // Switch back to player turn
      setCombatState(prev => ({ 
        ...prev, 
        isPlayerTurn: true, 
        actionInProgress: false 
      }));
    }
  }, [playerHull, playerShields, calculateDamage, addToCombatLog, playSound, onCombatEnd, onPlayerUpdate, combatState.combatEnded]);

  const handleAttack = useCallback(async () => {
    if (!combatState.isPlayerTurn || combatState.actionInProgress || !currentPirate) return;
    
    setCombatState(prev => ({ ...prev, actionInProgress: true }));
    
    if (playSound) {
      playSound('TRADE_SUCCESS');
    }
    
    // Calculate player weapon damage (weaponDamage + random variance)
    const weaponPower = (player?.weaponDamage || 15) + Math.floor(Math.random() * 10);
    const damage = calculateDamage(weaponPower, currentPirate.armor || 0);
    
    // Damage shields first, then hull
    let remainingDamage = damage;
    let newShields = currentPirate.shields;
    let newHull = currentPirate.hull;
    
    if (newShields > 0) {
      const shieldDamage = Math.min(remainingDamage, newShields);
      newShields -= shieldDamage;
      remainingDamage -= shieldDamage;
      addToCombatLog(`You attack ${currentPirate.name}! Shields absorb ${shieldDamage} damage.`);
    }
    
    if (remainingDamage > 0) {
      newHull = Math.max(0, newHull - remainingDamage);
      addToCombatLog(`You deal ${remainingDamage} hull damage to ${currentPirate.name}!`);
    }
    
    const updatedPirate = { ...currentPirate, hull: newHull, shields: newShields };
    setCurrentPirate(updatedPirate);
    
    if (newHull <= 0) {
      // Pirate defeated
      if (playSound) {
        playSound('ACHIEVEMENT');
      }
      
      addToCombatLog(`${currentPirate.name} has been destroyed!`);
      
      // Award loot
      const loot = generateLoot(currentPirate);
      if (loot.credits > 0) {
        addToCombatLog(`You salvaged ${loot.credits} credits from the wreckage!`);
        // Update player credits directly
        onPlayerUpdate({
          credits: (player.credits || 0) + loot.credits
        });
        addToLog(`Combat victory! Gained ${loot.credits} credits from pirate loot.`, LOG_TYPES.SUCCESS);
      }
      
      // Check for more pirates
      const remainingPirates = pirates.slice(currentPirateIndex + 1);
      if (remainingPirates.length > 0) {
        setCurrentPirateIndex(prev => prev + 1);
        setCurrentPirate(remainingPirates[0]);
        addToCombatLog(`${remainingPirates[0].name} moves in to attack!`);
        setCombatState(prev => ({ ...prev, actionInProgress: false }));
      } else {
        // All pirates defeated
        setCombatState(prev => ({ ...prev, combatEnded: true }));
        addToCombatLog('All pirates defeated! You are victorious!');
        setTimeout(() => {
          onCombatEnd('VICTORY');
        }, 1500);
        return;
      }
    } else {
      // Switch to pirate turn
      setCombatState(prev => ({ 
        ...prev, 
        isPlayerTurn: false, 
        actionInProgress: false 
      }));
      
      // Pirate attacks after a delay
      setTimeout(() => {
        handlePirateTurn(updatedPirate);
      }, 1500);
    }
  }, [
    combatState.isPlayerTurn, 
    combatState.actionInProgress, 
    currentPirate, 
    player.credits,
    calculateDamage, 
    addToCombatLog, 
    addToLog,
    playSound, 
    generateLoot, 
    onPlayerUpdate,
    pirates, 
    currentPirateIndex, 
    onCombatEnd,
    handlePirateTurn
  ]);

  const handleEscape = useCallback(async () => {
    if (!combatState.isPlayerTurn || combatState.actionInProgress) return;
    
    setCombatState(prev => ({ ...prev, actionInProgress: true }));
    
    const escapeChance = 0.3; // 30% chance
    const escaped = Math.random() < escapeChance;
    
    if (escaped) {
      addToCombatLog('You successfully escaped!');
      if (playSound) {
        playSound('escape');
      }
      setCombatState(prev => ({ ...prev, combatEnded: true }));
      setTimeout(() => {
        onCombatEnd('ESCAPED');
      }, 1000);
    } else {
      addToCombatLog('Escape failed! The pirates block your retreat!');
      if (playSound) {
        playSound('escape_failed');
      }
      
      // Switch to pirate turn after failed escape
      setCombatState(prev => ({ 
        ...prev, 
        isPlayerTurn: false, 
        actionInProgress: false 
      }));
      
      setTimeout(() => {
        handlePirateTurn(currentPirate);
      }, 1000);
    }
  }, [
    combatState.isPlayerTurn, 
    combatState.actionInProgress, 
    addToCombatLog, 
    playSound, 
    onCombatEnd,
    handlePirateTurn,
    currentPirate
  ]);

  // Handle empty or invalid pirates array
  if (!pirates || pirates.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-gray-900 border-2 border-red-500 rounded-lg p-6">
          <div className="text-red-400 text-center">No pirates to fight!</div>
          <div className="mt-4 text-center">
            <Button onClick={() => onCombatEnd('VICTORY')}>
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle missing player data
  if (!player) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-gray-900 border-2 border-red-500 rounded-lg p-6">
          <div className="text-red-400 text-center">Player data missing!</div>
          <div className="mt-4 text-center">
            <Button onClick={() => onCombatEnd('DEFEAT')}>
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentPirate) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-red-500 rounded-lg p-6 max-w-4xl w-full mx-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-red-400 mb-2">⚔️ PIRATE COMBAT ⚔️</h2>
          <div className="text-sm text-gray-400">
            Enemy {currentPirateIndex + 1} of {pirates.length}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Player Status */}
          <div className="bg-blue-900 border border-blue-500 rounded p-4">
            <h3 className="text-lg font-bold text-blue-300 mb-3">🚀 Your Ship</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Hull:</span>
                <span className={`font-bold ${playerHull > 50 ? 'text-green-400' : playerHull > 25 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {playerHull}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Shields:</span>
                <span className="font-bold text-cyan-400">
                  {playerShields}/{player?.maxShields || 0}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${playerHull > 50 ? 'bg-green-500' : playerHull > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.max(0, Math.min(100, playerHull))}%` }}
                ></div>
              </div>
              {playerShields > 0 && (
                <div className="w-full bg-gray-700 rounded-full h-1">
                  <div 
                    className="h-1 rounded-full transition-all duration-300 bg-cyan-500"
                    style={{ width: `${Math.max(0, (playerShields / (player?.maxShields || 1)) * 100)}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>

          {/* Pirate Status */}
          <div className="bg-red-900 border border-red-500 rounded p-4">
            <h3 className="text-lg font-bold text-red-300 mb-3">💀 {currentPirate.name}</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Hull:</span>
                <span className={`font-bold ${currentPirate.hull > 50 ? 'text-green-400' : currentPirate.hull > 25 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {currentPirate.hull}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Shields:</span>
                <span className="font-bold text-cyan-400">
                  {currentPirate.shields}/{currentPirate.maxShields}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${currentPirate.hull > 50 ? 'bg-green-500' : currentPirate.hull > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.max(0, currentPirate.hull)}%` }}
                ></div>
              </div>
              {currentPirate.shields > 0 && (
                <div className="w-full bg-gray-700 rounded-full h-1">
                  <div 
                    className="h-1 rounded-full transition-all duration-300 bg-cyan-500"
                    style={{ width: `${Math.max(0, (currentPirate.shields / currentPirate.maxShields) * 100)}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Combat Log */}
        <div 
          ref={combatLogRef}
          className="bg-black border border-gray-600 rounded p-4 mb-6 h-32 overflow-y-auto"
          data-testid="combat-log"
          aria-label="Combat Log"
        >
          <div className="text-sm font-mono">
            {combatLog.map((message, index) => (
              <div key={index} className="text-green-400 mb-1">{message}</div>
            ))}
          </div>
        </div>

        {/* Combat Actions */}
        {combatState.isPlayerTurn && !combatState.combatEnded && (
          <div className="flex flex-wrap gap-3 justify-center">
            <Button 
              onClick={handleAttack}
              disabled={combatState.actionInProgress}
              variant="danger"
              aria-label="⚔️ Attack"
            >
              ⚔️ Attack
            </Button>
            <Button 
              onClick={handleEscape}
              disabled={combatState.actionInProgress}
              variant="secondary"
              aria-label="🏃 Escape (30%)"
            >
              🏃 Escape (30%)
            </Button>
          </div>
        )}

        {!combatState.isPlayerTurn && !combatState.combatEnded && (
          <div className="text-center">
            <div className="text-yellow-400 font-bold">💀 Pirate preparing to attack...</div>
          </div>
        )}

        {combatState.combatEnded && (
          <div className="text-center">
            <div className="text-cyan-400 font-bold">Combat ending...</div>
          </div>
        )}
      </div>
    </div>
  );
}
