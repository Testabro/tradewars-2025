import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InvestmentInterface from '../InvestmentInterface.jsx';
import { INVESTMENT_TYPES, INVESTMENT_CONFIG } from '../../constants/gameConstants.js';

// Mock the validation utilities
vi.mock('../../utils/gameValidation.js', () => ({
  calculateInvestmentCost: vi.fn((type, current, desired) => {
    const multiplier = type === 'STARPORT' ? 1.5 : 1.0;
    return Math.floor(1000 * multiplier * Math.pow(1.1, current + desired) * desired);
  }),
  calculateHourlyReward: vi.fn((type, percentage) => {
    const multiplier = type === 'STARPORT' ? 1.5 : 1.0;
    return Math.floor(50 * multiplier * percentage);
  }),
  getPlayerOwnership: vi.fn((sector, playerId, type) => {
    const facilityKey = type === 'STARPORT' ? 'starPortInvestments' : 'tradePostInvestments';
    return sector.port?.[facilityKey]?.[playerId] || 0;
  }),
  getTotalOwnership: vi.fn((sector, type) => {
    const facilityKey = type === 'STARPORT' ? 'starPortInvestments' : 'tradePostInvestments';
    const investments = sector.port?.[facilityKey] || {};
    return Object.values(investments).reduce((total, ownership) => total + ownership, 0);
  }),
}));

