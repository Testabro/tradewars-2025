import { GAME_CONFIG, INVESTMENT_CONFIG, INVESTMENT_TYPES } from '../constants/gameConstants.js';

/**
 * Validation utilities for game operations
 */

export class ValidationError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}

export class InsufficientResourcesError extends ValidationError {
  constructor(resource, required, available) {
    super(`Insufficient ${resource}. Required: ${required}, Available: ${available}`);
    this.code = 'INSUFFICIENT_RESOURCES';
    this.resource = resource;
    this.required = required;
    this.available = available;
  }
}

/**
 * Validates sector number is within valid range
 */
export const validateSector = (sector, maxSector = GAME_CONFIG.SECTOR_COUNT) => {
  if (!Number.isInteger(sector) || sector < 1 || sector > maxSector) {
    throw new ValidationError(
      `Invalid sector: ${sector}. Must be between 1 and ${maxSector}`,
      'INVALID_SECTOR'
    );
  }
  return true;
};

/**
 * Validates player has sufficient fuel for operation
 */
export const validateFuel = (player, requiredFuel) => {
  if (!player) {
    throw new ValidationError('Player data is required', 'MISSING_PLAYER');
  }
  
  if (player.fuel < requiredFuel) {
    throw new InsufficientResourcesError('fuel', requiredFuel, player.fuel);
  }
  
  return true;
};

/**
 * Validates player has sufficient credits for purchase
 */
export const validateCredits = (player, requiredCredits) => {
  if (!player) {
    throw new ValidationError('Player data is required', 'MISSING_PLAYER');
  }
  
  if (player.credits < requiredCredits) {
    throw new InsufficientResourcesError('credits', requiredCredits, player.credits);
  }
  
  return true;
};

/**
 * Validates player has sufficient cargo space
 */
export const validateCargoSpace = (player, requiredSpace) => {
  if (!player) {
    throw new ValidationError('Player data is required', 'MISSING_PLAYER');
  }
  
  const currentCargoTotal = Object.values(player.cargo || {}).reduce((a, b) => a + b, 0);
  const availableSpace = player.holds - currentCargoTotal;
  
  if (availableSpace < requiredSpace) {
    throw new InsufficientResourcesError('cargo space', requiredSpace, availableSpace);
  }
  
  return true;
};

/**
 * Validates player has sufficient cargo of specific commodity
 */
export const validateCargo = (player, commodityName, requiredAmount) => {
  if (!player) {
    throw new ValidationError('Player data is required', 'MISSING_PLAYER');
  }
  
  const availableAmount = player.cargo?.[commodityName] || 0;
  
  if (availableAmount < requiredAmount) {
    throw new InsufficientResourcesError(
      `${commodityName} cargo`, 
      requiredAmount, 
      availableAmount
    );
  }
  
  return true;
};

/**
 * Validates combat cooldown has elapsed
 */
export const validateCombatCooldown = (player) => {
  if (!player) {
    throw new ValidationError('Player data is required', 'MISSING_PLAYER');
  }
  
  const now = Date.now();
  const lastCombat = player.lastCombatTimestamp || 0;
  const timeSinceLastCombat = now - lastCombat;
  
  if (timeSinceLastCombat < GAME_CONFIG.COMBAT_COOLDOWN) {
    const remainingTime = Math.ceil((GAME_CONFIG.COMBAT_COOLDOWN - timeSinceLastCombat) / 1000);
    throw new ValidationError(
      `Combat cooldown active. ${remainingTime} seconds remaining.`,
      'COMBAT_COOLDOWN'
    );
  }
  
  return true;
};

/**
 * Validates amount is positive
 */
export const validatePositiveAmount = (amount, fieldName = 'amount') => {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new ValidationError(
      `${fieldName} must be a positive integer. Received: ${amount}`,
      'INVALID_AMOUNT'
    );
  }
  
  return true;
};

/**
 * Checks if player is in escape pod
 */
export const isInEscapePod = (player) => {
  return (player?.hull ?? 100) <= 0;
};

/**
 * Calculates current cargo total
 */
