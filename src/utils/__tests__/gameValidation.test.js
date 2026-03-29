import { describe, it, expect, beforeEach } from 'vitest';
import {
  ValidationError,
  InsufficientResourcesError,
  validateSector,
  validateFuel,
  validateCredits,
  validateCargoSpace,
  validateCargo,
  validateCombatCooldown,
  validatePositiveAmount,
  isInEscapePod,
  getCurrentCargoTotal,
  calculateMovementFuelCost,
  validateInvestmentAmount,
  validateInvestmentType,
  calculateInvestmentCost,
  calculateHourlyReward,
  calculateTradeCommission,
  validateInvestmentEligibility,
  getPlayerOwnership,
  getTotalOwnership,
} from '../gameValidation.js';
import { GAME_CONFIG, INVESTMENT_CONFIG, INVESTMENT_TYPES } from '../../constants/gameConstants.js';

describe('gameValidation', () => {
  let mockPlayer;
  let mockSector;

  beforeEach(() => {
    mockPlayer = {
      id: 'test-player',
      credits: 1000,
      fuel: 100,
      maxFuel: 100,
      hull: 100,
      holds: 10,
      cargo: {
        Gold: 5,
        Organics: 3,
        Equipment: 0,
        Gemstones: 0,
      },
      lastCombatTimestamp: 0,
    };

    mockSector = {
      id: 1,
      port: {
        name: 'Test Station',
        isStarPort: true,
        tradePostInvestments: {
          'player1': 25,
          'player2': 15,
        },
        starPortInvestments: {
          'player1': 10,
        },
      },
    };
  });

  describe('Error Classes', () => {
    it('should create ValidationError with message and code', () => {
      const error = new ValidationError('Test message', 'TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('ValidationError');
      expect(error instanceof Error).toBe(true);
    });

    it('should create InsufficientResourcesError with resource details', () => {
      const error = new InsufficientResourcesError('credits', 500, 100);
      expect(error.message).toBe('Insufficient credits. Required: 500, Available: 100');
      expect(error.code).toBe('INSUFFICIENT_RESOURCES');
      expect(error.resource).toBe('credits');
      expect(error.required).toBe(500);
      expect(error.available).toBe(100);
      expect(error instanceof ValidationError).toBe(true);
    });
  });

  describe('validateSector', () => {
    it('should validate valid sector numbers with default max', () => {
      expect(() => validateSector(1)).not.toThrow();
      expect(() => validateSector(10)).not.toThrow();
      expect(() => validateSector(GAME_CONFIG.SECTOR_COUNT)).not.toThrow();
    });

    it('should validate valid sector numbers with custom max', () => {
      expect(() => validateSector(1, 100)).not.toThrow();
      expect(() => validateSector(50, 100)).not.toThrow();
      expect(() => validateSector(100, 100)).not.toThrow();
    });

    it('should throw error for invalid sector numbers with default max', () => {
      expect(() => validateSector(0)).toThrow(ValidationError);
      expect(() => validateSector(-1)).toThrow(ValidationError);
      expect(() => validateSector(GAME_CONFIG.SECTOR_COUNT + 1)).toThrow(ValidationError);
      expect(() => validateSector(1.5)).toThrow(ValidationError);
      expect(() => validateSector('1')).toThrow(ValidationError);
      expect(() => validateSector(null)).toThrow(ValidationError);
    });

    it('should throw error for invalid sector numbers with custom max', () => {
      expect(() => validateSector(0, 100)).toThrow(ValidationError);
      expect(() => validateSector(-1, 100)).toThrow(ValidationError);
      expect(() => validateSector(101, 100)).toThrow(ValidationError);
      expect(() => validateSector(1.5, 100)).toThrow(ValidationError);
    });

    it('should include sector limits in error message with default max', () => {
      expect(() => validateSector(0)).toThrow(
        `Invalid sector: 0. Must be between 1 and ${GAME_CONFIG.SECTOR_COUNT}`
      );
    });

    it('should include sector limits in error message with custom max', () => {
      expect(() => validateSector(0, 100)).toThrow(
        `Invalid sector: 0. Must be between 1 and 100`
      );
    });
  });

  describe('validateFuel', () => {
    it('should validate sufficient fuel', () => {
      expect(() => validateFuel(mockPlayer, 50)).not.toThrow();
      expect(() => validateFuel(mockPlayer, 100)).not.toThrow();
    });

    it('should throw InsufficientResourcesError for insufficient fuel', () => {
      expect(() => validateFuel(mockPlayer, 150)).toThrow(InsufficientResourcesError);
      
      try {
        validateFuel(mockPlayer, 150);
      } catch (error) {
        expect(error.resource).toBe('fuel');
        expect(error.required).toBe(150);
        expect(error.available).toBe(100);
      }
    });

    it('should throw ValidationError for missing player', () => {
      expect(() => validateFuel(null, 50)).toThrow(ValidationError);
      expect(() => validateFuel(undefined, 50)).toThrow('Player data is required');
    });
  });

  describe('validateCredits', () => {
    it('should validate sufficient credits', () => {
      expect(() => validateCredits(mockPlayer, 500)).not.toThrow();
      expect(() => validateCredits(mockPlayer, 1000)).not.toThrow();
    });

    it('should throw InsufficientResourcesError for insufficient credits', () => {
      expect(() => validateCredits(mockPlayer, 1500)).toThrow(InsufficientResourcesError);
      
      try {
        validateCredits(mockPlayer, 1500);
      } catch (error) {
        expect(error.resource).toBe('credits');
        expect(error.required).toBe(1500);
        expect(error.available).toBe(1000);
      }
    });
  });

  describe('validateCargoSpace', () => {
    it('should validate sufficient cargo space', () => {
      // Current cargo: Gold(5) + Organics(3) = 8, holds = 10, available = 2
      expect(() => validateCargoSpace(mockPlayer, 1)).not.toThrow();
      expect(() => validateCargoSpace(mockPlayer, 2)).not.toThrow();
    });

    it('should throw InsufficientResourcesError for insufficient cargo space', () => {
      expect(() => validateCargoSpace(mockPlayer, 3)).toThrow(InsufficientResourcesError);
      
      try {
        validateCargoSpace(mockPlayer, 3);
      } catch (error) {
        expect(error.resource).toBe('cargo space');
        expect(error.required).toBe(3);
        expect(error.available).toBe(2);
      }
    });

    it('should handle empty cargo', () => {
      const emptyCargoPlayer = { ...mockPlayer, cargo: {} };
      expect(() => validateCargoSpace(emptyCargoPlayer, 10)).not.toThrow();
    });
  });

  describe('validateCargo', () => {
    it('should validate sufficient cargo of specific commodity', () => {
      expect(() => validateCargo(mockPlayer, 'Gold', 3)).not.toThrow();
      expect(() => validateCargo(mockPlayer, 'Gold', 5)).not.toThrow();
      expect(() => validateCargo(mockPlayer, 'Organics', 3)).not.toThrow();
    });

    it('should throw InsufficientResourcesError for insufficient cargo', () => {
      expect(() => validateCargo(mockPlayer, 'Gold', 6)).toThrow(InsufficientResourcesError);
      expect(() => validateCargo(mockPlayer, 'Equipment', 1)).toThrow(InsufficientResourcesError);
      
      try {
        validateCargo(mockPlayer, 'Gold', 6);
      } catch (error) {
        expect(error.resource).toBe('Gold cargo');
        expect(error.required).toBe(6);
        expect(error.available).toBe(5);
      }
    });
  });

  describe('validateCombatCooldown', () => {
    it('should validate when cooldown has elapsed', () => {
      const pastTimestamp = Date.now() - GAME_CONFIG.COMBAT_COOLDOWN - 1000;
      const playerWithPastCombat = { ...mockPlayer, lastCombatTimestamp: pastTimestamp };
      expect(() => validateCombatCooldown(playerWithPastCombat)).not.toThrow();
    });

    it('should validate when no previous combat', () => {
      const playerWithNoCombat = { ...mockPlayer, lastCombatTimestamp: undefined };
      expect(() => validateCombatCooldown(playerWithNoCombat)).not.toThrow();
    });

    it('should throw ValidationError when cooldown is active', () => {
      const recentTimestamp = Date.now() - 5000; // 5 seconds ago
      const playerWithRecentCombat = { ...mockPlayer, lastCombatTimestamp: recentTimestamp };
      
      expect(() => validateCombatCooldown(playerWithRecentCombat)).toThrow(ValidationError);
      
      try {
        validateCombatCooldown(playerWithRecentCombat);
      } catch (error) {
        expect(error.code).toBe('COMBAT_COOLDOWN');
        expect(error.message).toMatch(/Combat cooldown active/);
      }
    });
  });

  describe('validatePositiveAmount', () => {
    it('should validate positive integers', () => {
      expect(() => validatePositiveAmount(1)).not.toThrow();
      expect(() => validatePositiveAmount(100)).not.toThrow();
      expect(() => validatePositiveAmount(1000)).not.toThrow();
    });

    it('should throw ValidationError for invalid amounts', () => {
      expect(() => validatePositiveAmount(0)).toThrow(ValidationError);
      expect(() => validatePositiveAmount(-1)).toThrow(ValidationError);
      expect(() => validatePositiveAmount(1.5)).toThrow(ValidationError);
      expect(() => validatePositiveAmount('1')).toThrow(ValidationError);
    });

    it('should use custom field name in error message', () => {
      try {
        validatePositiveAmount(0, 'investment amount');
      } catch (error) {
        expect(error.message).toMatch(/investment amount must be a positive integer/);
      }
    });
  });

  describe('isInEscapePod', () => {
    it('should return true when hull is 0 or less', () => {
      expect(isInEscapePod({ hull: 0 })).toBe(true);
      expect(isInEscapePod({ hull: -10 })).toBe(true);
    });

    it('should return false when hull is above 0', () => {
      expect(isInEscapePod({ hull: 1 })).toBe(false);
      expect(isInEscapePod({ hull: 50 })).toBe(false);
      expect(isInEscapePod({ hull: 100 })).toBe(false);
    });

    it('should default to 100 hull when not specified', () => {
      expect(isInEscapePod({})).toBe(false);
      expect(isInEscapePod({ hull: undefined })).toBe(false);
    });

    it('should handle null/undefined player', () => {
      expect(isInEscapePod(null)).toBe(false);
      expect(isInEscapePod(undefined)).toBe(false);
    });
  });

  describe('getCurrentCargoTotal', () => {
    it('should calculate total cargo correctly', () => {
      expect(getCurrentCargoTotal(mockPlayer)).toBe(8); // Gold(5) + Organics(3)
    });

    it('should handle empty cargo', () => {
      const emptyCargoPlayer = { cargo: {} };
      expect(getCurrentCargoTotal(emptyCargoPlayer)).toBe(0);
    });

    it('should handle missing cargo property', () => {
      const noCargoPlayer = {};
      expect(getCurrentCargoTotal(noCargoPlayer)).toBe(0);
    });

    it('should handle null/undefined player', () => {
      expect(getCurrentCargoTotal(null)).toBe(0);
      expect(getCurrentCargoTotal(undefined)).toBe(0);
    });
  });

  describe('calculateMovementFuelCost', () => {
    it('should return normal fuel cost for healthy ships', () => {
      const healthyPlayer = { hull: 100 };
      expect(calculateMovementFuelCost(healthyPlayer, false)).toBe(GAME_CONFIG.FUEL_COST_PER_SECTOR);
    });

    it('should return warp fuel cost for healthy ships', () => {
      const healthyPlayer = { hull: 100 };
      const expectedWarpCost = GAME_CONFIG.FUEL_COST_PER_SECTOR * GAME_CONFIG.WARP_FUEL_MULTIPLIER;
      expect(calculateMovementFuelCost(healthyPlayer, true)).toBe(expectedWarpCost);
    });

    it('should return 0 fuel cost for escape pods', () => {
      const escapePodPlayer = { hull: 0 };
      expect(calculateMovementFuelCost(escapePodPlayer, false)).toBe(0);
      expect(calculateMovementFuelCost(escapePodPlayer, true)).toBe(0);
    });
  });

  describe('Investment System Validation', () => {
    describe('validateInvestmentAmount', () => {
      it('should validate amounts at or above minimum', () => {
        expect(() => validateInvestmentAmount(INVESTMENT_CONFIG.MIN_INVESTMENT)).not.toThrow();
        expect(() => validateInvestmentAmount(INVESTMENT_CONFIG.MIN_INVESTMENT + 500)).not.toThrow();
      });

      it('should throw error for amounts below minimum', () => {
        expect(() => validateInvestmentAmount(INVESTMENT_CONFIG.MIN_INVESTMENT - 1)).toThrow(ValidationError);
        expect(() => validateInvestmentAmount(500)).toThrow(ValidationError);
      });

      it('should throw error for non-integer amounts', () => {
        expect(() => validateInvestmentAmount(1000.5)).toThrow(ValidationError);
        expect(() => validateInvestmentAmount('1000')).toThrow(ValidationError);
      });
    });

    describe('validateInvestmentType', () => {
      it('should validate valid investment types', () => {
        expect(() => validateInvestmentType(INVESTMENT_TYPES.TRADE_POST)).not.toThrow();
        expect(() => validateInvestmentType(INVESTMENT_TYPES.STARPORT)).not.toThrow();
      });

      it('should throw error for invalid investment types', () => {
        expect(() => validateInvestmentType('INVALID_TYPE')).toThrow(ValidationError);
        expect(() => validateInvestmentType('')).toThrow(ValidationError);
        expect(() => validateInvestmentType(null)).toThrow(ValidationError);
      });
    });

    describe('calculateInvestmentCost', () => {
      it('should calculate cost for trade post investment', () => {
        const cost = calculateInvestmentCost(INVESTMENT_TYPES.TRADE_POST, 0, 10);
        expect(cost).toBeGreaterThan(0);
        expect(Number.isInteger(cost)).toBe(true);
      });

      it('should calculate higher cost for StarPort investment', () => {
        const tradePostCost = calculateInvestmentCost(INVESTMENT_TYPES.TRADE_POST, 0, 10);
        const starPortCost = calculateInvestmentCost(INVESTMENT_TYPES.STARPORT, 0, 10);
        expect(starPortCost).toBeGreaterThan(tradePostCost);
      });

      it('should increase cost with existing ownership', () => {
        const lowOwnershipCost = calculateInvestmentCost(INVESTMENT_TYPES.TRADE_POST, 0, 10);
        const highOwnershipCost = calculateInvestmentCost(INVESTMENT_TYPES.TRADE_POST, 50, 10);
        expect(highOwnershipCost).toBeGreaterThan(lowOwnershipCost);
      });
    });

    describe('calculateHourlyReward', () => {
      it('should calculate hourly reward for trade post', () => {
        const reward = calculateHourlyReward(INVESTMENT_TYPES.TRADE_POST, 10);
        const expectedReward = INVESTMENT_CONFIG.HOURLY_REWARD_BASE * 
                              INVESTMENT_CONFIG.INVESTMENT_MULTIPLIERS.TRADE_POST * 10;
        expect(reward).toBe(Math.floor(expectedReward));
      });

      it('should calculate higher reward for StarPort', () => {
        const tradePostReward = calculateHourlyReward(INVESTMENT_TYPES.TRADE_POST, 10);
        const starPortReward = calculateHourlyReward(INVESTMENT_TYPES.STARPORT, 10);
        expect(starPortReward).toBeGreaterThan(tradePostReward);
      });

      it('should scale reward with ownership percentage', () => {
        const lowOwnershipReward = calculateHourlyReward(INVESTMENT_TYPES.TRADE_POST, 5);
        const highOwnershipReward = calculateHourlyReward(INVESTMENT_TYPES.TRADE_POST, 20);
        expect(highOwnershipReward).toBeGreaterThan(lowOwnershipReward);
      });
    });

    describe('calculateTradeCommission', () => {
      it('should calculate commission based on trade volume and ownership', () => {
        const tradeVolume = 1000;
        const ownershipPercentage = 25;
        const commission = calculateTradeCommission(tradeVolume, ownershipPercentage);
        
        const expectedCommission = Math.floor(
          tradeVolume * INVESTMENT_CONFIG.TRADE_COMMISSION_RATE * (ownershipPercentage / 100)
        );
        expect(commission).toBe(expectedCommission);
      });

      it('should return 0 for 0% ownership', () => {
        const commission = calculateTradeCommission(1000, 0);
        expect(commission).toBe(0);
      });

      it('should return 0 for 0 trade volume', () => {
        const commission = calculateTradeCommission(0, 25);
        expect(commission).toBe(0);
      });
    });

    describe('validateInvestmentEligibility', () => {
      it('should validate eligible trade post investment', () => {
        expect(() => validateInvestmentEligibility(
          mockPlayer, 
          mockSector, 
          INVESTMENT_TYPES.TRADE_POST
        )).not.toThrow();
      });

      it('should validate eligible StarPort investment', () => {
        expect(() => validateInvestmentEligibility(
          mockPlayer, 
          mockSector, 
          INVESTMENT_TYPES.STARPORT
        )).not.toThrow();
      });

      it('should throw error for missing player', () => {
        expect(() => validateInvestmentEligibility(
          null, 
          mockSector, 
          INVESTMENT_TYPES.TRADE_POST
        )).toThrow(ValidationError);
      });

      it('should throw error for sector without port', () => {
        const sectorWithoutPort = { id: 1 };
        expect(() => validateInvestmentEligibility(
          mockPlayer, 
          sectorWithoutPort, 
          INVESTMENT_TYPES.TRADE_POST
        )).toThrow(ValidationError);
      });

      it('should throw error for StarPort investment without StarPort', () => {
        const sectorWithoutStarPort = {
          ...mockSector,
          port: { ...mockSector.port, isStarPort: false }
        };
        expect(() => validateInvestmentEligibility(
          mockPlayer, 
          sectorWithoutStarPort, 
          INVESTMENT_TYPES.STARPORT
        )).toThrow(ValidationError);
      });
    });

    describe('getPlayerOwnership', () => {
      it('should return player ownership for trade post', () => {
        const ownership = getPlayerOwnership(mockSector, 'player1', INVESTMENT_TYPES.TRADE_POST);
        expect(ownership).toBe(25);
      });

      it('should return player ownership for StarPort', () => {
        const ownership = getPlayerOwnership(mockSector, 'player1', INVESTMENT_TYPES.STARPORT);
        expect(ownership).toBe(10);
      });

      it('should return 0 for player with no investment', () => {
        const ownership = getPlayerOwnership(mockSector, 'player3', INVESTMENT_TYPES.TRADE_POST);
        expect(ownership).toBe(0);
      });

      it('should return 0 for sector without investments', () => {
        const sectorWithoutInvestments = {
          ...mockSector,
          port: { ...mockSector.port, tradePostInvestments: undefined }
        };
        const ownership = getPlayerOwnership(sectorWithoutInvestments, 'player1', INVESTMENT_TYPES.TRADE_POST);
        expect(ownership).toBe(0);
      });
    });

    describe('getTotalOwnership', () => {
      it('should calculate total ownership for trade post', () => {
        const totalOwnership = getTotalOwnership(mockSector, INVESTMENT_TYPES.TRADE_POST);
        expect(totalOwnership).toBe(40); // player1(25) + player2(15)
      });

      it('should calculate total ownership for StarPort', () => {
        const totalOwnership = getTotalOwnership(mockSector, INVESTMENT_TYPES.STARPORT);
        expect(totalOwnership).toBe(10); // player1(10)
      });

      it('should return 0 for facility with no investments', () => {
        const sectorWithoutInvestments = {
          ...mockSector,
          port: { ...mockSector.port, tradePostInvestments: {} }
        };
        const totalOwnership = getTotalOwnership(sectorWithoutInvestments, INVESTMENT_TYPES.TRADE_POST);
        expect(totalOwnership).toBe(0);
      });
    });
  });
});
