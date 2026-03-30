import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getFirestore, doc, onSnapshot, collection, getDocs, setDoc, query, writeBatch, updateDoc, runTransaction } from 'firebase/firestore';

// Component Imports
import StatusBar from './StatusBar.jsx';
import GameScreen from './GameScreen.jsx';
import Button from './Button.jsx';
import AdminPanel from './AdminPanel.jsx';
import CountdownTimer from './CountdownTimer.jsx';
import Footer from './Footer.jsx';
import Header from './Header.jsx';
import ShipDisplay from './ShipDisplay.jsx';
import WarpDriveInterface from './WarpDriveInterface.jsx';
import InvestmentInterface from './InvestmentInterface.jsx';
import SectorDisplay from './SectorDisplay.jsx';
import AchievementNotification from './AchievementNotification.jsx';
import CompanyInterface from './CompanyInterface.jsx';
import PirateCombat from './PirateCombat.jsx';

// Custom Hooks
import { useGameLog } from '../hooks/useGameLog.js';
import { usePlayerActions } from '../hooks/usePlayerActions.js';
import { useInvestments } from '../hooks/useInvestments.js';
import { useAudioManager } from '../hooks/useAudioManager.js';

// Constants and Utilities
import { 
  FIREBASE_PATHS, 
  DOCUMENT_IDS, 
  GAME_CONFIG, 
  COMMODITIES, 
  SHIP_UPGRADES,
  SHIP_TYPES,
  STARPORT_SERVICES,
  STARPORT_UPGRADES,
  RANDOM_EVENTS,
  EVENT_CONFIG,
  LOG_TYPES,
  PIRATE_CONFIG,
  PIRATE_TYPES,
  PIRATE_MESSAGES,
  PLANET_CLASSES 
} from '../constants/gameConstants.js';
// Validation utilities used by usePlayerActions hook
import { createFloatingText, createPulsingGlow, createScreenShake, createParticleEffect } from '../utils/animations.js';