describe('InvestmentInterface', () => {
  let mockPlayer;
  let mockSector;
  let mockOnInvest;
  let mockOnCollectRewards;
  let mockInvestmentSummary;
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    
    mockPlayer = {
      id: 'test-player',
      credits: 10000,
    };

    mockSector = {
      id: 1,
      port: {
        name: 'Test Station',
        isStarPort: true,
        tradePostInvestments: {
          'other-player': 20,
        },
        starPortInvestments: {
          'other-player': 15,
        },
      },
    };

    mockOnInvest = vi.fn();
    mockOnCollectRewards = vi.fn();
    
    mockInvestmentSummary = {
      totalInvestments: 25,
      facilities: [
        {
          sectorId: 2,
          sectorName: 'Sector 2',
          facilityName: 'Station 2',
          type: 'Trade Post',
          ownership: 15,
          hourlyReward: 750,
        },
        {
          sectorId: 3,
          sectorName: 'Sector 3',
          facilityName: 'Station 3',
          type: 'StarPort',
          ownership: 10,
          hourlyReward: 750,
        },
      ],
    };
  });

  it('should render investment interface with trade post selected by default', () => {
    render(
      <InvestmentInterface
        player={mockPlayer}
        sector={mockSector}
        onInvest={mockOnInvest}
        onCollectRewards={mockOnCollectRewards}
        investmentSummary={mockInvestmentSummary}
      />
    );

    expect(screen.getByText('== INVESTMENT OPPORTUNITIES ==')).toBeInTheDocument();
    expect(screen.getByText('Trade Post')).toBeInTheDocument();
    expect(screen.getByText('StarPort')).toBeInTheDocument();
  });

  it('should display investment summary when player has investments', () => {
    render(
      <InvestmentInterface
        player={mockPlayer}
        sector={mockSector}
        onInvest={mockOnInvest}
        onCollectRewards={mockOnCollectRewards}
        investmentSummary={mockInvestmentSummary}
      />
    );

    expect(screen.getByText('YOUR INVESTMENTS')).toBeInTheDocument();
    expect(screen.getByText('Station 2 Trade Post')).toBeInTheDocument();
    expect(screen.getByText('Station 3 StarPort')).toBeInTheDocument();
    expect(screen.getByText('15% ($750/hr)')).toBeInTheDocument();
    expect(screen.getByText('10% ($750/hr)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /💰 Collect Rewards/i })).toBeInTheDocument();
  });

  it('should not display investment summary when player has no investments', () => {
    const emptyInvestmentSummary = { totalInvestments: 0, facilities: [] };
    
    render(
      <InvestmentInterface
        player={mockPlayer}
        sector={mockSector}
        onInvest={mockOnInvest}
        onCollectRewards={mockOnCollectRewards}
        investmentSummary={emptyInvestmentSummary}
      />
    );

    expect(screen.queryByText('YOUR INVESTMENTS')).not.toBeInTheDocument();
    expect(screen.queryByText('💰 Collect Rewards')).not.toBeInTheDocument();
  });

  it('should switch between investment types', async () => {
    render(
      <InvestmentInterface
        player={mockPlayer}
        sector={mockSector}
        onInvest={mockOnInvest}
        onCollectRewards={mockOnCollectRewards}
        investmentSummary={mockInvestmentSummary}
      />
    );

    const starPortButton = screen.getByRole('button', { name: /starport/i });
    await user.click(starPortButton);

    expect(starPortButton).toHaveClass('border-purple-400', 'bg-purple-900', 'text-white');
  });

  it('should disable StarPort option when not available', () => {
    const sectorWithoutStarPort = {
      ...mockSector,
      port: { ...mockSector.port, isStarPort: false },
    };

    render(
      <InvestmentInterface
        player={mockPlayer}
        sector={sectorWithoutStarPort}
        onInvest={mockOnInvest}
        onCollectRewards={mockOnCollectRewards}
        investmentSummary={mockInvestmentSummary}
      />
    );

    const starPortButton = screen.getByRole('button', { name: /starport \(n\/a\)/i });
    expect(starPortButton).toBeDisabled();
  });

  it('should display current ownership information', () => {
    render(
      <InvestmentInterface
        player={mockPlayer}
        sector={mockSector}
        onInvest={mockOnInvest}
        onCollectRewards={mockOnCollectRewards}
        investmentSummary={mockInvestmentSummary}
      />
    );

    expect(screen.getByText('Your Ownership:')).toBeInTheDocument();
    expect(screen.getByText('Total Ownership:')).toBeInTheDocument();
    expect(screen.getByText('Available:')).toBeInTheDocument();
  });

  it('should update investment percentage with slider', async () => {
    render(
      <InvestmentInterface
        player={mockPlayer}
        sector={mockSector}
        onInvest={mockOnInvest}
        onCollectRewards={mockOnCollectRewards}
        investmentSummary={mockInvestmentSummary}
      />
    );

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '25' } });

    await waitFor(() => {
      const slider = screen.getByRole('slider');
      expect(slider.value).toBe('25');
    });
  });

  it('should use quick percentage buttons', async () => {
    render(
      <InvestmentInterface
        player={mockPlayer}
        sector={mockSector}
        onInvest={mockOnInvest}
        onCollectRewards={mockOnCollectRewards}
        investmentSummary={mockInvestmentSummary}
      />
    );

    const tenPercentButton = screen.getByRole('button', { name: '10%' });
    await user.click(tenPercentButton);

    await waitFor(() => {
      const slider = screen.getByRole('slider');
      expect(slider.value).toBe('10');
    });
  });

  it('should display investment details with cost and rewards', () => {
    render(
      <InvestmentInterface
        player={mockPlayer}
        sector={mockSector}
        onInvest={mockOnInvest}
        onCollectRewards={mockOnCollectRewards}
        investmentSummary={mockInvestmentSummary}
      />
    );

    expect(screen.getByText('Investment Details')).toBeInTheDocument();
    expect(screen.getByText('Cost:')).toBeInTheDocument();
    expect(screen.getByText('Hourly Reward:')).toBeInTheDocument();
    expect(screen.getByText('ROI Time:')).toBeInTheDocument();
  });

  it('should call onInvest when invest button is clicked', async () => {
    render(
      <InvestmentInterface
        player={mockPlayer}
        sector={mockSector}
        onInvest={mockOnInvest}
        onCollectRewards={mockOnCollectRewards}
        investmentSummary={mockInvestmentSummary}
      />
    );

    const investButton = screen.getByRole('button', { name: /invest \d+% for/i });
    await user.click(investButton);

    expect(mockOnInvest).toHaveBeenCalledWith(
      mockSector,
      INVESTMENT_TYPES.TRADE_POST,
      1 // Default percentage
    );
  });

  it('should call onCollectRewards when collect button is clicked', async () => {
    render(
      <InvestmentInterface
        player={mockPlayer}
        sector={mockSector}
        onInvest={mockOnInvest}
        onCollectRewards={mockOnCollectRewards}
        investmentSummary={mockInvestmentSummary}
      />
    );

    const collectButton = screen.getByRole('button', { name: /💰 Collect Rewards/i });
    await user.click(collectButton);

    expect(mockOnCollectRewards).toHaveBeenCalled();
  });

  it('should disable invest button when player cannot afford investment', () => {
    const poorPlayer = { ...mockPlayer, credits: 100 };

    render(
      <InvestmentInterface
        player={poorPlayer}
        sector={mockSector}
        onInvest={mockOnInvest}
        onCollectRewards={mockOnCollectRewards}
        investmentSummary={mockInvestmentSummary}
      />
    );

    const investButton = screen.getByRole('button', { name: /insufficient credits/i });
    expect(investButton).toBeDisabled();
  });

  it('should disable all controls when disabled prop is true', () => {
    render(
      <InvestmentInterface
        player={mockPlayer}
        sector={mockSector}
        onInvest={mockOnInvest}
        onCollectRewards={mockOnCollectRewards}
        investmentSummary={mockInvestmentSummary}
        disabled={true}
      />
    );

    const tradePostButton = screen.getByRole('button', { name: /trade post/i });
    const slider = screen.getByRole('slider');
    const collectButton = screen.getByRole('button', { name: /💰 Collect Rewards/i });

    expect(tradePostButton).toBeDisabled();
    expect(slider).toBeDisabled();
    expect(collectButton).toBeDisabled();
  });

  it('should display information about investment benefits', () => {
    render(
      <InvestmentInterface
        player={mockPlayer}
        sector={mockSector}
        onInvest={mockOnInvest}
        onCollectRewards={mockOnCollectRewards}
        investmentSummary={mockInvestmentSummary}
      />
    );

    expect(screen.getByText('• Investments provide hourly passive income')).toBeInTheDocument();
    expect(screen.getByText(/• Trade commissions: \d+% of trade volume/)).toBeInTheDocument();
    expect(screen.getByText(/• StarPorts are [\d.]+x more profitable/)).toBeInTheDocument();
  });

  it('should handle sector without port', () => {
    const sectorWithoutPort = { id: 1 };

    const { container } = render(
      <InvestmentInterface
        player={mockPlayer}
        sector={sectorWithoutPort}
        onInvest={mockOnInvest}
        onCollectRewards={mockOnCollectRewards}
        investmentSummary={mockInvestmentSummary}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should show message when facility is fully owned', () => {
    const fullyOwnedSector = {
      ...mockSector,
      port: {
        ...mockSector.port,
        tradePostInvestments: {
          'player1': 60,
          'player2': 40,
        },
      },
    };

    render(
      <InvestmentInterface
        player={mockPlayer}
        sector={fullyOwnedSector}
        onInvest={mockOnInvest}
        onCollectRewards={mockOnCollectRewards}
        investmentSummary={mockInvestmentSummary}
      />
    );

    expect(screen.getByText('Facility is fully owned by investors')).toBeInTheDocument();
  });

  it('should calculate and display ROI time correctly', () => {
    render(
      <InvestmentInterface
        player={mockPlayer}
        sector={mockSector}
        onInvest={mockOnInvest}
        onCollectRewards={mockOnCollectRewards}
        investmentSummary={mockInvestmentSummary}
      />
    );

    // Should show ROI time in hours
    expect(screen.getByText(/\d+ hours/)).toBeInTheDocument();
  });
});
