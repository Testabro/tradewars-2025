import React, { useState } from 'react';
import Button from './Button.jsx';
import { 
  INVESTMENT_TYPES, 
  INVESTMENT_CONFIG 
} from '../constants/gameConstants.js';
import { 
  calculateInvestmentCost,
  calculateHourlyReward,
  getPlayerOwnership,
  getTotalOwnership
} from '../utils/gameValidation.js';

/**
 * Investment Interface Component
 * Handles investment UI for trade posts and StarPorts
 */
const InvestmentInterface = ({ 
  player, 
  sector, 
  onInvest, 
  onCollectRewards, 
  investmentSummary,
  disabled = false 
}) => {
  const [selectedType, setSelectedType] = useState(INVESTMENT_TYPES.TRADE_POST);
  const [investmentPercentage, setInvestmentPercentage] = useState(1);

  if (!sector?.port) return null;

  const currentOwnership = getPlayerOwnership(sector, player.id, selectedType);
  const totalOwnership = getTotalOwnership(sector, selectedType);
  const availableOwnership = INVESTMENT_CONFIG.MAX_OWNERSHIP_PERCENTAGE - totalOwnership;
  const maxPlayerInvestment = Math.min(
    availableOwnership,
    INVESTMENT_CONFIG.MAX_OWNERSHIP_PERCENTAGE - currentOwnership
  );

  const investmentCost = calculateInvestmentCost(selectedType, currentOwnership, investmentPercentage);
  const hourlyReward = calculateHourlyReward(selectedType, investmentPercentage);
  
  const canAfford = player.credits >= investmentCost;
  const canInvest = maxPlayerInvestment > 0 && investmentPercentage <= maxPlayerInvestment;

  const handleInvest = () => {
    if (canAfford && canInvest) {
      onInvest(sector, selectedType, investmentPercentage);
    }
  };

  const isStarPortAvailable = sector.port.isStarPort;

  return (
    <div className="mt-4 border-t-2 border-purple-400 pt-2">
      <h3 className="text-lg text-white mb-2">== INVESTMENT OPPORTUNITIES ==</h3>
      
      {/* Investment Summary */}
      {investmentSummary.facilities.length > 0 && (
        <div className="mb-4 p-2 bg-gray-800 border border-purple-600">
          <h4 className="text-sm text-purple-400 mb-1">YOUR INVESTMENTS</h4>
          <div className="text-xs space-y-1">
            {investmentSummary.facilities.map((facility, index) => (
              <div key={index} className="flex justify-between">
                <span>{facility.facilityName} {facility.type}</span>
                <span className="text-green-400">
                  {facility.ownership}% (${facility.hourlyReward}/hr)
                </span>
              </div>
            ))}
            <div className="border-t border-purple-700 pt-1 mt-1">
              <Button 
                onClick={() => onCollectRewards()}
                disabled={disabled}
                className="w-full text-xs"
              >
                💰 Collect Rewards
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Investment Type Selection */}
      <div className="mb-3">
        <h4 className="text-sm text-purple-400 mb-1">Investment Type</h4>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedType(INVESTMENT_TYPES.TRADE_POST)}
            className={`px-2 py-1 text-xs border ${
              selectedType === INVESTMENT_TYPES.TRADE_POST
                ? 'border-purple-400 bg-purple-900 text-white'
                : 'border-gray-600 text-gray-400'
            }`}
            disabled={disabled}
          >
            Trade Post
          </button>
          <button
            onClick={() => setSelectedType(INVESTMENT_TYPES.STARPORT)}
            className={`px-2 py-1 text-xs border ${
              selectedType === INVESTMENT_TYPES.STARPORT
                ? 'border-purple-400 bg-purple-900 text-white'
                : 'border-gray-600 text-gray-400'
            }`}
            disabled={disabled || !isStarPortAvailable}
          >
            StarPort {!isStarPortAvailable && '(N/A)'}
          </button>
        </div>
      </div>

      {/* Current Ownership Display */}
      <div className="mb-3 text-xs">
        <div className="flex justify-between">
          <span>Your Ownership:</span>
          <span className="text-green-400">{currentOwnership}%</span>
        </div>
        <div className="flex justify-between">
          <span>Total Ownership:</span>
          <span className="text-yellow-400">{totalOwnership}%</span>
        </div>
        <div className="flex justify-between">
          <span>Available:</span>
          <span className="text-cyan-400">{availableOwnership}%</span>
        </div>
      </div>

      {/* Investment Amount Input */}
      {maxPlayerInvestment > 0 && (
        <div className="mb-3">
          <h4 className="text-sm text-purple-400 mb-1">Investment Percentage</h4>
          <div className="flex gap-2 items-center">
            <input
              type="range"
              min="1"
              max={maxPlayerInvestment}
              value={investmentPercentage}
              onChange={(e) => setInvestmentPercentage(parseInt(e.target.value))}
              className="flex-1"
              disabled={disabled}
            />
            <span className="text-white w-8 text-center">{investmentPercentage}%</span>
          </div>
          
          {/* Quick percentage buttons */}
          <div className="flex gap-1 mt-1">
            {[1, 5, 10, 25].filter(pct => pct <= maxPlayerInvestment).map(pct => (
              <button
                key={pct}
                onClick={() => setInvestmentPercentage(pct)}
                className="px-1 py-0 text-xs border border-gray-600 text-gray-400 hover:text-white"
                disabled={disabled}
              >
                {pct}%
              </button>
            ))}
            {maxPlayerInvestment > 25 && (
              <button
                onClick={() => setInvestmentPercentage(maxPlayerInvestment)}
                className="px-1 py-0 text-xs border border-gray-600 text-gray-400 hover:text-white"
                disabled={disabled}
              >
                Max
              </button>
            )}
          </div>
        </div>
      )}

      {/* Investment Details */}
      {maxPlayerInvestment > 0 && (
        <div className="mb-3 p-2 bg-gray-800 border border-purple-600">
          <h4 className="text-sm text-purple-400 mb-1">Investment Details</h4>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Cost:</span>
              <span className={canAfford ? 'text-green-400' : 'text-red-400'}>
                ${investmentCost.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Hourly Reward:</span>
              <span className="text-cyan-400">+${hourlyReward}/hour</span>
            </div>
            <div className="flex justify-between">
              <span>ROI Time:</span>
              <span className="text-yellow-400">
                {Math.ceil(investmentCost / Math.max(hourlyReward, 1))} hours
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Investment Action */}
      {maxPlayerInvestment > 0 ? (
        <Button
          onClick={handleInvest}
          disabled={disabled || !canAfford || !canInvest}
          className="w-full"
        >
          {!canAfford 
            ? 'Insufficient Credits' 
            : !canInvest 
            ? 'Invalid Investment' 
            : `Invest ${investmentPercentage}% for $${investmentCost.toLocaleString()}`
          }
        </Button>
      ) : (
        <div className="text-center text-gray-400 text-xs p-2">
          {totalOwnership >= 100 
            ? 'Facility is fully owned by investors'
            : currentOwnership >= 100
            ? 'You already own the maximum percentage'
            : 'No investment opportunities available'
          }
        </div>
      )}

      {/* Investment Info */}
      <div className="mt-2 text-xs text-gray-400">
        <p>• Investments provide hourly passive income</p>
        <p>• Trade commissions: {(INVESTMENT_CONFIG.TRADE_COMMISSION_RATE * 100)}% of trade volume</p>
        <p>• StarPorts are {INVESTMENT_CONFIG.INVESTMENT_MULTIPLIERS.STARPORT}x more profitable</p>
      </div>
    </div>
  );
};

export default InvestmentInterface;