export const getCurrentCargoTotal = (player) => {
  return Object.values(player?.cargo || {}).reduce((a, b) => a + b, 0);
};

/**
 * Calculates fuel cost for movement (considering escape pod)
 */
export const calculateMovementFuelCost = (player, isWarp = false) => {
  if (isInEscapePod(player)) {
    return 0; // Free movement for escape pods
  }
  
  const baseCost = GAME_CONFIG.FUEL_COST_PER_SECTOR;
  return isWarp ? baseCost * GAME_CONFIG.WARP_FUEL_MULTIPLIER : baseCost;
};

/**
 * Investment System Validation Functions
 */

/**
 * Validates investment amount
 */
export const validateInvestmentAmount = (amount) => {
  if (!Number.isInteger(amount) || amount < INVESTMENT_CONFIG.MIN_INVESTMENT) {
    throw new ValidationError(
      `Investment amount must be at least $${INVESTMENT_CONFIG.MIN_INVESTMENT}`,
      'INVALID_INVESTMENT_AMOUNT'
    );
  }
  return true;
};

/**
 * Validates investment type
 */
export const validateInvestmentType = (type) => {
  if (!Object.values(INVESTMENT_TYPES).includes(type)) {
    throw new ValidationError(
      `Invalid investment type: ${type}`,
      'INVALID_INVESTMENT_TYPE'
    );
  }
  return true;
};

/**
 * Calculates investment cost based on current ownership
 */
export const calculateInvestmentCost = (investmentType, currentOwnership, desiredPercentage) => {
  const multiplier = INVESTMENT_CONFIG.INVESTMENT_MULTIPLIERS[investmentType];
  const baseCost = INVESTMENT_CONFIG.MIN_INVESTMENT;
  
  // Cost increases exponentially with ownership percentage
  const ownershipFactor = Math.pow(1.1, currentOwnership + desiredPercentage);
  
  return Math.floor(baseCost * multiplier * ownershipFactor * desiredPercentage);
};

/**
 * Calculates hourly rewards for investment
 */
export const calculateHourlyReward = (investmentType, ownershipPercentage) => {
  const multiplier = INVESTMENT_CONFIG.INVESTMENT_MULTIPLIERS[investmentType];
  const baseReward = INVESTMENT_CONFIG.HOURLY_REWARD_BASE;
  
  return Math.floor(baseReward * multiplier * ownershipPercentage);
};

/**
 * Calculates trade commission for investors
 */
export const calculateTradeCommission = (tradeVolume, ownershipPercentage) => {
  const commission = tradeVolume * INVESTMENT_CONFIG.TRADE_COMMISSION_RATE;
  return Math.floor(commission * (ownershipPercentage / 100));
};

/**
 * Validates if player can invest in a facility
 */
export const validateInvestmentEligibility = (player, sector, investmentType) => {
  if (!player) {
    throw new ValidationError('Player data is required', 'MISSING_PLAYER');
  }
  
  if (!sector?.port) {
    throw new ValidationError('No facility available in this sector', 'NO_FACILITY');
  }
  
  if (investmentType === INVESTMENT_TYPES.STARPORT && !sector.port.isStarPort) {
    throw new ValidationError('No StarPort available in this sector', 'NO_STARPORT');
  }
  
  return true;
};

/**
 * Gets player's current ownership in a facility
 */
export const getPlayerOwnership = (sector, playerId, investmentType) => {
  const facilityKey = investmentType === INVESTMENT_TYPES.STARPORT ? 'starPortInvestments' : 'tradePostInvestments';
  const investments = sector.port?.[facilityKey] || {};
  return investments[playerId] || 0;
};

/**
 * Gets total ownership percentage for a facility
 */
export const getTotalOwnership = (sector, investmentType) => {
  const facilityKey = investmentType === INVESTMENT_TYPES.STARPORT ? 'starPortInvestments' : 'tradePostInvestments';
  const investments = sector.port?.[facilityKey] || {};
  return Object.values(investments).reduce((total, ownership) => total + ownership, 0);
};
