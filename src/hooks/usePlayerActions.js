import { useCallback } from 'react';
import { getFirestore, doc, runTransaction } from 'firebase/firestore';
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
  LOG_TYPES,
  COMMODITIES
} from '../constants/gameConstants.js';

const VALID_COMMODITY_NAMES = COMMODITIES.map(c => c.name);

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

      const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
      const result = await runTransaction(db, async (transaction) => {
        const playerDoc = await transaction.get(playerRef);
        const fresh = playerDoc.data();

        const fuelCost = calculateMovementFuelCost(fresh, false);
        const inEscapePod = isInEscapePod(fresh);

        if (!inEscapePod) {
          validateFuel(fresh, fuelCost);
        }

        transaction.update(playerRef, {
          currentSector: newSector,
          fuel: fresh.fuel - fuelCost
        });

        return { inEscapePod, fuelRemaining: fresh.fuel - fuelCost };
      });

      const message = result.inEscapePod
        ? `Emergency thrusters engaged! Drifted to sector ${newSector}. No fuel consumed.`
        : `Jumped to sector ${newSector}. Fuel remaining: ${result.fuelRemaining}`;

      addToLog(message, LOG_TYPES.SUCCESS);

    } catch (error) {
      handleError(error, 'Navigation error');
    }
  }, [user.uid, db, addToLog, handleError]);

  const warpToSector = useCallback(async (targetSector) => {
    try {
      validateSector(targetSector);

      const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
      const result = await runTransaction(db, async (transaction) => {
        const playerDoc = await transaction.get(playerRef);
        const fresh = playerDoc.data();

        const fuelCost = calculateMovementFuelCost(fresh, true);
        const inEscapePod = isInEscapePod(fresh);

        if (!inEscapePod) {
          validateFuel(fresh, fuelCost);
        }

        transaction.update(playerRef, {
          currentSector: targetSector,
          fuel: fresh.fuel - fuelCost
        });

        return { inEscapePod, fuelRemaining: fresh.fuel - fuelCost };
      });

      const message = result.inEscapePod
        ? `Emergency warp beacon activated! Warped to sector ${targetSector}. No fuel consumed.`
        : `Warp drive engaged! Warped to sector ${targetSector}. Fuel remaining: ${result.fuelRemaining}`;

      addToLog(message, LOG_TYPES.SUCCESS);

    } catch (error) {
      handleError(error, 'Warp drive error');
    }
  }, [user.uid, db, addToLog, handleError]);

  const buyFuel = useCallback(async (amount) => {
    try {
      validatePositiveAmount(amount, 'fuel amount');

      const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
      const result = await runTransaction(db, async (transaction) => {
        const playerDoc = await transaction.get(playerRef);
        const fresh = playerDoc.data();

        const maxCanBuy = fresh.maxFuel - fresh.fuel;
        const actualAmount = Math.min(amount, maxCanBuy);
        const cost = actualAmount * GAME_CONFIG.FUEL_PRICE_PER_UNIT;

        validateCredits(fresh, cost);

        transaction.update(playerRef, {
          fuel: fresh.fuel + actualAmount,
          credits: fresh.credits - cost
        });

        return { actualAmount, cost };
      });

      addToLog(`Purchased ${result.actualAmount} fuel units for $${result.cost}`, LOG_TYPES.SUCCESS);

    } catch (error) {
      handleError(error, 'Fuel purchase error');
    }
  }, [user.uid, db, addToLog, handleError]);

  const tradeCommodity = useCallback(async (commodityName, type, amount, currentSector) => {
    try {
      validatePositiveAmount(amount, 'trade amount');

      if (!VALID_COMMODITY_NAMES.includes(commodityName)) {
        throw new ValidationError(`Unknown commodity: ${commodityName}`, 'INVALID_COMMODITY');
      }

      if (!currentSector?.port) {
        throw new ValidationError('No trading port available in this sector', 'NO_PORT');
      }

      const portComm = currentSector.port.commodities?.[commodityName];
      if (!portComm) {
        throw new ValidationError(`${commodityName} not available at this port`, 'COMMODITY_UNAVAILABLE');
      }

      const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);

      if (type === 'buy') {
        const cost = portComm.buyPrice * amount;

        const result = await runTransaction(db, async (transaction) => {
          const playerDoc = await transaction.get(playerRef);
          const fresh = playerDoc.data();

          validateCredits(fresh, cost);
          validateCargoSpace(fresh, amount);

          transaction.update(playerRef, {
            credits: fresh.credits - cost,
            [`cargo.${commodityName}`]: (fresh.cargo?.[commodityName] || 0) + amount
          });

          return { cost };
        });

        addToLog(`Bought ${amount} ${commodityName} for $${result.cost}`, LOG_TYPES.SUCCESS);

      } else if (type === 'sell') {
        const revenue = portComm.sellPrice * amount;

        const result = await runTransaction(db, async (transaction) => {
          const playerDoc = await transaction.get(playerRef);
          const fresh = playerDoc.data();

          validateCargo(fresh, commodityName, amount);

          transaction.update(playerRef, {
            credits: fresh.credits + revenue,
            [`cargo.${commodityName}`]: (fresh.cargo?.[commodityName] || 0) - amount
          });

          return { revenue };
        });

        addToLog(`Sold ${amount} ${commodityName} for $${result.revenue}`, LOG_TYPES.SUCCESS);
      }

    } catch (error) {
      handleError(error, 'Trade error');
    }
  }, [user.uid, db, addToLog, handleError]);

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
      const { playerProperty, increment } = upgrade;

      const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
      await runTransaction(db, async (transaction) => {
        const playerDoc = await transaction.get(playerRef);
        const fresh = playerDoc.data();

        validateCredits(fresh, cost);

        const updates = { credits: fresh.credits - cost };
        updates[playerProperty] = (fresh[playerProperty] || 0) + increment;

        transaction.update(playerRef, updates);
      });

      addToLog(`Purchased ${upgrade.name} for $${cost}`, LOG_TYPES.SUCCESS);

    } catch (error) {
      handleError(error, 'Upgrade error');
    }
  }, [user.uid, db, addToLog, handleError]);

  const attackShip = useCallback(async (target) => {
    try {
      if (!target) {
        throw new ValidationError('No target specified', 'NO_TARGET');
      }

      const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
      await runTransaction(db, async (transaction) => {
        const playerDoc = await transaction.get(playerRef);
        const fresh = playerDoc.data();

        validateCombatCooldown(fresh);

        transaction.update(playerRef, {
          lastCombatTimestamp: Date.now()
        });
      });

      const damage = GAME_CONFIG.BASE_WEAPON_DAMAGE + Math.floor(Math.random() * 10);
      addToLog(`Attacking ${target.name}! Dealt ${damage} damage.`, LOG_TYPES.COMBAT_SELF);

    } catch (error) {
      handleError(error, 'Combat error');
    }
  }, [user.uid, db, addToLog, handleError]);

  return {
    moveSector,
    warpToSector,
    buyFuel,
    tradeCommodity,
    purchaseUpgrade,
    attackShip
  };
};
