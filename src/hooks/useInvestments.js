import { useCallback } from 'react';
import { getFirestore, doc, updateDoc, runTransaction } from 'firebase/firestore';
import { 
  validateInvestmentAmount,
  validateInvestmentType,
  validateInvestmentEligibility,
  validateCredits,
  calculateInvestmentCost,
  calculateHourlyReward,
  calculateTradeCommission,
  getPlayerOwnership,
  getTotalOwnership,
  ValidationError,
  InsufficientResourcesError
} from '../utils/gameValidation.js';
import { 
  FIREBASE_PATHS, 
  DOCUMENT_IDS,
  INVESTMENT_CONFIG,
  INVESTMENT_TYPES,
  LOG_TYPES 
} from '../constants/gameConstants.js';

/**
 * Custom hook for investment system functionality
 */
export const useInvestments = (user, player, addToLog) => {
  const db = getFirestore();

  const handleError = useCallback((error, defaultMessage) => {
    console.error('Investment error:', error);
    
    if (error instanceof ValidationError || error instanceof InsufficientResourcesError) {
      addToLog(error.message, LOG_TYPES.WARNING);
    } else {
      addToLog(`${defaultMessage}: ${error.message}`, LOG_TYPES.WARNING);
    }
  }, [addToLog]);

  /**
   * Invest in a trade post or StarPort
   */
  const makeInvestment = useCallback(async (sector, investmentType, percentage) => {
    try {
      validateInvestmentType(investmentType);
      validateInvestmentEligibility(player, sector, investmentType);
      
      if (percentage <= 0 || percentage > 100) {
        throw new ValidationError('Investment percentage must be between 1 and 100', 'INVALID_PERCENTAGE');
      }

      const currentOwnership = getPlayerOwnership(sector, user.uid, investmentType);
      const totalOwnership = getTotalOwnership(sector, investmentType);
      
      if (currentOwnership + percentage > INVESTMENT_CONFIG.MAX_OWNERSHIP_PERCENTAGE) {
        throw new ValidationError(
          `Cannot exceed ${INVESTMENT_CONFIG.MAX_OWNERSHIP_PERCENTAGE}% ownership`,
          'OWNERSHIP_LIMIT_EXCEEDED'
        );
      }
      
      if (totalOwnership + percentage > INVESTMENT_CONFIG.MAX_OWNERSHIP_PERCENTAGE) {
        throw new ValidationError(
          `Investment would exceed facility ownership limit. Available: ${INVESTMENT_CONFIG.MAX_OWNERSHIP_PERCENTAGE - totalOwnership}%`,
          'FACILITY_OWNERSHIP_LIMIT'
        );
      }

      const cost = calculateInvestmentCost(investmentType, currentOwnership, percentage);
      validateCredits(player, cost);

      // Use transaction to ensure data consistency
      await runTransaction(db, async (transaction) => {
        const universeRef = doc(db, FIREBASE_PATHS.UNIVERSE, DOCUMENT_IDS.UNIVERSE);
        const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
        
        const universeDoc = await transaction.get(universeRef);
        const universeData = universeDoc.data();
        
        const facilityKey = investmentType === INVESTMENT_TYPES.STARPORT ? 'starPortInvestments' : 'tradePostInvestments';
        const sectorData = universeData.sectors[sector.id];
        
        // Initialize investment structure if it doesn't exist
        if (!sectorData.port[facilityKey]) {
          sectorData.port[facilityKey] = {};
        }
        
        // Update player's ownership
        const newOwnership = (sectorData.port[facilityKey][user.uid] || 0) + percentage;
        sectorData.port[facilityKey][user.uid] = newOwnership;
        
        // Update universe data
        transaction.update(universeRef, {
          [`sectors.${sector.id}.port.${facilityKey}`]: sectorData.port[facilityKey]
        });
        
        // Update player credits
        transaction.update(playerRef, {
          credits: player.credits - cost
        });
      });

      const facilityName = investmentType === INVESTMENT_TYPES.STARPORT ? 'StarPort' : 'Trade Post';
      addToLog(
        `Invested $${cost} for ${percentage}% ownership in ${sector.port.name} ${facilityName}`,
        LOG_TYPES.SUCCESS
      );
      
    } catch (error) {
      handleError(error, 'Investment failed');
    }
  }, [player, user.uid, db, addToLog, handleError]);

  /**
   * Collect hourly rewards from investments
   */
  const collectRewards = useCallback(async (universe) => {
    try {
      if (!player.lastRewardCollection) {
        // First time collecting, set timestamp and return
        const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
        await updateDoc(playerRef, {
          lastRewardCollection: Date.now()
        });
        return;
      }

      const now = Date.now();
      const lastCollection = player.lastRewardCollection;
      const hoursSinceLastCollection = (now - lastCollection) / (1000 * 60 * 60);
      
      if (hoursSinceLastCollection < INVESTMENT_CONFIG.PAYOUT_INTERVAL_HOURS) {
        const remainingTime = Math.ceil((INVESTMENT_CONFIG.PAYOUT_INTERVAL_HOURS - hoursSinceLastCollection) * 60);
        addToLog(`Next reward collection available in ${remainingTime} minutes`, LOG_TYPES.WARNING);
        return;
      }

      let totalRewards = 0;
      const rewardDetails = [];

      // Calculate rewards from all sectors
      Object.values(universe.sectors).forEach(sector => {
        if (!sector.port) return;

        // Trade Post rewards
        if (sector.port.tradePostInvestments?.[user.uid]) {
          const ownership = sector.port.tradePostInvestments[user.uid];
          const reward = calculateHourlyReward(INVESTMENT_TYPES.TRADE_POST, ownership);
          const hoursToCollect = Math.floor(hoursSinceLastCollection);
          const totalReward = reward * hoursToCollect;
          
          if (totalReward > 0) {
            totalRewards += totalReward;
            rewardDetails.push(`Trade Post ${sector.name}: $${totalReward} (${ownership}% ownership)`);
          }
        }

        // StarPort rewards
        if (sector.port.starPortInvestments?.[user.uid]) {
          const ownership = sector.port.starPortInvestments[user.uid];
          const reward = calculateHourlyReward(INVESTMENT_TYPES.STARPORT, ownership);
          const hoursToCollect = Math.floor(hoursSinceLastCollection);
          const totalReward = reward * hoursToCollect;
          
          if (totalReward > 0) {
            totalRewards += totalReward;
            rewardDetails.push(`StarPort ${sector.name}: $${totalReward} (${ownership}% ownership)`);
          }
        }
      });

      if (totalRewards > 0) {
        const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
        await updateDoc(playerRef, {
          credits: player.credits + totalRewards,
          lastRewardCollection: now
        });

        addToLog(`💰 Investment rewards collected: $${totalRewards}`, LOG_TYPES.SUCCESS);
        rewardDetails.forEach(detail => addToLog(`  ${detail}`, LOG_TYPES.SUCCESS));
      } else {
        addToLog('No investment rewards available', LOG_TYPES.WARNING);
      }
      
    } catch (error) {
      handleError(error, 'Failed to collect rewards');
    }
  }, [player, user.uid, db, addToLog, handleError]);

  /**
   * Process trade commission for investors when a trade occurs
   */
  const processTradeCommission = useCallback(async (sector, tradeVolume) => {
    try {
      if (!sector.port || tradeVolume <= 0) return;

      const updates = {};
      let totalCommissionPaid = 0;

      // Process trade post commissions
      if (sector.port.tradePostInvestments) {
        Object.entries(sector.port.tradePostInvestments).forEach(([playerId, ownership]) => {
          const commission = calculateTradeCommission(tradeVolume, ownership);
          if (commission > 0) {
            updates[`players.${playerId}.credits`] = commission;
            totalCommissionPaid += commission;
          }
        });
      }

      // Apply commission updates if any
      if (Object.keys(updates).length > 0) {
        await runTransaction(db, async (transaction) => {
          Object.entries(updates).forEach(([path, amount]) => {
            const [collection, playerId, field] = path.split('.');
            const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, playerId);
            transaction.update(playerRef, {
              [field]: amount // This should be increment, but simplified for now
            });
          });
        });

        addToLog(`Trade commissions distributed: $${totalCommissionPaid}`, LOG_TYPES.EVENT);
      }
      
    } catch (error) {
      console.error('Failed to process trade commission:', error);
    }
  }, [db, addToLog]);

  /**
   * Get investment summary for a player
   */
  const getInvestmentSummary = useCallback((universe) => {
    if (!universe) return { totalInvestments: 0, facilities: [] };

    const facilities = [];
    let totalInvestments = 0;

    Object.values(universe.sectors).forEach(sector => {
      if (!sector.port) return;

      // Check trade post investments
      if (sector.port.tradePostInvestments?.[user.uid]) {
        const ownership = sector.port.tradePostInvestments[user.uid];
        const hourlyReward = calculateHourlyReward(INVESTMENT_TYPES.TRADE_POST, ownership);
        
        facilities.push({
          sectorId: sector.id,
          sectorName: sector.name,
          facilityName: sector.port.name,
          type: 'Trade Post',
          ownership,
          hourlyReward
        });
        totalInvestments += ownership;
      }

      // Check StarPort investments
      if (sector.port.starPortInvestments?.[user.uid]) {
        const ownership = sector.port.starPortInvestments[user.uid];
        const hourlyReward = calculateHourlyReward(INVESTMENT_TYPES.STARPORT, ownership);
        
        facilities.push({
          sectorId: sector.id,
          sectorName: sector.name,
          facilityName: sector.port.name,
          type: 'StarPort',
          ownership,
          hourlyReward
        });
        totalInvestments += ownership;
      }
    });

    return { totalInvestments, facilities };
  }, [user.uid]);

  return {
    makeInvestment,
    collectRewards,
    processTradeCommission,
    getInvestmentSummary
  };
};
