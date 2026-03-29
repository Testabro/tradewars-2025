import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PirateCombat from '../PirateCombat.jsx';
import { PIRATE_TYPES, PIRATE_CONFIG, PIRATE_MESSAGES } from '../../constants/gameConstants.js';

// Mock the animations module
vi.mock('../../utils/animations.js', () => ({
  createParticleEffect: vi.fn(),
  createScreenShake: vi.fn(),
  createFloatingText: vi.fn(),
  createRippleEffect: vi.fn(),
  createPulsingGlow: vi.fn(),
  createMatrixRain: vi.fn(() => vi.fn()), // Return cleanup function
}));

describe('PirateCombat Component', () => {
  let mockProps;
  let mockPirates;
  let mockPlayer;

  beforeEach(() => {
    // Create mock pirates based on actual pirate types
    mockPirates = [
      {
        ...PIRATE_TYPES.RAIDER,
        id: 'pirate_1',
        hull: PIRATE_TYPES.RAIDER.hull,
        shields: PIRATE_TYPES.RAIDER.shields,
        maxHull: PIRATE_TYPES.RAIDER.hull,
        maxShields: PIRATE_TYPES.RAIDER.shields,
      },
      {
        ...PIRATE_TYPES.CORSAIR,
        id: 'pirate_2',
        hull: PIRATE_TYPES.CORSAIR.hull,
        shields: PIRATE_TYPES.CORSAIR.shields,
        maxHull: PIRATE_TYPES.CORSAIR.hull,
        maxShields: PIRATE_TYPES.CORSAIR.shields,
      }
    ];

    mockPlayer = {
      hull: 100,
      shields: 50,
      maxShields: 100,
      credits: 5000,
      fuel: 80,
      maxFuel: 100,
      cargo: {
        Gold: 5,
        Organics: 10,
        Equipment: 3,
        Gemstones: 1,
      },
      weaponLevel: 1,
    };

    mockProps = {
      pirates: mockPirates,
      player: mockPlayer,
      onCombatEnd: vi.fn(),
      onPlayerUpdate: vi.fn(),
      addToLog: vi.fn(),
      playSound: vi.fn(),
    };

    // Mock timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders combat interface with pirate and player status', () => {
      render(<PirateCombat {...mockProps} />);

      // Check if combat interface is rendered
      expect(screen.getByText('⚔️ PIRATE COMBAT ⚔️')).toBeInTheDocument();
      expect(screen.getByText('Enemy 1 of 2')).toBeInTheDocument();

      // Check player status
      expect(screen.getByText('🚀 Your Ship')).toBeInTheDocument();
      expect(screen.getByText('100/100')).toBeInTheDocument(); // Hull
      expect(screen.getByText('50/100')).toBeInTheDocument(); // Shields

      // Check pirate status
      expect(screen.getByText('💀 Pirate Raider')).toBeInTheDocument();
      expect(screen.getByText('60/60')).toBeInTheDocument(); // Pirate hull
      expect(screen.getByText('30/30')).toBeInTheDocument(); // Pirate shields
    });

    it('renders combat actions during player turn', () => {
      render(<PirateCombat {...mockProps} />);

      expect(screen.getByText('⚔️ Attack')).toBeInTheDocument();
      expect(screen.getByText('🏃 Escape (30%)')).toBeInTheDocument();
    });

    it('displays combat log', () => {
      render(<PirateCombat {...mockProps} />);

      // Combat log should be present
      const combatLogContainer = screen.getByLabelText(/combat log/i);
      expect(combatLogContainer).toBeInTheDocument();
    });
  });

  describe('Combat Mechanics', () => {
    it('handles player attack action', async () => {
      render(<PirateCombat {...mockProps} />);

      const attackButton = screen.getByRole('button', { name: /attack/i });
      fireEvent.click(attackButton);

      // Should disable button during cooldown
      expect(attackButton).toBeDisabled();

      // Should call playSound
      expect(mockProps.playSound).toHaveBeenCalled();

      // Should add combat log entry
      expect(mockProps.addToLog).toHaveBeenCalled();
    });

    it('handles escape attempt', async () => {
      // Mock successful escape
      vi.spyOn(Math, 'random').mockReturnValue(0.2); // Below 0.3 escape chance

      render(<PirateCombat {...mockProps} />);

      const escapeButton = screen.getByRole('button', { name: /escape/i });
      fireEvent.click(escapeButton);

      // Should disable button during cooldown
      expect(escapeButton).toBeDisabled();

      // Should eventually call onCombatEnd with 'ESCAPED'
      await waitFor(() => {
        expect(mockProps.onCombatEnd).toHaveBeenCalledWith('ESCAPED');
      }, { timeout: 2000 });
    });

    it('handles failed escape attempt', async () => {
      // Mock failed escape
      vi.spyOn(Math, 'random').mockReturnValue(0.8); // Above 0.3 escape chance

      render(<PirateCombat {...mockProps} />);

      const escapeButton = screen.getByRole('button', { name: /escape/i });
      fireEvent.click(escapeButton);

      // Should show failed escape message in combat log
      await waitFor(() => {
        expect(screen.getByText(/Escape failed/)).toBeInTheDocument();
      });
    });

    it('calculates damage correctly', async () => {
      render(<PirateCombat {...mockProps} />);

      // Access the component's damage calculation through attack
      const attackButton = screen.getByRole('button', { name: /attack/i });
      fireEvent.click(attackButton);

      // Wait for combat log to update
      await waitFor(() => {
        expect(screen.getByText(/You attack for \d+ damage!/)).toBeInTheDocument();
      });
    });
  });

  describe('Combat Flow', () => {
    it('progresses to next pirate after defeating current one', async () => {
      // Mock high damage to ensure pirate dies in one hit
      vi.spyOn(Math, 'random').mockReturnValue(0.9); // High damage multiplier

      render(<PirateCombat {...mockProps} />);

      // Attack until pirate is defeated
      const attackButton = screen.getByRole('button', { name: /attack/i });
      fireEvent.click(attackButton);

      // Fast-forward timers to complete combat action
      vi.advanceTimersByTime(PIRATE_CONFIG.COMBAT_COOLDOWN + 1000);

      await waitFor(() => {
        // Should show next enemy message
        expect(screen.getByText('Enemy 2 of 2')).toBeInTheDocument();
        expect(screen.getByText('💀 Pirate Corsair')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('ends combat when all pirates are defeated', async () => {
      // Use single pirate for easier testing
      const singlePirateProps = {
        ...mockProps,
        pirates: [mockPirates[0]]
      };

      // Mock high damage to ensure pirate dies quickly
      vi.spyOn(Math, 'random').mockReturnValue(0.9);

      render(<PirateCombat {...singlePirateProps} />);

      const attackButton = screen.getByRole('button', { name: /attack/i });
      fireEvent.click(attackButton);

      // Fast-forward timers
      vi.advanceTimersByTime(PIRATE_CONFIG.COMBAT_COOLDOWN + 3000);

      await waitFor(() => {
        expect(mockProps.onCombatEnd).toHaveBeenCalledWith('VICTORY');
      }, { timeout: 5000 });
    });

    it('handles player defeat', async () => {
      // Create player with low hull
      const weakPlayerProps = {
        ...mockProps,
        player: { ...mockPlayer, hull: 5, shields: 0 }
      };

      // Mock high damage from pirate
      vi.spyOn(Math, 'random').mockReturnValue(0.9);

      render(<PirateCombat {...weakPlayerProps} />);

      // Trigger player attack to start combat flow
      const attackButton = screen.getByRole('button', { name: /attack/i });
      fireEvent.click(attackButton);

      // Fast-forward through combat cooldown and pirate attack
      vi.advanceTimersByTime(PIRATE_CONFIG.COMBAT_COOLDOWN + PIRATE_CONFIG.PIRATE_ATTACK_COOLDOWN + 1000);

      await waitFor(() => {
        expect(mockProps.onCombatEnd).toHaveBeenCalledWith('DEFEAT');
      }, { timeout: 5000 });
    });
  });

  describe('Loot System', () => {
    it('awards loot when pirate is defeated', async () => {
      const singlePirateProps = {
        ...mockProps,
        pirates: [mockPirates[0]]
      };

      // Mock high damage to ensure pirate dies
      vi.spyOn(Math, 'random').mockReturnValue(0.9);

      render(<PirateCombat {...singlePirateProps} />);

      const attackButton = screen.getByRole('button', { name: /attack/i });
      fireEvent.click(attackButton);

      // Fast-forward to complete combat
      vi.advanceTimersByTime(PIRATE_CONFIG.COMBAT_COOLDOWN + 3000);

      await waitFor(() => {
        // Should call onPlayerUpdate with loot rewards
        expect(mockProps.onPlayerUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            credits: expect.any(Number)
          })
        );
      }, { timeout: 5000 });
    });

    it('awards credits within expected range for pirate type', async () => {
      const singlePirateProps = {
        ...mockProps,
        pirates: [mockPirates[0]] // Raider: 500-1500 credits
      };

      // Mock high damage to ensure pirate dies
      vi.spyOn(Math, 'random').mockReturnValue(0.9);

      render(<PirateCombat {...singlePirateProps} />);

      const attackButton = screen.getByRole('button', { name: /attack/i });
      fireEvent.click(attackButton);

      vi.advanceTimersByTime(PIRATE_CONFIG.COMBAT_COOLDOWN + 3000);

      await waitFor(() => {
        const updateCall = mockProps.onPlayerUpdate.mock.calls[0][0];
        const creditsAwarded = updateCall.credits - mockPlayer.credits;
        
        // Should be within Raider loot range
        expect(creditsAwarded).toBeGreaterThanOrEqual(500);
        expect(creditsAwarded).toBeLessThanOrEqual(1500);
      }, { timeout: 5000 });
    });
  });

  describe('Audio and Visual Effects', () => {
    it('plays encounter sound on initialization', () => {
      render(<PirateCombat {...mockProps} />);

      expect(mockProps.playSound).toHaveBeenCalledWith('WARNING');
      expect(mockProps.addToLog).toHaveBeenCalledWith(
        expect.stringMatching(/Pirates decloak|Pirate vessels detected|ALERT: Hostile ships|Pirates emerge|Enemy ships drop/),
        expect.any(String)
      );
    });

    it('plays appropriate sounds during combat', async () => {
      render(<PirateCombat {...mockProps} />);

      const attackButton = screen.getByRole('button', { name: /attack/i });
      fireEvent.click(attackButton);

      // Should play attack sound
      await waitFor(() => {
        const soundCalls = mockProps.playSound.mock.calls;
        const attackSoundCall = soundCalls.find(call => 
          call[0] === 'ACHIEVEMENT' || call[0] === 'TRADE_SUCCESS'
        );
        expect(attackSoundCall).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles empty pirates array gracefully', () => {
      const emptyPiratesProps = {
        ...mockProps,
        pirates: []
      };

      const { container } = render(<PirateCombat {...emptyPiratesProps} />);
      expect(container.firstChild).toBeNull();
    });

    it('handles null pirates gracefully', () => {
      const nullPiratesProps = {
        ...mockProps,
        pirates: null
      };

      const { container } = render(<PirateCombat {...nullPiratesProps} />);
      expect(container.firstChild).toBeNull();
    });

    it('handles missing player data gracefully', () => {
      const noPlayerProps = {
        ...mockProps,
        player: null
      };

      expect(() => render(<PirateCombat {...noPlayerProps} />)).not.toThrow();
    });
  });

  describe('Combat State Management', () => {
    it('correctly manages turn states', async () => {
      render(<PirateCombat {...mockProps} />);

      // Should start with player turn
      expect(screen.getByRole('button', { name: /attack/i })).toBeInTheDocument();

      // Attack to trigger pirate turn
      const attackButton = screen.getByRole('button', { name: /attack/i });
      fireEvent.click(attackButton);

      // Should show pirate turn indicator
      await waitFor(() => {
        expect(screen.getByText('💀 Pirate preparing to attack...')).toBeInTheDocument();
      });
    });

    it('respects combat cooldowns', async () => {
      render(<PirateCombat {...mockProps} />);

      const attackButton = screen.getByRole('button', { name: /attack/i });
      fireEvent.click(attackButton);

      // Button should be disabled during cooldown
      expect(attackButton).toBeDisabled();

      // Fast-forward past cooldown
      vi.advanceTimersByTime(PIRATE_CONFIG.COMBAT_COOLDOWN);

      // Button should be enabled again (if still player turn)
      await waitFor(() => {
        const currentAttackButton = screen.queryByRole('button', { name: /attack/i });
        if (currentAttackButton) {
          expect(currentAttackButton).not.toBeDisabled();
        }
      });
    });
  });
});
