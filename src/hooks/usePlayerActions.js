import { useCallback } from 'react';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { 
  validateSector, 
  validateFuel, 
  validateCredits, 
  validateCargoSpace, 
  validateCargo,
  validateCombatCooldown,
  validatePositiveAmount,
  calculateMovementFuelCost,
  isInEscapePod,
  ValidationError,
  InsufficientResourcesError
} from '../utils/gameValidation.js';
import { 
  FIREBASE_PATHS, 
  GAME_CONFIG, 
  SHIP_UPGRADES, 
  LOG_TYPES 
} from '../constants/gameConstants.js';

/**
 * Custom hook for player actions with proper validation and error handling
 */
export const usePlayerActions = (user, player, addToLog) => {
  const db = getFirestore();

  const handleError = useCallback((error, defaultMessage) => {
    console.error('Player action error:', error);
    
    if (error instanceof ValidationError || error instanceof InsufficientResourcesError) {
      addToLog(error.message, LOG_TYPES.WARNING);
    } else {
      addToLog(`${defaultMessage}: ${error.message}`, LOG_TYPES.WARNING);
    }
  }, [addToLog]);

  const moveSector = useCallback(async (newSector) => {
    try {
      validateSector(newSector);
      
      const fuelCost = calculateMovementFuelCost(player, false);
      const inEscapePod = isInEscapePod(player);
      
      if (!inEscapePod) {
        validateFuel(player, fuelCost);
      }

      const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
      const updates = {
        currentSector: newSector,
        fuel: player.fuel - fuelCost
      };
      
      await updateDoc(playerRef, updates);
      
      const message = inEscapePod 
        ? `Emergency thrusters engaged! Drifted to sector ${newSector}. No fuel consumed.`
        : `Jumped to sector ${newSector}. Fuel remaining: ${player.fuel - fuelCost}`;
        
      addToLog(message, LOG_TYPES.SUCCESS);
      
    } catch (error) {
      handleError(error, 'Navigation error');
    }
  }, [player, user.uid, db, addToLog, handleError]);

  const warpToSector = useCallback(async (targetSector) => {
    try {
      validateSector(targetSector);
      
      const fuelCost = calculateMovementFuelCost(player, true);
      const inEscapePod = isInEscapePod(player);
      
      if (!inEscapePod) {
        validateFuel(player, fuelCost);
      }

      const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
      const updates = {
        currentSector: targetSector,
        fuel: player.fuel - fuelCost
      };
      
      await updateDoc(playerRef, updates);
      
      const message = inEscapePod
        ? `Emergency warp beacon activated! Warped to sector ${targetSector}. No fuel consumed.`
        : `Warp drive engaged! Warped to sector ${targetSector}. Fuel remaining: ${player.fuel - fuelCost}`;
        
      addToLog(message, LOG_TYPES.SUCCESS);
      
    } catch (error) {
      handleError(error, 'Warp drive error');
    }
  }, [player, user.uid, db, addToLog, handleError]);

  const buyFuel = useCallback(async (amount) => {
    try {
      validatePositiveAmount(amount, 'fuel amount');
      
      const maxCanBuy = player.maxFuel - player.fuel;
      const actualAmount = Math.min(amount, maxCanBuy);
      const cost = actualAmount * GAME_CONFIG.FUEL_PRICE_PER_UNIT;
      
      validateCredits(player, cost);

      const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
      await updateDoc(playerRef, {
        fuel: player.fuel + actualAmount,
        credits: player.credits - cost
      });
      
      addToLog(`Purchased ${actualAmount} fuel units for $${cost}`, LOG_TYPES.SUCCESS);
      
    } catch (error) {
      handleError(error, 'Fuel purchase error');
    }
  }, [player, user.uid, db, addToLog, handleError]);

  const tradeCommodity = useCallback(async (commodityName, type, amount, currentSector) => {
    try {
      validatePositiveAmount(amount, 'trade amount');
      
      if (!currentSector?.port) {
        throw new ValidationError('No trading port available in this sector', 'NO_PORT');
      }
      
      const portComm = currentSector.port.commodities[commodityName];
      if (!portComm) {
        throw new ValidationError(`${commodityName} not available at this port`, 'COMMODITY_UNAVAILABLE');
      }

      const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
      
      if (type === 'buy') {
        const cost = portComm.buyPrice * amount;
        validateCredits(player, cost);
        validateCargoSpace(player, amount);

        await updateDoc(playerRef, {
          credits: player.credits - cost,
          [`cargo.${commodityName}`]: (player.cargo?.[commodityName] || 0) + amount
        });
        
        addToLog(`Bought ${amount} ${commodityName} for $${cost}`, LOG_TYPES.SUCCESS);
        
      } else if (type === 'sell') {
        validateCargo(player, commodityName, amount);
        
        const revenue = portComm.sellPrice * amount;
        await updateDoc(playerRef, {
          credits: player.credits + revenue,
          [`cargo.${commodityName}`]: (player.cargo?.[commodityName] || 0) - amount
        });
        
        addToLog(`Sold ${amount} ${commodityName} for $${revenue}`, LOG_TYPES.SUCCESS);
      }
      
    } catch (error) {
      handleError(error, 'Trade error');
    }
  }, [player, user.uid, db, addToLog, handleError]);

  const purchaseUpgrade = useCallback(async (upgradeType, currentSector) => {
    try {
      if (!currentSector?.port?.isStarPort) {
        throw new ValidationError('No StarPort available in this sector', 'NO_STARPORT');
      }
      
      const upgrade = SHIP_UPGRADES[upgradeType];
      if (!upgrade) {
        throw new ValidationError(`Invalid upgrade type: ${upgradeType}`, 'INVALID_UPGRADE');
      }

      const cost = upgrade.baseCost;
      validateCredits(player, cost);

      const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
      const updates = { credits: player.credits - cost };
      
      if (upgradeType === 'holds') {
        updates.holds = player.holds + upgrade.increment;
      } else if (upgradeType === 'shields') {
        updates.shields = (player.shields || 0) + upgrade.increment;
        updates.maxShields = (player.maxShields || 0) + upgrade.increment;
      }

      await updateDoc(playerRef, updates);
      addToLog(`Purchased ${upgrade.name} for $${cost}`, LOG_TYPES.SUCCESS);
      
    } catch (error) {
      handleError(error, 'Upgrade error');
    }
  }, [player, user.uid, db, addToLog, handleError]);

  const attackShip = useCallback(async (target) => {
    try {
      if (!target) {
        throw new ValidationError('No target specified', 'NO_TARGET');
      }
      
      validateCombatCooldown(player);

      const damage = GAME_CONFIG.BASE_WEAPON_DAMAGE + Math.floor(Math.random() * 10);
      addToLog(`Attacking ${target.name}! Dealt ${damage} damage.`, LOG_TYPES.COMBAT_SELF);
      
      const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
      await updateDoc(playerRef, {
        lastCombatTimestamp: Date.now()
      });
      
    } catch (error) {
      handleError(error, 'Combat error');
    }
  }, [player, user.uid, db, addToLog, handleError]);

  return {
    moveSector,
    warpToSector,
    buyFuel,
    tradeCommodity,
    purchaseUpgrade,
    attackShip
  };
};
