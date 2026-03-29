import React, { useState, useRef } from 'react';
import Button from './Button.jsx';
import { GAME_CONFIG } from '../constants/gameConstants.js';
import { isInEscapePod } from '../utils/gameValidation.js';

/**
 * Warp Drive Interface Component
 * Handles warp drive input and validation
 */
const WarpDriveInterface = ({ player, onWarp, disabled = false, maxSector = GAME_CONFIG.SECTOR_COUNT }) => {
  const [sectorInput, setSectorInput] = useState('');
  const inputRef = useRef(null);

  const handleWarp = () => {
    const sector = parseInt(sectorInput);
    if (sector >= 1 && sector <= maxSector) {
      onWarp(sector);
      setSectorInput('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleWarp();
    }
  };

  const inEscapePod = isInEscapePod(player);
  const fuelCost = inEscapePod ? 0 : GAME_CONFIG.FUEL_COST_PER_SECTOR * GAME_CONFIG.WARP_FUEL_MULTIPLIER;

  return (
    <div className="mt-2 pt-2 border-t border-cyan-700">
      <h4 className="text-sm mb-1">WARP DRIVE</h4>
      <div className="flex gap-1 mb-1">
        <input 
          ref={inputRef}
          type="number" 
          min="1" 
          max={maxSector}
          placeholder="Sector" 
          value={sectorInput}
          onChange={(e) => setSectorInput(e.target.value)}
          className="w-16 px-1 py-0 text-xs bg-gray-800 border border-cyan-600 text-cyan-400"
          onKeyPress={handleKeyPress}
          disabled={disabled}
        />
        <Button 
          onClick={handleWarp}
          disabled={disabled || !sectorInput}
        >
          Warp
        </Button>
      </div>
      <p className="text-xs text-gray-400">
        {inEscapePod ? 'Emergency warp: FREE' : `Cost: ${fuelCost} fuel`}
      </p>
    </div>
  );
};

export default WarpDriveInterface;