export default function Game({ user, player, onSignOut }) {
  const [universe, setUniverse] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [shipsInSector, setShipsInSector] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [playerAchievements, setPlayerAchievements] = useState([]);
  const [eventHistory, setEventHistory] = useState([]);
  const [pirateEncounter, setPirateEncounter] = useState(null);
  const warpInputRef = useRef(null);
  const eventTimeoutRef = useRef(null);
  const randomEventTimeoutRef = useRef(null);
  const pirateTimeoutRef = useRef(null);

  const db = getFirestore();
  const { log, addToLog } = useGameLog();
  const { moveSector: playerMoveSector, warpToSector: playerWarpToSector, buyFuel, tradeCommodity, purchaseUpgrade, attackShip } = usePlayerActions(user, player, addToLog);
  const investments = useInvestments(user, player, addToLog);
  const { playSound, preloadSounds } = useAudioManager();

  // Effect for fetching game data and handling daily fuel recharge
  useEffect(() => {
    if (player && player.lastFuelRecharge) {
      const handleFuelRecharge = async () => {
        const now = new Date();
        const lastRecharge = new Date(player.lastFuelRecharge);
        if ((now - lastRecharge) / (1000 * 60 * 60) >= GAME_CONFIG.DAILY_FUEL_RECHARGE_HOURS) {
          const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
          await updateDoc(playerRef, { fuel: player.maxFuel, lastFuelRecharge: now.toISOString() });
          addToLog("Daily fuel recharge complete. Tanks are full!", LOG_TYPES.SUCCESS);
        }
      };
      handleFuelRecharge();
    }

    // Check for hull destruction and escape pod activation
    if (player && (player.hull || 100) <= 0 && !player.escapePodActivated) {
      const activateEscapePod = async () => {
        try {
          const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
          await updateDoc(playerRef, {
            escapePodActivated: true,
            shipType: 'ESCAPE_POD',
            hull: 1, // Minimal hull integrity
            holds: 1, // Escape pod has minimal cargo space
            maxFuel: 10, // Very limited fuel
            fuel: Math.min(player.fuel, 10), // Can't exceed new max
            shields: 0,
            maxShields: 0
          });
          addToLog("🚨 CRITICAL HULL BREACH! 🚨", LOG_TYPES.EMERGENCY);
          addToLog("Emergency systems activated! You barely escaped the explosion in your escape pod!", LOG_TYPES.EMERGENCY);
          addToLog("Your ship has been destroyed, but you survived! Find a shipyard to get a new ship.", LOG_TYPES.WARNING);
        } catch (error) {
          addToLog(`Emergency system error: ${error.message}`, LOG_TYPES.WARNING);
        }
      };
      activateEscapePod();
    }
    
    // Data Listeners
    const adminRef = doc(db, FIREBASE_PATHS.ADMINS, user.uid);
    const adminSub = onSnapshot(adminRef, (doc) => setIsAdmin(doc.exists() && doc.data().isAdmin === true));

    const gameStateRef = doc(db, FIREBASE_PATHS.UNIVERSE, DOCUMENT_IDS.GAME_STATE);
    const gameStateSub = onSnapshot(gameStateRef, (doc) => setGameState(doc.exists() ? doc.data() : null));

    const universeRef = doc(db, FIREBASE_PATHS.UNIVERSE, DOCUMENT_IDS.UNIVERSE);
    const universeSub = onSnapshot(universeRef, (doc) => { if (doc.exists()) setUniverse(doc.data()); });

    const playersQuery = query(collection(db, FIREBASE_PATHS.PLAYERS));
    const playersSub = onSnapshot(playersQuery, s => {
      const players = s.docs.map(d => ({ ...d.data(), id: d.id, isNPC: false })).filter(p => p.id !== user.uid);
      setShipsInSector(curr => [...players, ...curr.filter(ship => ship.isNPC)]);
    });

    const npcsQuery = query(collection(db, FIREBASE_PATHS.NPCS));
    const npcsSub = onSnapshot(npcsQuery, s => {
      const npcs = s.docs.map(d => ({ ...d.data(), id: d.id, isNPC: true }));
      setShipsInSector(curr => [...curr.filter(ship => !ship.isNPC), ...npcs]);
    });

    return () => {
      adminSub(); gameStateSub(); universeSub(); playersSub(); npcsSub();
      if (eventTimeoutRef.current) clearTimeout(eventTimeoutRef.current);
      if (randomEventTimeoutRef.current) clearTimeout(randomEventTimeoutRef.current);
      if (pirateTimeoutRef.current) clearTimeout(pirateTimeoutRef.current);
    };
  }, [db, user.uid, player, addToLog]);


  // --- Random Event System ---
  const triggerRandomEvent = useCallback(async () => {
    if (!player) return;

    // Check cooldown and session limits
    const lastEventSector = player.lastEventSector || 0;
    const eventsThisSession = eventHistory.length;
    const sectorsSinceLastEvent = Math.abs(player.currentSector - lastEventSector);

    if (sectorsSinceLastEvent < EVENT_CONFIG.COOLDOWN_SECTORS || 
        eventsThisSession >= EVENT_CONFIG.MAX_EVENTS_PER_SESSION) {
      return;
    }

    // Roll for event
    if (Math.random() > EVENT_CONFIG.BASE_CHANCE_PER_SECTOR) return;

    // Select random event
    const eventKeys = Object.keys(RANDOM_EVENTS);
    const selectedEventKey = eventKeys[Math.floor(Math.random() * eventKeys.length)];
    const event = RANDOM_EVENTS[selectedEventKey];

    // Apply event effects
    const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
    const updates = { lastEventSector: player.currentSector };
    let eventLog = `${event.title}\n${event.description}\n`;

    // Process effects
    for (const [effectType, effectValue] of Object.entries(event.effects)) {
      switch (effectType) {
        case 'credits':
          if (typeof effectValue === 'object') {
            const amount = Math.floor(Math.random() * (effectValue.max - effectValue.min + 1)) + effectValue.min;
            updates.credits = Math.max(0, (player.credits || 0) + amount);
            eventLog += amount > 0 ? `+$${amount} credits! ` : `Lost $${Math.abs(amount)} credits. `;
          }
          break;

        case 'fuel':
          if (effectValue === 'fill_tank') {
            updates.fuel = player.maxFuel;
            eventLog += 'Fuel tank filled! ';
          } else if (typeof effectValue === 'object') {
            const amount = Math.floor(Math.random() * (effectValue.max - effectValue.min + 1)) + effectValue.min;
            updates.fuel = Math.max(0, Math.min(player.maxFuel, (player.fuel || 0) + amount));
            eventLog += amount > 0 ? `+${amount} fuel! ` : `Lost ${Math.abs(amount)} fuel. `;
          }
          break;

        case 'hull':
          if (typeof effectValue === 'object') {
            const amount = Math.floor(Math.random() * (effectValue.max - effectValue.min + 1)) + effectValue.min;
            updates.hull = Math.max(0, Math.min(100, (player.hull || 100) + amount));
            eventLog += amount > 0 ? `Hull repaired +${amount}%! ` : `Hull damaged -${Math.abs(amount)}%. `;
          }
          break;

        case 'holds':
          if (typeof effectValue === 'object') {
            const amount = Math.floor(Math.random() * (effectValue.max - effectValue.min + 1)) + effectValue.min;
            updates.holds = Math.max(1, (player.holds || 10) + amount);
            eventLog += `Cargo capacity ${amount > 0 ? 'increased' : 'decreased'} by ${Math.abs(amount)}! `;
          }
          break;

        case 'shields':
          if (typeof effectValue === 'object') {
            const amount = Math.floor(Math.random() * (effectValue.max - effectValue.min + 1)) + effectValue.min;
            updates.shields = Math.max(0, (player.shields || 0) + amount);
            eventLog += amount > 0 ? `Shields boosted +${amount}! ` : `Shields damaged -${Math.abs(amount)}. `;
          }
          break;

        case 'maxShields':
          if (typeof effectValue === 'object') {
            const amount = Math.floor(Math.random() * (effectValue.max - effectValue.min + 1)) + effectValue.min;
            updates.maxShields = Math.max(0, (player.maxShields || 0) + amount);
            if (amount > 0) eventLog += `Shield capacity increased +${amount}! `;
          }
          break;

        case 'cargo':
          if (effectValue.commodity === 'random') {
            const commodity = COMMODITIES[Math.floor(Math.random() * COMMODITIES.length)];
            const amount = Math.floor(Math.random() * (effectValue.amount.max - effectValue.amount.min + 1)) + effectValue.amount.min;
            const currentCargo = player.cargo?.[commodity.name] || 0;
            updates[`cargo.${commodity.name}`] = currentCargo + amount;
            eventLog += `Received ${amount} ${commodity.name}! `;
          } else if (effectValue.lose_random) {
            const playerCargo = player.cargo || {};
            const cargoItems = Object.keys(playerCargo).filter(item => playerCargo[item] > 0);
            if (cargoItems.length > 0) {
              const randomItem = cargoItems[Math.floor(Math.random() * cargoItems.length)];
              const maxLoss = Math.min(playerCargo[randomItem], effectValue.lose_random.max);
              const amount = Math.floor(Math.random() * (maxLoss - effectValue.lose_random.min + 1)) + effectValue.lose_random.min;
              updates[`cargo.${randomItem}`] = Math.max(0, playerCargo[randomItem] - amount);
              eventLog += amount > 0 ? `Lost ${amount} ${randomItem}. ` : 'Cargo inspection passed! ';
            }
          }
          break;

        case 'random_sector':
          if (effectValue && universe?.sectorCount) {
            const randomSector = Math.floor(Math.random() * universe.sectorCount) + 1;
            updates.currentSector = randomSector;
            eventLog += `Transported to sector ${randomSector}! `;
          }
          break;
      }
    }

    try {
      await updateDoc(playerRef, updates);
      addToLog(eventLog.trim(), event.logType);
      playSound(event.type === 'positive' ? 'ACHIEVEMENT' : event.type === 'challenge' ? 'WARNING' : 'WARP_ENGAGE');
      
      // Add to event history
      setEventHistory(prev => [...prev, { ...event, timestamp: Date.now() }]);
      
      // Show event notification
      setActiveEvent({ ...event, effects: eventLog });
      if (eventTimeoutRef.current) clearTimeout(eventTimeoutRef.current);
      eventTimeoutRef.current = setTimeout(() => setActiveEvent(null), 8000);
      
    } catch (error) {
      addToLog(`Event system error: ${error.message}`, LOG_TYPES.WARNING);
    }
  }, [player, universe, user.uid, db, addToLog, playSound, eventHistory]);

  // --- Player Actions (delegate to hook, add event/pirate triggers) ---
  const moveSector = async (newSector) => {
    if (!player || newSector < 1 || newSector > (universe?.sectorCount || GAME_CONFIG.SECTOR_COUNT)) return;

    try {
      await playerMoveSector(newSector);
      if (randomEventTimeoutRef.current) clearTimeout(randomEventTimeoutRef.current);
      if (pirateTimeoutRef.current) clearTimeout(pirateTimeoutRef.current);
      randomEventTimeoutRef.current = setTimeout(() => triggerRandomEvent(), 1000);
      pirateTimeoutRef.current = setTimeout(() => triggerPirateEncounter(), 1500);
    } catch (error) {
      // Errors already handled by hook
    }
  };


  // --- Pirate Encounter System ---
  const triggerPirateEncounter = useCallback(async () => {
    if (!player || pirateEncounter || !universe) return;

    const currentSector = universe.sectors[player.currentSector];
    if (!currentSector) return;

    // Pirates only attack in dangerous, unprotected sectors
    // No pirate encounters in sectors with ports/stations (they have security)
    if (currentSector.port) return;

    // Pirates can only attack in: deep space (EMPTY), nebulas, or planet sectors without ports
    const dangerousSectorTypes = ['EMPTY', 'NEBULA'];
    const isPlanetWithoutPort = currentSector.planet && !currentSector.port;
    const isDangerousSector = dangerousSectorTypes.includes(currentSector.type) || isPlanetWithoutPort;

    if (!isDangerousSector) return;

    // Check cooldown
    const lastPirateEncounter = player.lastPirateEncounter || 0;
    const sectorsSinceLastEncounter = Math.abs(player.currentSector - lastPirateEncounter);

    if (sectorsSinceLastEncounter < PIRATE_CONFIG.MIN_SECTORS_BETWEEN_ENCOUNTERS) {
      return;
    }

    // Roll for encounter
    if (Math.random() > PIRATE_CONFIG.ENCOUNTER_CHANCE) return;

    // Generate pirates — scale difficulty with player power
    const playerPower = (player.credits || 0) + ((player.holds || 10) * 100) + ((player.maxShields || 0) * 50);
    let availablePirateTypes;
    let maxPirates;

    if (playerPower < 5000) {
      availablePirateTypes = ['RAIDER'];
      maxPirates = 1;
    } else if (playerPower < 20000) {
      availablePirateTypes = ['RAIDER', 'CORSAIR'];
      maxPirates = 2;
    } else if (playerPower < 50000) {
      availablePirateTypes = ['CORSAIR', 'MARAUDER'];
      maxPirates = 2;
    } else {
      availablePirateTypes = ['MARAUDER', 'FLAGSHIP'];
      maxPirates = PIRATE_CONFIG.MAX_PIRATES_PER_ENCOUNTER;
    }

    const numPirates = Math.floor(Math.random() * maxPirates) + 1;
    const pirates = [];

    for (let i = 0; i < numPirates; i++) {
      const pirateTypeKey = availablePirateTypes[Math.floor(Math.random() * availablePirateTypes.length)];
      const pirateTemplate = PIRATE_TYPES[pirateTypeKey];
      
      pirates.push({
        ...pirateTemplate,
        id: `pirate_${i}_${Date.now()}`,
        hull: pirateTemplate.hull,
        shields: pirateTemplate.shields,
        maxHull: pirateTemplate.hull,
        maxShields: pirateTemplate.shields
      });
    }

    // Update player's last encounter sector
    try {
      const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
      await updateDoc(playerRef, {
        lastPirateEncounter: player.currentSector
      });
    } catch (error) {
      console.error('Error updating pirate encounter:', error);
    }

    setPirateEncounter(pirates);
  }, [player, pirateEncounter, db, user.uid]);

  const handleCombatEnd = async (result) => {
    if (result === 'DEFEAT') {
      try {
        const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
        await runTransaction(db, async (transaction) => {
          const playerDoc = await transaction.get(playerRef);
          const fresh = playerDoc.data();

          const updates = {
            hull: Math.max(1, (fresh.hull || 100) * 0.1),
            credits: Math.max(0, (fresh.credits || 0) * 0.7),
          };

          const cargo = fresh.cargo || {};
          Object.keys(cargo).forEach(commodity => {
            updates[`cargo.${commodity}`] = Math.floor(cargo[commodity] * 0.8);
          });

          transaction.update(playerRef, updates);
        });
        addToLog('Pirates have taken their toll on your ship and cargo!', LOG_TYPES.WARNING);
      } catch (error) {
        addToLog(`Error applying combat penalties: ${error.message}`, LOG_TYPES.WARNING);
      }
    }

    setPirateEncounter(null);
  };

  const handlePlayerUpdate = async (updates) => {
    try {
      const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
      await runTransaction(db, async (transaction) => {
        const playerDoc = await transaction.get(playerRef);
        if (!playerDoc.exists()) return;
        transaction.update(playerRef, updates);
      });
    } catch (error) {
      addToLog(`Error updating player: ${error.message}`, LOG_TYPES.WARNING);
    }
  };

  // buyFuel and tradeCommodity delegated to usePlayerActions hook

  const handleAchievementUnlocked = async (achievementId) => {
    try {
      const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
      const newAchievements = [...(player.achievements || []), achievementId];
      await updateDoc(playerRef, {
        achievements: newAchievements
      });
      setPlayerAchievements(newAchievements);
      addToLog(`Achievement unlocked: ${achievementId.replace('_', ' ')}!`, LOG_TYPES.SUCCESS);
    } catch (error) {
      console.error('Error saving achievement:', error);
    }
  };

  // purchaseUpgrade delegated to usePlayerActions hook

  const purchaseShip = async (shipKey, ship) => {
    if (!player || !currentSector?.port?.isShipyard) return;

    try {
      const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
      await runTransaction(db, async (transaction) => {
        const playerDoc = await transaction.get(playerRef);
        const fresh = playerDoc.data();

        if (fresh.credits < ship.price) {
          throw new Error('Insufficient credits for ship purchase');
        }

        transaction.update(playerRef, {
          credits: fresh.credits - ship.price,
          holds: ship.holds,
          maxFuel: ship.maxFuel,
          fuel: Math.min(fresh.fuel, ship.maxFuel),
          maxShields: ship.maxShields,
          shields: ship.maxShields,
          hull: 100,
          shipType: shipKey,
          weaponDamage: 15,
          escapePodActivated: false
        });
      });
      playSound('TRADE_SUCCESS');
      addToLog(`Purchased ${ship.name} for $${ship.price.toLocaleString()}! Your new ship is ready for action.`, LOG_TYPES.SUCCESS);
    } catch (error) {
      addToLog(`Ship purchase error: ${error.message}`, LOG_TYPES.WARNING);
    }
  };

  const purchaseService = async (serviceKey, service) => {
    if (!player || !currentSector?.port?.isShipyard) return;

    try {
      const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
      await runTransaction(db, async (transaction) => {
        const playerDoc = await transaction.get(playerRef);
        const fresh = playerDoc.data();

        if (fresh.credits < service.price) {
          throw new Error('Insufficient credits for service');
        }

        const shipyardId = `sector_${fresh.currentSector}`;
        const shipyardServices = fresh.purchasedServices?.[shipyardId] || [];

        if (shipyardServices.includes(serviceKey)) {
          throw new Error('Already purchased this service at this shipyard');
        }

        const updates = {
          credits: fresh.credits - service.price,
          [`purchasedServices.${shipyardId}`]: [...shipyardServices, serviceKey]
        };

        switch (serviceKey) {
          case 'SHIP_REPAIR':
            updates.hull = 100;
            break;
          case 'SHIELD_REPAIR':
            updates.shields = fresh.maxShields || 0;
            break;
          case 'EMERGENCY_REPAIRS':
            updates.hull = Math.min(100, (fresh.hull || 100) + 25);
            updates.shields = Math.min(fresh.maxShields || 0, (fresh.shields || 0) + 10);
            break;
          case 'SYSTEM_DIAGNOSTICS':
            updates.fuel = Math.min(fresh.maxFuel, (fresh.fuel || 0) + 10);
            updates.hull = Math.min(100, (fresh.hull || 100) + 5);
            break;
        }

        transaction.update(playerRef, updates);
      });

      playSound('TRADE_SUCCESS');
      addToLog(`Purchased ${service.name} for $${service.price.toLocaleString()}!`, LOG_TYPES.SUCCESS);
    } catch (error) {
      addToLog(`Service error: ${error.message}`, LOG_TYPES.WARNING);
    }
  };

  const warpToSector = async (targetSector) => {
    if (!player || targetSector < 1 || targetSector > (universe?.sectorCount || GAME_CONFIG.SECTOR_COUNT)) return;

    try {
      await playerWarpToSector(targetSector);
      playSound('WARP_ENGAGE');
      if (randomEventTimeoutRef.current) clearTimeout(randomEventTimeoutRef.current);
      randomEventTimeoutRef.current = setTimeout(() => triggerRandomEvent(), 1000);
    } catch (error) {
      // Errors already handled by hook
    }
  };

  const handleGenerateUniverse = async (customSettings = null) => {
    if (!isAdmin) return;
    
    try {
      // Use custom settings if provided, otherwise prompt or use defaults
      let sectorCount, minShipyards, minTradingPosts, nebulaPercent;
      
      if (customSettings) {
        sectorCount = customSettings.sectorCount;
        minShipyards = Math.max(1, Math.ceil(sectorCount * (customSettings.shipyardPercent / 100)));
        minTradingPosts = Math.ceil(sectorCount * (customSettings.tradingPostPercent / 100));
        nebulaPercent = customSettings.nebulaPercent / 100;
      } else {
        // Fallback to prompt for sector count
        sectorCount = window.prompt('Enter number of sectors (minimum 20):', GAME_CONFIG.SECTOR_COUNT);
        sectorCount = parseInt(sectorCount);
        if (isNaN(sectorCount) || sectorCount < 20) sectorCount = GAME_CONFIG.SECTOR_COUNT;
        
        // Use default percentages
        minShipyards = Math.max(1, Math.ceil(sectorCount * 0.03)); // 3% shipyards (minimum 1)
        minTradingPosts = Math.ceil(sectorCount * 0.15); // 15% trading posts (increased from 12% to compensate for removing stations)
        nebulaPercent = 0.3; // 30% nebulas
      }

      // Generate well-distributed stations with minimum distance rule
      const MIN_STATION_DISTANCE = 10;
      const shipyardIndices = new Set();
      const tradingPostIndices = new Set();
      const allStationIndices = new Set();

      // Helper function to check if a sector is too close to existing stations
      const isTooClose = (sector, existingStations, minDistance) => {
        for (const existing of existingStations) {
          if (Math.abs(sector - existing) < minDistance) {
            return true;
          }
        }
        return false;
      };

      // Helper function to try placing stations with distance constraints
      const tryPlaceStations = (targetSet, targetCount, maxAttempts) => {
        let attempts = 0;
        while (targetSet.size < targetCount && attempts < maxAttempts) {
          const sector = Math.floor(Math.random() * sectorCount) + 1;
          if (!isTooClose(sector, allStationIndices, MIN_STATION_DISTANCE)) {
            targetSet.add(sector);
            allStationIndices.add(sector);
          }
          attempts++;
        }
        return targetSet.size;
      };

      // Generate shipyards first (most important and rarest)
      const maxAttempts = sectorCount * 3; // Prevent infinite loops
      const shipyardsPlaced = tryPlaceStations(shipyardIndices, minShipyards, maxAttempts);
      
      // Generate trading posts second
      const tradingPostsPlaced = tryPlaceStations(tradingPostIndices, minTradingPosts, maxAttempts);

      // Log results
      if (shipyardsPlaced < minShipyards || tradingPostsPlaced < minTradingPosts) {
        addToLog(`Warning: Could only place ${shipyardsPlaced}/${minShipyards} shipyards and ${tradingPostsPlaced}/${minTradingPosts} trading posts due to distance constraints.`, LOG_TYPES.WARNING);
      }

      // Helper functions for shipyard generation
      const generateShipInventory = () => {
        const shipKeys = Object.keys(SHIP_TYPES);
        const inventorySize = Math.floor(Math.random() * 3) + 2; // 2-4 ship types per shipyard
        const selectedShips = [];
        
        // Always include at least one basic ship
        selectedShips.push('SCOUT');
        
        // Add random ships
        for (let j = 1; j < inventorySize; j++) {
          const randomShip = shipKeys[Math.floor(Math.random() * shipKeys.length)];
          if (!selectedShips.includes(randomShip)) {
            selectedShips.push(randomShip);
          }
        }
        
        return selectedShips.reduce((acc, shipKey) => {
          const ship = SHIP_TYPES[shipKey];
          acc[shipKey] = {
            ...ship,
            // Add some price variation (±10%)
            price: Math.floor(ship.price * (0.9 + Math.random() * 0.2))
          };
          return acc;
        }, {});
      };

      const generateStarportServices = () => {
        const serviceKeys = Object.keys(STARPORT_SERVICES);
        const serviceCount = Math.floor(Math.random() * 3) + 4; // 4-6 services per shipyard
        const selectedServices = [];
        
        // Always include basic services
        selectedServices.push('SHIP_REPAIR', 'SHIELD_REPAIR');
        
        // Add random services
        while (selectedServices.length < serviceCount && selectedServices.length < serviceKeys.length) {
          const randomService = serviceKeys[Math.floor(Math.random() * serviceKeys.length)];
          if (!selectedServices.includes(randomService)) {
            selectedServices.push(randomService);
          }
        }
        
        return selectedServices.reduce((acc, serviceKey) => {
          const service = STARPORT_SERVICES[serviceKey];
          acc[serviceKey] = {
            ...service,
            // Add some price variation (±15%)
            price: Math.floor(service.basePrice * (0.85 + Math.random() * 0.3))
          };
          return acc;
        }, {});
      };

      // Generate planets
      const planetPercent = customSettings ? customSettings.planetPercent / 100 : 0.06; // 6% default
      const asteroidPercent = customSettings ? customSettings.asteroidPercent / 100 : 0.15; // 15% default
      
      // Helper function to generate a random planet
      const generatePlanet = () => {
        const planetClassKeys = Object.keys(PLANET_CLASSES);
        const weights = {
          'M': 40, // Common - 40% chance
          'K': 25, // Uncommon - 25% chance  
          'B': 20, // Uncommon - 20% chance
          'G': 10, // Rare - 10% chance
          'D': 5   // Rare - 5% chance
        };
        
        // Weighted random selection
        const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        for (const [classKey, weight] of Object.entries(weights)) {
          random -= weight;
          if (random <= 0) {
            const planetClass = PLANET_CLASSES[classKey];
            return {
              classRating: classKey,
              type: planetClass.name,
              description: planetClass.description,
              resources: planetClass.resources,
              rarity: planetClass.rarity,
              isHomeworld: false // Special planets can be marked as homeworlds later
            };
          }
        }
        
        // Fallback to Class M if something goes wrong
        return {
          classRating: 'M',
          type: PLANET_CLASSES.M.name,
          description: PLANET_CLASSES.M.description,
          resources: PLANET_CLASSES.M.resources,
          rarity: PLANET_CLASSES.M.rarity,
          isHomeworld: false
        };
      };

      const sectors = {};
      for (let i = 1; i <= sectorCount; i++) {
        let port = null;
        let planet = null;
        let sectorType = 'EMPTY';
        
        // Determine if this sector has a station (only shipyards or trading posts)
        if (shipyardIndices.has(i) || tradingPostIndices.has(i)) {
          const isShipyard = shipyardIndices.has(i);
          const isTradingPost = tradingPostIndices.has(i);
          
          port = {
            name: isShipyard
              ? `Shipyard ${i}`
              : `Trading Post ${i}`,
            isStarPort: isShipyard, // Shipyards are starports (can upgrade ships)
            isTradingPost: isTradingPost,
            isShipyard: isShipyard,
            // Only trading posts have commodities, shipyards don't
            commodities: isShipyard ? {} : COMMODITIES.reduce((acc, comm) => {
              return {
                ...acc,
                [comm.name]: {
                  buyPrice: Math.floor(comm.basePrice * (0.8 + Math.random() * 0.4)),
                  sellPrice: Math.floor(comm.basePrice * (0.6 + Math.random() * 0.4))
                }
              };
            }, {}),
            // Add ship inventory and services for shipyards
            ...(isShipyard && {
              shipInventory: generateShipInventory(),
              starportServices: generateStarportServices()
            })
          };
        }
        
        // Determine sector type and features
        if (Math.random() < nebulaPercent) {
          sectorType = 'NEBULA';
        } else if (Math.random() < asteroidPercent) {
          sectorType = 'ASTEROID';
        } else if (Math.random() < planetPercent) {
          // Generate a planet for this sector
          planet = generatePlanet();
          sectorType = 'PLANET';
        }
        
        // Special case: if sector has a port but no planet, and we rolled for a planet, add it
        if (!planet && port && Math.random() < planetPercent * 0.5) {
          planet = generatePlanet();
        }
        
        sectors[i] = {
          id: i,
          name: `Sector ${i}`,
          type: sectorType,
          port,
          ...(planet && { planet })
        };
      }

      // Count planets generated
      const planetsGenerated = Object.values(sectors).filter(sector => sector.planet).length;
      
      const universeRef = doc(db, FIREBASE_PATHS.UNIVERSE, DOCUMENT_IDS.UNIVERSE);
      await setDoc(universeRef, { sectors, sectorCount });
      addToLog(`Universe generated with ${sectorCount} sectors: ${shipyardsPlaced} shipyards, ${tradingPostsPlaced} trading posts, ${planetsGenerated} planets! (Min distance: ${MIN_STATION_DISTANCE} sectors)`, LOG_TYPES.SUCCESS);
      
      // Debug log to help identify the issue
      console.log('Universe generation completed:', {
        sectorCount,
        customSettingsProvided: !!customSettings,
        customSettings: customSettings,
        totalSectorsGenerated: Object.keys(sectors).length
      });
    } catch (error) {
  addToLog(`Universe generation error: ${error.message}`, LOG_TYPES.WARNING);
    }
  };

  const handleResetUniverse = async () => {
    if (!isAdmin) return;
    
    try {
      // Reset all players
  const playersSnapshot = await getDocs(collection(db, FIREBASE_PATHS.PLAYERS));
      const batch = writeBatch(db);
      
      playersSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      addToLog("Universe reset completed!", LOG_TYPES.SUCCESS);
    } catch (error) {
  addToLog(`Reset error: ${error.message}`, LOG_TYPES.WARNING);
    }
  };

  const handleSetEndDate = async (days) => {
    if (!isAdmin) return;
    
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);
      
      const gameStateRef = doc(db, FIREBASE_PATHS.UNIVERSE, DOCUMENT_IDS.GAME_STATE);
      await setDoc(gameStateRef, {
        gameEndDate: endDate
      });
  addToLog(`Game season set to end in ${days} days`, LOG_TYPES.SUCCESS);
    } catch (error) {
  addToLog(`Set end date error: ${error.message}`, LOG_TYPES.WARNING);
    }
  };

  // --- RENDER LOGIC ---
  const isGameActive = gameState?.gameEndDate && gameState.gameEndDate.toDate() > new Date();
  const currentShipsInSector = shipsInSector.filter(s => s.currentSector === player.currentSector);
  const currentSector = universe?.sectors[player.currentSector];

  const renderCurrentView = () => {
    if (showHelp) {
      return (
        <div>
          <h2 className="text-xl text-white mb-2">== HOW TO PLAY ==</h2>
          <p>Welcome, Captain! Your goal is to make a profit by buying and selling commodities, upgrading your ship, and surviving the dangers of space.</p>
        </div>
      );
    }
    if (!currentSector) return <p className="animate-pulse">Scanning sector...</p>;

    const currentPort = currentSector.port;
    const currentCargoTotal = Object.values(player.cargo || {}).reduce((a, b) => a + b, 0);
    const sectorCount = universe?.sectorCount || GAME_CONFIG.SECTOR_COUNT;

    return (
      <div>
        <p>System scan complete. {currentPort ? `Docking available at ${currentPort.name}.` : 'Sector is empty space.'}</p>

        {currentShipsInSector.length > 0 && (
          <div className="mt-4 border-t-2 border-yellow-400 pt-2">
            <h3 className="text-lg text-white">== SHIPS IN SECTOR ==</h3>
            {currentShipsInSector.map(ship => (
              <div key={ship.id} className="flex flex-col md:flex-row justify-between items-center text-sm mb-2">
                <div className="flex items-center gap-2">
                  {/* ShipDisplay now handles visuals; remove ASCII art */}
                  <span className={ship.status === 'Pirate' || ship.type === 'Pirate' ? 'text-red-500' : 'text-yellow-400'}>
                    {ship.name}{ship.isNPC ? ' [NPC]' : ''}
                  </span>
                </div>
                <Button onClick={() => attackShip(ship)}>Attack</Button>
              </div>
            ))}
          </div>
        )}

        {currentPort && (
          <div className="mt-4 border-t-2 border-green-400 pt-2">
            <h3 className="text-lg text-white">== {currentPort.name} SERVICES ==</h3>

            {/* Only show commodity trading if this isn't a shipyard */}
            {!currentPort.isShipyard && Object.keys(currentPort.commodities).length > 0 && (
              <div className="overflow-x-auto my-4">
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-green-600"><th>Commodity</th><th className="text-right">Buy At</th><th className="text-right">Sell At</th><th className="text-right">Your Cargo</th><th>Actions</th></tr></thead>
                  <tbody>
                    {COMMODITIES.map(c => {
                      const portComm = currentPort.commodities[c.name];
                      if (!portComm) return null;
                      const canAfford = player.credits >= portComm.buyPrice;
                      const hasSpace = currentCargoTotal < player.holds;
                      return (
                        <tr key={c.name} className="border-b border-green-800">
                          <td className="py-1">{c.name}</td>
                          <td className="text-right">${portComm.buyPrice}</td>
                          <td className="text-right">${portComm.sellPrice}</td>
                          <td className="text-right">{player.cargo[c.name] || 0}</td>
                          <td className="pl-4">
                            <button 
                              onClick={() => tradeCommodity(c.name, 'buy', 1, currentSector)} 
                              disabled={!canAfford || !hasSpace} 
                              className="text-white hover:text-green-400 disabled:text-gray-600"
                              data-commodity={c.name}
                              data-action="buy"
                            >
                              B
                            </button>
                            <button 
                              onClick={() => tradeCommodity(c.name, 'sell', 1, currentSector)} 
                              disabled={(player.cargo[c.name] || 0) <= 0} 
                              className="ml-2 text-white hover:text-green-400 disabled:text-gray-600"
                              data-commodity={c.name}
                              data-action="sell"
                            >
                              S
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Show shipyard inventory and services */}
            {currentPort.isShipyard && (
              <div className="my-4">
                <div className="p-3 bg-blue-900 border border-blue-600 rounded mb-4">
                  <p className="text-blue-200 text-sm">
                    🚀 This is a shipyard - specialized in ship construction and upgrades. 
                    No commodity trading available here. Visit a Trading Post for goods.
                  </p>
                </div>

                {/* Ship Inventory */}
                {currentPort.shipInventory && Object.keys(currentPort.shipInventory).length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-lg text-white mb-2">== SHIPS FOR SALE ==</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-blue-600">
                            <th>Ship Type</th>
                            <th className="text-right">Price</th>
                            <th className="text-right">Holds</th>
                            <th className="text-right">Fuel</th>
                            <th className="text-right">Shields</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(currentPort.shipInventory).map(([shipKey, ship]) => (
                            <tr key={shipKey} className="border-b border-blue-800">
                              <td className="py-2">
                                <div>
                                  <div className="font-medium">{ship.name}</div>
                                  <div className="text-xs text-gray-400">{ship.description}</div>
                                </div>
                              </td>
                              <td className="text-right">${ship.price.toLocaleString()}</td>
                              <td className="text-right">{ship.holds}</td>
                              <td className="text-right">{ship.maxFuel}</td>
                              <td className="text-right">{ship.maxShields}</td>
                              <td className="pl-4">
                                <button 
                                  onClick={() => purchaseShip(shipKey, ship)}
                                  disabled={player.credits < ship.price}
                                  className="text-white hover:text-blue-400 disabled:text-gray-600 text-xs"
                                >
                                  {player.credits >= ship.price ? 'Buy' : 'Too Expensive'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Starport Services */}
                {currentPort.starportServices && Object.keys(currentPort.starportServices).length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-lg text-white mb-2">== STARPORT SERVICES ==</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(currentPort.starportServices).map(([serviceKey, service]) => {
                        const shipyardId = `sector_${player.currentSector}`;
                        const purchasedServices = player.purchasedServices || {};
                        const shipyardServices = purchasedServices[shipyardId] || [];
                        const alreadyPurchased = shipyardServices.includes(serviceKey);
                        const canAfford = player.credits >= service.price;
                        
                        return (
                          <div key={serviceKey} className={`flex justify-between items-center p-2 rounded border ${
                            alreadyPurchased 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-blue-800 border-blue-600'
                          }`}>
                            <div>
                              <div className={`font-medium text-sm ${alreadyPurchased ? 'text-gray-400' : 'text-white'}`}>
                                {service.name} {alreadyPurchased && '✓'}
                              </div>
                              <div className="text-xs text-gray-300">{service.description}</div>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm ${alreadyPurchased ? 'text-gray-500' : 'text-white'}`}>
                                {alreadyPurchased ? 'PURCHASED' : `$${service.price.toLocaleString()}`}
                              </div>
                              {!alreadyPurchased && (
                                <button 
                                  onClick={() => purchaseService(serviceKey, service)}
                                  disabled={!canAfford}
                                  className="text-white hover:text-blue-400 disabled:text-gray-600 text-xs"
                                  data-service={serviceKey}
                                >
                                  {canAfford ? 'Buy' : 'Too Expensive'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-2">
              <p className="text-sm">Refuel Ship (Cost: ${GAME_CONFIG.FUEL_PRICE_PER_UNIT}/unit)</p>
              <div className="flex gap-2 items-center mt-1">
                <Button onClick={() => buyFuel(10)}>Buy 10</Button>
                <Button onClick={() => buyFuel(100)}>Buy 100</Button>
                <Button onClick={() => buyFuel(player.maxFuel - player.fuel)}>Fill Tank</Button>
              </div>
            </div>
        

          </div>
        )}

        {/* Navigation Buttons moved to sidebar */}

        {isAdmin && !universe && (
          <div className="mt-4 text-center">
            <p className="text-yellow-400">Universe not found.</p>
            <AdminPanel onGenerateUniverse={handleGenerateUniverse} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col p-4 sm:p-6 lg:p-8">
       <Header />
      {gameState && gameState.gameEndDate && <CountdownTimer endDate={gameState.gameEndDate} />}
      <main className="flex-grow flex flex-col xl:flex-row gap-6 lg:gap-8 mt-6">
        <div className="xl:w-1/3 2xl:w-1/4 flex flex-col gap-6">
          <ShipDisplay player={player} />
          <div className="bg-black border-2 border-cyan-400 p-4 text-cyan-400 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 pb-2 border-b border-cyan-600">NAVIGATION</h3>
            <div className="flex flex-col gap-3 my-3">
              <Button onClick={() => moveSector(player.currentSector - 1)} disabled={!isGameActive || player.currentSector <= 1}>Prev Sector</Button>
              <Button onClick={() => moveSector(player.currentSector + 1)} disabled={!isGameActive || player.currentSector >= (universe?.sectorCount || GAME_CONFIG.SECTOR_COUNT)}>Next Sector</Button>
            </div>
            <div className="mt-4 pt-3 border-t border-cyan-700">
              <h4 className="text-sm font-medium mb-2">WARP DRIVE</h4>
              <div className="flex gap-2 mb-2">
                <input
                  ref={warpInputRef}
                  type="number"
                  min="1"
                  max={universe?.sectorCount || GAME_CONFIG.SECTOR_COUNT}
                  placeholder="Sector"
                  className="w-20 px-2 py-1.5 text-sm bg-gray-800 border border-cyan-600 text-cyan-400 rounded focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const sector = parseInt(e.target.value);
                      if (sector >= 1 && sector <= (universe?.sectorCount || GAME_CONFIG.SECTOR_COUNT)) {
                        warpToSector(sector);
                        e.target.value = '';
                      }
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    const input = warpInputRef.current;
                    if (!input) return;
                    const sector = parseInt(input.value);
                    if (sector >= 1 && sector <= (universe?.sectorCount || GAME_CONFIG.SECTOR_COUNT)) {
                      warpToSector(sector);
                      input.value = '';
                    }
                  }}
                  disabled={!isGameActive}
                >
                  Warp
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {(player.hull || 100) <= 0 || player.shipType === 'ESCAPE_POD' ? 'Emergency warp: FREE' : `Cost: ${GAME_CONFIG.FUEL_COST_PER_SECTOR * 3} fuel`}
              </p>
            </div>
          </div>
          <div className="bg-black border-2 border-cyan-400 p-4 text-cyan-400 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 pb-2 border-b border-cyan-600">COMMANDS</h3>
            <div className="flex flex-col gap-3">
              <Button onClick={() => setShowHelp(!showHelp)}>{showHelp ? 'Back to Game' : 'Help'}</Button>
              <Button onClick={onSignOut} variant="secondary">Sign Out</Button>
            </div>
          </div>
          <CompanyInterface user={user} player={player} addToLog={addToLog} playSound={playSound} />
          {isAdmin && <AdminPanel onGenerateUniverse={handleGenerateUniverse} onResetUniverse={handleResetUniverse} onSetEndDate={handleSetEndDate} />}
        </div>
        <div className="xl:w-2/3 2xl:w-3/4 flex flex-col gap-6">
          <GameScreen sector={currentSector}>
            <StatusBar player={player} />
            {isGameActive || !gameState?.gameEndDate ? renderCurrentView() : <div className="text-center p-8"><p className="text-lg">The game season has concluded.</p></div>}
          </GameScreen>
          <div className="h-48 bg-black font-mono text-xs border-2 border-green-500 p-4 overflow-y-scroll flex flex-col-reverse rounded-lg">
            <div>
              {log.map((entry, i) => <p key={i} className={entry.color}>{entry.text}</p>)}
            </div>
          </div>
        </div>
      </main>
      <Footer userId={user.uid} />
      
      {/* Achievement Notifications */}
      <AchievementNotification 
        player={player} 
        onAchievementUnlocked={handleAchievementUnlocked} 
      />
      
      {/* Random Event Notifications */}
      {activeEvent && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className={`p-4 rounded-lg border-2 shadow-lg transform transition-all duration-500 ${
            activeEvent.type === 'positive' 
              ? 'bg-green-900 border-green-400 text-green-100' 
              : activeEvent.type === 'challenge'
              ? 'bg-red-900 border-red-400 text-red-100'
              : 'bg-purple-900 border-purple-400 text-purple-100'
          }`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg">{activeEvent.title}</h3>
              <button 
                onClick={() => setActiveEvent(null)}
                className="text-gray-400 hover:text-white ml-2"
              >
                ✕
              </button>
            </div>
            <p className="text-sm mb-3">{activeEvent.description}</p>
            <div className="text-xs font-mono bg-black bg-opacity-30 p-2 rounded">
              {activeEvent.effects}
            </div>
          </div>
        </div>
      )}

      {/* Pirate Combat Interface */}
      {pirateEncounter && (
        <PirateCombat
          pirates={pirateEncounter}
          player={player}
          onCombatEnd={handleCombatEnd}
          onPlayerUpdate={handlePlayerUpdate}
          addToLog={addToLog}
          playSound={playSound}
        />
      )}
    </div>
  );
}
