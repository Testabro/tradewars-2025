import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SectorDisplay from '../SectorDisplay.jsx';

// Mock the animations module
const mockCreateParticleEffect = vi.fn();
const mockCreateMatrixRain = vi.fn();
const mockCreatePulsingGlow = vi.fn();
const mockCreateFloatingText = vi.fn();

vi.mock('../../utils/animations.js', () => ({
  createParticleEffect: mockCreateParticleEffect,
  createMatrixRain: mockCreateMatrixRain,
  createPulsingGlow: mockCreatePulsingGlow,
  createFloatingText: mockCreateFloatingText,
}));

// Mock HTMLAudioElement
const mockPlay = vi.fn();
const mockAudio = {
  currentTime: 0,
  volume: 0.1,
  play: mockPlay,
};

global.HTMLAudioElement = vi.fn(() => mockAudio);

describe('SectorDisplay Component', () => {
  let mockSector;

  beforeEach(() => {
    mockSector = {
      id: 1,
      name: 'Test Sector',
      type: 'EMPTY',
    };

    // Reset all mocks
    vi.clearAllMocks();
    mockCreateMatrixRain.mockReturnValue(vi.fn()); // Return cleanup function
    mockPlay.mockResolvedValue(undefined); // Successful audio play

    // Mock timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('renders empty sector correctly', () => {
      render(<SectorDisplay sector={mockSector} />);

      expect(screen.getByText('Deep Space')).toBeInTheDocument();
      expect(screen.getByAltText('Deep Space')).toBeInTheDocument();
    });

    it('renders nebula sector with matrix rain effect', () => {
      const nebulaSector = { ...mockSector, type: 'NEBULA' };
      render(<SectorDisplay sector={nebulaSector} />);

      expect(screen.getByText('Nebula')).toBeInTheDocument();
      expect(mockCreateMatrixRain).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          characters: '✦✧✩✪✫⋆',
          fontSize: 12,
          color: '#00ffff',
          speed: 80,
          density: 0.015,
        })
      );
    });

    it('renders planet sector with correct class', () => {
      const planetSector = {
        ...mockSector,
        planet: {
          classRating: 'M',
          type: 'Terran',
        },
      };
      render(<SectorDisplay sector={planetSector} />);

      expect(screen.getByText('Class M Planet')).toBeInTheDocument();
      expect(screen.getByText('🪐')).toBeInTheDocument();
      expect(screen.getByText('M')).toBeInTheDocument();
    });

    it('renders starport sector with special effects', () => {
      const starportSector = {
        ...mockSector,
        port: {
          name: 'Test Starport',
          isStarPort: true,
        },
      };
      render(<SectorDisplay sector={starportSector} />);

      expect(screen.getByText('Orbital Starport')).toBeInTheDocument();
      expect(screen.getByText('⚓')).toBeInTheDocument();
      expect(screen.getByText('Port')).toBeInTheDocument();
    });

    it('renders trading post sector', () => {
      const tradingPostSector = {
        ...mockSector,
        port: {
          name: 'Test Trading Post',
          isTradingPost: true,
        },
      };
      render(<SectorDisplay sector={tradingPostSector} />);

      expect(screen.getByText('Trading Post')).toBeInTheDocument();
    });
  });

  describe('Animation Effects', () => {
    it('triggers particle effects for starport sectors', async () => {
      const starportSector = {
        ...mockSector,
        port: {
          name: 'Test Starport',
          isStarPort: true,
        },
      };
      render(<SectorDisplay sector={starportSector} />);

      // Fast-forward to trigger particle effects
      vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockCreateParticleEffect).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            count: 15,
            colors: ['#00ffff', '#ffffff', '#00ff00'],
            duration: 3000,
            spread: 120,
          })
        );
      });
    });

    it('triggers enhanced particle effects for rare planets', async () => {
      const rarePlanetSector = {
        ...mockSector,
        planet: {
          classRating: 'S', // Rare planet class
          type: 'Exotic',
        },
      };
      render(<SectorDisplay sector={rarePlanetSector} />);

      vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockCreateParticleEffect).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            count: 25,
            colors: ['#ff3cff', '#ff00ff', '#ffff00', '#00ffff'],
            duration: 3000,
            spread: 120,
          })
        );
      });
    });

    it('triggers pulsing glow for special sectors', async () => {
      const starportSector = {
        ...mockSector,
        port: {
          name: 'Test Starport',
          isStarPort: true,
        },
      };
      render(<SectorDisplay sector={starportSector} />);

      vi.advanceTimersByTime(700);

      await waitFor(() => {
        expect(mockCreatePulsingGlow).toHaveBeenCalledWith(
          expect.any(Object),
          '#00ffff',
          2000
        );
      });
    });

    it('creates matrix rain cleanup function for nebula sectors', () => {
      const nebulaSector = { ...mockSector, type: 'NEBULA' };
      const { unmount } = render(<SectorDisplay sector={nebulaSector} />);

      expect(mockCreateMatrixRain).toHaveBeenCalled();

      // Unmount should trigger cleanup
      unmount();
      // The cleanup function should have been called
    });

    it('handles sector changes and cleans up effects', () => {
      const nebulaSector = { ...mockSector, type: 'NEBULA' };
      const { rerender } = render(<SectorDisplay sector={nebulaSector} />);

      expect(mockCreateMatrixRain).toHaveBeenCalledTimes(1);

      // Change to different sector
      const emptySector = { ...mockSector, type: 'EMPTY' };
      rerender(<SectorDisplay sector={emptySector} />);

      // Matrix rain should not be called again for empty sector
      expect(mockCreateMatrixRain).toHaveBeenCalledTimes(1);
    });
  });

  describe('Interactive Features', () => {
    it('handles image click with floating text', () => {
      render(<SectorDisplay sector={mockSector} />);

      const sectorImage = screen.getByAltText('Deep Space');
      fireEvent.click(sectorImage);

      expect(mockCreateFloatingText).toHaveBeenCalledWith(
        expect.any(Object),
        'Deep Space',
        expect.objectContaining({
          color: '#ffffff',
          fontSize: '18px',
          duration: 2500,
        })
      );
    });

    it('handles planet badge click with particle effects', () => {
      const planetSector = {
        ...mockSector,
        planet: {
          classRating: 'M',
          type: 'Terran',
        },
      };
      render(<SectorDisplay sector={planetSector} />);

      const planetBadge = screen.getByText('M');
      fireEvent.click(planetBadge);

      expect(mockCreateParticleEffect).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          count: 8,
          colors: ['#39ff14', '#00ffff'],
          duration: 1500,
          spread: 60,
        })
      );
    });

    it('handles port badge click with particle effects', () => {
      const portSector = {
        ...mockSector,
        port: {
          name: 'Test Port',
          isStarPort: true,
        },
      };
      render(<SectorDisplay sector={portSector} />);

      const portBadge = screen.getByText('Port');
      fireEvent.click(portBadge);

      expect(mockCreateParticleEffect).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          count: 8,
          colors: ['#00ffff', '#ffffff'],
          duration: 1500,
          spread: 60,
        })
      );
    });

    it('shows and hides popover on interactions', async () => {
      const planetSector = {
        ...mockSector,
        planet: {
          classRating: 'M',
          type: 'Terran',
        },
      };
      render(<SectorDisplay sector={planetSector} />);

      const planetBadge = screen.getByText('M');
      fireEvent.click(planetBadge);

      // Popover should appear
      await waitFor(() => {
        expect(screen.getByText(/Planet Class M/)).toBeInTheDocument();
      });

      // Close popover
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText(/Planet Class M/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Audio Handling', () => {
    it('plays audio on sector entry', () => {
      render(<SectorDisplay sector={mockSector} />);

      expect(mockPlay).toHaveBeenCalled();
      expect(mockAudio.volume).toBe(0.1);
      expect(mockAudio.currentTime).toBe(0);
    });

    it('handles audio play errors gracefully', () => {
      // Mock audio play failure
      mockPlay.mockRejectedValueOnce(new Error('Audio play failed'));

      // Should not throw error
      expect(() => {
        render(<SectorDisplay sector={mockSector} />);
      }).not.toThrow();

      expect(mockPlay).toHaveBeenCalled();
    });

    it('resets audio on sector change', () => {
      const { rerender } = render(<SectorDisplay sector={mockSector} />);

      expect(mockPlay).toHaveBeenCalledTimes(1);

      // Change sector
      const newSector = { ...mockSector, id: 2, name: 'New Sector' };
      rerender(<SectorDisplay sector={newSector} />);

      expect(mockAudio.currentTime).toBe(0);
      expect(mockPlay).toHaveBeenCalledTimes(2);
    });
  });

  describe('Special Sector Types', () => {
    it('displays rare planet badge for S-class planets', () => {
      const rarePlanetSector = {
        ...mockSector,
        planet: {
          classRating: 'S',
          type: 'Exotic',
        },
      };
      render(<SectorDisplay sector={rarePlanetSector} />);

      expect(screen.getByText('RARE FIND')).toBeInTheDocument();
    });

    it('displays homeworld badge for homeworld planets', () => {
      const homeworldSector = {
        ...mockSector,
        planet: {
          classRating: 'M',
          type: 'Terran',
          isHomeworld: true,
        },
      };
      render(<SectorDisplay sector={homeworldSector} />);

      expect(screen.getByText('HOMEWORLD')).toBeInTheDocument();
    });

    it('applies correct CSS classes for different sector types', () => {
      const starportSector = {
        ...mockSector,
        port: {
          name: 'Test Starport',
          isStarPort: true,
        },
      };
      render(<SectorDisplay sector={starportSector} />);

      const container = screen.getByText('Orbital Starport').closest('div');
      expect(container).toHaveClass('text-neon-cyan');
    });
  });

  describe('Error Handling', () => {
    it('handles null sector gracefully', () => {
      const { container } = render(<SectorDisplay sector={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('handles undefined sector gracefully', () => {
      const { container } = render(<SectorDisplay sector={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    it('handles sector without required properties', () => {
      const incompleteSector = { id: 1 }; // Missing name and type
      
      expect(() => {
        render(<SectorDisplay sector={incompleteSector} />);
      }).not.toThrow();
    });

    it('handles missing planet properties gracefully', () => {
      const sectorWithIncompletePlanet = {
        ...mockSector,
        planet: {}, // Missing classRating and type
      };

      expect(() => {
        render(<SectorDisplay sector={sectorWithIncompletePlanet} />);
      }).not.toThrow();
    });

    it('handles missing port properties gracefully', () => {
      const sectorWithIncompletePort = {
        ...mockSector,
        port: {}, // Missing name and type flags
      };

      expect(() => {
        render(<SectorDisplay sector={sectorWithIncompletePort} />);
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for interactive elements', () => {
      const planetSector = {
        ...mockSector,
        planet: {
          classRating: 'M',
          type: 'Terran',
        },
      };
      render(<SectorDisplay sector={planetSector} />);

      const planetBadge = screen.getByLabelText(/Planet class M/);
      expect(planetBadge).toBeInTheDocument();
      expect(planetBadge).toHaveAttribute('tabIndex', '0');
    });

    it('supports keyboard navigation for interactive elements', () => {
      const planetSector = {
        ...mockSector,
        planet: {
          classRating: 'M',
          type: 'Terran',
        },
      };
      render(<SectorDisplay sector={planetSector} />);

      const planetBadge = screen.getByLabelText(/Planet class M/);
      
      // Test Enter key
      fireEvent.keyDown(planetBadge, { key: 'Enter' });
      expect(screen.getByText(/Planet Class M/)).toBeInTheDocument();

      // Close and test Space key
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      fireEvent.keyDown(planetBadge, { key: ' ' });
      expect(screen.getByText(/Planet Class M/)).toBeInTheDocument();
    });

    it('provides proper alt text for sector images', () => {
      render(<SectorDisplay sector={mockSector} />);

      const sectorImage = screen.getByAltText('Deep Space');
      expect(sectorImage).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('cleans up effects on unmount', () => {
      const cleanupFn = vi.fn();
      mockCreateMatrixRain.mockReturnValue(cleanupFn);

      const nebulaSector = { ...mockSector, type: 'NEBULA' };
      const { unmount } = render(<SectorDisplay sector={nebulaSector} />);

      unmount();

      // Cleanup should be called
      expect(cleanupFn).toHaveBeenCalled();
    });

    it('handles rapid sector changes without memory leaks', () => {
      const cleanupFn = vi.fn();
      mockCreateMatrixRain.mockReturnValue(cleanupFn);

      const nebulaSector = { ...mockSector, type: 'NEBULA' };
      const { rerender } = render(<SectorDisplay sector={nebulaSector} />);

      // Rapid sector changes
      for (let i = 0; i < 5; i++) {
        const newSector = { ...mockSector, id: i, type: 'EMPTY' };
        rerender(<SectorDisplay sector={newSector} />);
      }

      // Should handle cleanup properly
      expect(cleanupFn).toHaveBeenCalled();
    });
  });
});
