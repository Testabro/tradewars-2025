import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Game from '../Game.jsx';
import { PIRATE_CONFIG, PIRATE_TYPES } from '../../constants/gameConstants.js';

// Mock Firebase
const {
  mockUpdateDoc,
  mockOnSnapshot,
  mockDoc,
  mockCollection,
  mockQuery,
  mockGetDocs,
} = vi.hoisted(() => ({
  mockUpdateDoc: vi.fn(),
  mockOnSnapshot: vi.fn(),
  mockDoc: vi.fn(),
  mockCollection: vi.fn(),
  mockQuery: vi.fn(),
  mockGetDocs: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: mockDoc,
  updateDoc: mockUpdateDoc,
  onSnapshot: mockOnSnapshot,
  collection: mockCollection,
  query: mockQuery,
  getDocs: mockGetDocs,
  setDoc: vi.fn(),
  writeBatch: vi.fn(),
}));

// Mock animations
vi.mock('../../utils/animations.js', () => ({
  createParticleEffect: vi.fn(),
  createScreenShake: vi.fn(),
  createFloatingText: vi.fn(),
  createPulsingGlow: vi.fn(),
  createMatrixRain: vi.fn(() => vi.fn()), // Return cleanup function
}));

// Mock audio manager
vi.mock('../../hooks/useAudioManager.js', () => ({
  useAudioManager: () => ({
    playSound: vi.fn(),
    preloadSounds: vi.fn(),
  }),
}));

// Mock other hooks
vi.mock('../../hooks/useGameLog.js', () => ({
  useGameLog: () => ({
    log: [],
    addToLog: vi.fn(),
  }),
}));

vi.mock('../../hooks/usePlayerActions.js', () => ({
  usePlayerActions: () => ({}),
}));

vi.mock('../../hooks/useInvestments.js', () => ({
  useInvestments: () => ({}),
}));

describe('Game Component - Pirate Integration Tests', () => {
  let mockUser;
  let mockPlayer;
  let mockUniverse;
  let mockOnSignOut;

  beforeEach(() => {
    mockUser = {
      uid: 'test-user-id',
      email: 'test@example.com',
    };

    mockPlayer = {
      id: 'test-player-id',
      name: 'Test Captain',
      credits: 5000,
      currentSector: 5,
      fuel: 80,
      maxFuel: 100,
      hull: 100,
      shields: 50,
      maxShields: 100,
      holds: 20,
      cargo: {
        Gold: 5,
        Organics: 10,
        Equipment: 3,
        Gemstones: 1,
      },
      weaponLevel: 1,
      lastPirateEncounter: 0,
    };

    mockUniverse = {
      sectorCount: 100,
      sectors: {
        1: { id: 1, name: 'Sector 1', type: 'EMPTY' }, // Dangerous
        2: { id: 2, name: 'Sector 2', type: 'NEBULA' }, // Dangerous
        3: { id: 3, name: 'Sector 3', type: 'EMPTY', port: { name: 'Safe Station' } }, // Safe
        4: { id: 4, name: 'Sector 4', type: 'EMPTY', planet: { classRating: 'M' } }, // Dangerous
        5: { id: 5, name: 'Sector 5', type: 'EMPTY' }, // Dangerous - current sector
      },
    };

    mockOnSignOut = vi.fn();

    // Mock Firebase listeners
    mockOnSnapshot.mockImplementation((ref, callback) => {
      // Simulate different data based on the reference
      if (ref.toString().includes('universe')) {
        callback({ exists: () => true, data: () => mockUniverse });
      } else if (ref.toString().includes('game_state')) {
        callback({ exists: () => false });
      } else if (ref.toString().includes('admins')) {
        callback({ exists: () => false });
      }
      return vi.fn(); // Return unsubscribe function
    });

    mockGetDocs.mockResolvedValue({
      docs: [],
    });

    // Mock timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Pirate Encounter Triggering', () => {
    it('should trigger pirate encounters in dangerous sectors', async () => {
      // Mock high encounter chance
      vi.spyOn(Math, 'random').mockReturnValue(0.05); // Below 0.12 encounter chance

      render(<Game user={mockUser} player={mockPlayer} onSignOut={mockOnSignOut} />);

      // Simulate sector movement to trigger encounter check
      const nextSectorButton = screen.getByText('Next Sector');
      fireEvent.click(nextSectorButton);

      // Fast-forward to trigger pirate encounter check
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        // Should show pirate combat interface
        expect(screen.getByText('⚔️ PIRATE COMBAT ⚔️')).toBeInTheDocument();
      });
    });

    it('should not trigger pirate encounters in safe sectors with ports', async () => {
      // Move player to safe sector
      const safePlayer = { ...mockPlayer, currentSector: 3 };
      
      // Mock high encounter chance (should still not trigger)
      vi.spyOn(Math, 'random').mockReturnValue(0.05);

      render(<Game user={mockUser} player={safePlayer} onSignOut={mockOnSignOut} />);

      const nextSectorButton = screen.getByText('Next Sector');
      fireEvent.click(nextSectorButton);

      vi.advanceTimersByTime(2000);

      // Should not show pirate combat
      expect(screen.queryByText('⚔️ PIRATE COMBAT ⚔️')).not.toBeInTheDocument();
    });

    it('should respect minimum sectors between encounters', async () => {
      // Set last encounter to current sector - 1 (too recent)
      const recentEncounterPlayer = { 
        ...mockPlayer, 
        lastPirateEncounter: mockPlayer.currentSector - 1 
      };

      vi.spyOn(Math, 'random').mockReturnValue(0.05);

      render(<Game user={mockUser} player={recentEncounterPlayer} onSignOut={mockOnSignOut} />);

      const nextSectorButton = screen.getByText('Next Sector');
      fireEvent.click(nextSectorButton);

      vi.advanceTimersByTime(2000);

      // Should not trigger encounter due to cooldown
      expect(screen.queryByText('⚔️ PIRATE COMBAT ⚔️')).not.toBeInTheDocument();
    });

    it('should allow encounters after cooldown period', async () => {
      // Set last encounter to be beyond cooldown
      const oldEncounterPlayer = { 
        ...mockPlayer, 
        lastPirateEncounter: mockPlayer.currentSector - PIRATE_CONFIG.MIN_SECTORS_BETWEEN_ENCOUNTERS - 1 
      };

      vi.spyOn(Math, 'random').mockReturnValue(0.05);

      render(<Game user={mockUser} player={oldEncounterPlayer} onSignOut={mockOnSignOut} />);

      const nextSectorButton = screen.getByText('Next Sector');
      fireEvent.click(nextSectorButton);

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText('⚔️ PIRATE COMBAT ⚔️')).toBeInTheDocument();
      });
    });
  });

  describe('Pirate Generation', () => {
    it('should generate 1-3 pirates per encounter', async () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.05) // Trigger encounter
        .mockReturnValueOnce(0.8); // Generate 2 pirates (0.8 * 3 = 2.4, floor = 2, +1 = 3)

      render(<Game user={mockUser} player={mockPlayer} onSignOut={mockOnSignOut} />);

      const nextSectorButton = screen.getByText('Next Sector');
      fireEvent.click(nextSectorButton);

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        // Should show enemy count
        expect(screen.getByText(/Enemy \d+ of \d+/)).toBeInTheDocument();
      });
    });

    it('should generate pirates with correct stats from PIRATE_TYPES', async () => {
      // Mock to generate a specific pirate type
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.05) // Trigger encounter
        .mockReturnValueOnce(0.0) // Generate 1 pirate
        .mockReturnValueOnce(0.0); // Select first pirate type (RAIDER)

      render(<Game user={mockUser} player={mockPlayer} onSignOut={mockOnSignOut} />);

      const nextSectorButton = screen.getByText('Next Sector');
      fireEvent.click(nextSectorButton);

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        // Should show Raider with correct stats
        expect(screen.getByText('💀 Pirate Raider')).toBeInTheDocument();
        expect(screen.getByText('60/60')).toBeInTheDocument(); // Raider hull
        expect(screen.getByText('30/30')).toBeInTheDocument(); // Raider shields
      });
    });
  });

  describe('Combat Victory Handling', () => {
    it('should award loot and update player stats on victory', async () => {
      // Trigger encounter
      vi.spyOn(Math, 'random').mockReturnValue(0.05);

      render(<Game user={mockUser} player={mockPlayer} onSignOut={mockOnSignOut} />);

      const nextSectorButton = screen.getByText('Next Sector');
      fireEvent.click(nextSectorButton);

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText('⚔️ PIRATE COMBAT ⚔️')).toBeInTheDocument();
      });

      // Attack and defeat pirate
      const attackButton = screen.getByText('⚔️ Attack');
      fireEvent.click(attackButton);

      vi.advanceTimersByTime(PIRATE_CONFIG.COMBAT_COOLDOWN + 2000);

      await waitFor(() => {
        // Should call updateDoc to update player with loot
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            credits: expect.any(Number),
          })
        );
      });
    });

    it('should close combat interface after victory', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.05);

      render(<Game user={mockUser} player={mockPlayer} onSignOut={mockOnSignOut} />);

      const nextSectorButton = screen.getByText('Next Sector');
      fireEvent.click(nextSectorButton);

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText('⚔️ PIRATE COMBAT ⚔️')).toBeInTheDocument();
      });

      // Simulate combat victory
      const attackButton = screen.getByText('⚔️ Attack');
      fireEvent.click(attackButton);

      vi.advanceTimersByTime(PIRATE_CONFIG.COMBAT_COOLDOWN + 3000);

      await waitFor(() => {
        // Combat interface should be closed
        expect(screen.queryByText('⚔️ PIRATE COMBAT ⚔️')).not.toBeInTheDocument();
      });
    });
  });

  describe('Combat Defeat Handling', () => {
    it('should apply penalties on defeat', async () => {
      // Create weak player for easy defeat
      const weakPlayer = { ...mockPlayer, hull: 5, shields: 0 };

      vi.spyOn(Math, 'random').mockReturnValue(0.05);

      render(<Game user={mockUser} player={weakPlayer} onSignOut={mockOnSignOut} />);

      const nextSectorButton = screen.getByText('Next Sector');
      fireEvent.click(nextSectorButton);

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText('⚔️ PIRATE COMBAT ⚔️')).toBeInTheDocument();
      });

      // Wait for pirate to defeat player
      vi.advanceTimersByTime(PIRATE_CONFIG.PIRATE_ATTACK_COOLDOWN + 2000);

      await waitFor(() => {
        // Should apply defeat penalties
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            hull: expect.any(Number),
            credits: expect.any(Number),
          })
        );
      });
    });

    it('should close combat interface after defeat', async () => {
      const weakPlayer = { ...mockPlayer, hull: 5, shields: 0 };

      vi.spyOn(Math, 'random').mockReturnValue(0.05);

      render(<Game user={mockUser} player={weakPlayer} onSignOut={mockOnSignOut} />);

      const nextSectorButton = screen.getByText('Next Sector');
      fireEvent.click(nextSectorButton);

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText('⚔️ PIRATE COMBAT ⚔️')).toBeInTheDocument();
      });

      vi.advanceTimersByTime(PIRATE_CONFIG.PIRATE_ATTACK_COOLDOWN + 3000);

      await waitFor(() => {
        expect(screen.queryByText('⚔️ PIRATE COMBAT ⚔️')).not.toBeInTheDocument();
      });
    });
  });

  describe('Combat Escape Handling', () => {
    it('should close combat interface on successful escape', async () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.05) // Trigger encounter
        .mockReturnValueOnce(0.2); // Successful escape (below 0.3)

      render(<Game user={mockUser} player={mockPlayer} onSignOut={mockOnSignOut} />);

      const nextSectorButton = screen.getByText('Next Sector');
      fireEvent.click(nextSectorButton);

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText('⚔️ PIRATE COMBAT ⚔️')).toBeInTheDocument();
      });

      const escapeButton = screen.getByText('🏃 Escape (30%)');
      fireEvent.click(escapeButton);

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.queryByText('⚔️ PIRATE COMBAT ⚔️')).not.toBeInTheDocument();
      });
    });
  });

  describe('Sector Type Restrictions', () => {
    it('should allow encounters in EMPTY sectors', async () => {
      const emptyPlayer = { ...mockPlayer, currentSector: 1 }; // EMPTY sector
      vi.spyOn(Math, 'random').mockReturnValue(0.05);

      render(<Game user={mockUser} player={emptyPlayer} onSignOut={mockOnSignOut} />);

      const nextSectorButton = screen.getByText('Next Sector');
      fireEvent.click(nextSectorButton);

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText('⚔️ PIRATE COMBAT ⚔️')).toBeInTheDocument();
      });
    });

    it('should allow encounters in NEBULA sectors', async () => {
      const nebulaPlayer = { ...mockPlayer, currentSector: 2 }; // NEBULA sector
      vi.spyOn(Math, 'random').mockReturnValue(0.05);

      render(<Game user={mockUser} player={nebulaPlayer} onSignOut={mockOnSignOut} />);

      const nextSectorButton = screen.getByText('Next Sector');
      fireEvent.click(nextSectorButton);

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText('⚔️ PIRATE COMBAT ⚔️')).toBeInTheDocument();
      });
    });

    it('should allow encounters in planet sectors without ports', async () => {
      const planetPlayer = { ...mockPlayer, currentSector: 4 }; // Planet without port
      vi.spyOn(Math, 'random').mockReturnValue(0.05);

      render(<Game user={mockUser} player={planetPlayer} onSignOut={mockOnSignOut} />);

      const nextSectorButton = screen.getByText('Next Sector');
      fireEvent.click(nextSectorButton);

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText('⚔️ PIRATE COMBAT ⚔️')).toBeInTheDocument();
      });
    });

    it('should prevent encounters in sectors with ports', async () => {
      const portPlayer = { ...mockPlayer, currentSector: 3 }; // Sector with port
      vi.spyOn(Math, 'random').mockReturnValue(0.05);

      render(<Game user={mockUser} player={portPlayer} onSignOut={mockOnSignOut} />);

      const nextSectorButton = screen.getByText('Next Sector');
      fireEvent.click(nextSectorButton);

      vi.advanceTimersByTime(2000);

      // Should not trigger encounter
      expect(screen.queryByText('⚔️ PIRATE COMBAT ⚔️')).not.toBeInTheDocument();
    });
  });

  describe('Database Integration', () => {
    it('should update lastPirateEncounter when encounter triggers', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.05);

      render(<Game user={mockUser} player={mockPlayer} onSignOut={mockOnSignOut} />);

      const nextSectorButton = screen.getByText('Next Sector');
      fireEvent.click(nextSectorButton);

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        // Should update lastPirateEncounter
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            lastPirateEncounter: mockPlayer.currentSector,
          })
        );
      });
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockUpdateDoc.mockRejectedValueOnce(new Error('Database error'));

      vi.spyOn(Math, 'random').mockReturnValue(0.05);

      render(<Game user={mockUser} player={mockPlayer} onSignOut={mockOnSignOut} />);

      const nextSectorButton = screen.getByText('Next Sector');
      fireEvent.click(nextSectorButton);

      vi.advanceTimersByTime(2000);

      // Should not crash the application
      expect(screen.getByText('Next Sector')).toBeInTheDocument();
    });
  });
});
