# TradeWars 2025

A modern web-based space trading game built with React, Firebase, and Vite. Navigate the galaxy, trade commodities, upgrade your ship, and build your trading empire in this multiplayer space adventure.

## Game Overview

TradeWars 2025 is a real-time multiplayer space trading simulation where players:

- **Trade Commodities**: Buy low, sell high across different sectors
- **Upgrade Ships**: Enhance cargo holds, shields, and other ship systems
- **Invest in Infrastructure**: Own shares in trade posts and StarPorts for passive income
- **Combat System**: Engage in ship-to-ship combat with other players
- **Warp Drive**: Fast travel across sectors (at a fuel cost)
- **Seasonal Gameplay**: Compete in time-limited seasons with leaderboards

## Technology Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Testing**: Vitest + Testing Library
- **Deployment**: Firebase Hosting

## Game Features

### Core Gameplay
- **Sector Navigation**: Move between 1000+ sectors in the galaxy
- **Port Trading**: Buy and sell commodities at space stations
- **Ship Upgrades**: Visit StarPorts to enhance your vessel
- **Fuel Management**: Strategic fuel consumption for movement and warp jumps
- **Cargo Management**: Optimize cargo space for maximum profit

### Advanced Features
- **Investment System**: Own percentages of trade posts and StarPorts
- **Combat System**: Attack other players with cooldown mechanics
- **Escape Pod System**: Survive ship destruction with emergency systems
- **Nebula Sectors**: Special sectors with unique properties
- **Real-time Multiplayer**: See other players in your current sector
- **Admin Panel**: Universe generation and game management tools

### Investment Mechanics
- **Trade Posts**: Generate income from trade commissions
- **StarPorts**: Higher investment cost but more profitable returns
- **Ownership Percentages**: Buy shares in facilities for passive income
- **Hourly Rewards**: Collect accumulated profits from your investments

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project with Firestore enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tradewars-2025
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore Database
   - Enable Authentication (Email/Password)

4. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   # Fill in your Firebase credentials in .env.local
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Access the Game**
   - Open http://localhost:5173
   - Create an account and start trading!

## Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Test Structure
- **Unit Tests**: Individual component and utility testing
- **Integration Tests**: Hook and service integration testing
- **Mocked Firebase**: Tests run with Firebase mocks for reliability

## Project Structure

```
src/
├── components/          # React components
│   ├── Game.jsx        # Main game component
│   ├── GameScreen.jsx  # Game display area
│   ├── ShipDisplay.jsx # Player ship status
│   ├── InvestmentInterface.jsx # Investment UI
│   └── __tests__/      # Component tests
├── hooks/              # Custom React hooks
│   ├── useGameLog.js   # Game logging system
│   ├── usePlayerActions.js # Player action handlers
│   ├── useInvestments.js # Investment system
│   └── __tests__/      # Hook tests
├── utils/              # Utility functions
│   ├── gameValidation.js # Game logic validation
│   └── __tests__/      # Utility tests
├── constants/          # Game configuration
│   └── gameConstants.js # All game constants
└── assets/            # Static assets
```

## Game Mechanics

### Trading System
- **Commodities**: Food, Ore, Equipment, Fuel Ore, Organics, Equipment
- **Price Fluctuation**: Dynamic pricing based on supply/demand
- **Cargo Limits**: Strategic decisions on what to carry
- **Profit Optimization**: Find the best trade routes

### Ship Systems
- **Hull Points**: Ship durability (0 HP triggers escape pod)
- **Shields**: Defensive systems upgradeable at StarPorts
- **Cargo Holds**: Expandable storage capacity
- **Fuel Tank**: Determines travel range
- **Escape Pod**: Emergency survival system

### Combat Mechanics
- **Attack System**: Deal damage to other players
- **Cooldown Timer**: Prevents spam attacks
- **Hull Damage**: Reduce enemy ship integrity
- **Escape Pod Activation**: Automatic when hull reaches 0

### Investment Returns
- **Trade Posts**: 1.0x base multiplier
- **StarPorts**: 1.5x base multiplier (higher risk/reward)
- **Commission Rate**: Percentage of all trades at owned facilities
- **Hourly Collection**: Passive income accumulation

## Configuration

### Game Constants
Key game parameters can be adjusted in `src/constants/gameConstants.js`:

- **SECTOR_COUNT**: Total sectors in universe (default: 1000)
- **FUEL_COST_PER_SECTOR**: Movement fuel cost
- **COMBAT_COOLDOWN**: Time between attacks
- **INVESTMENT_CONFIG**: Investment costs and returns
- **SHIP_UPGRADES**: Available ship improvements

### Firebase Security Rules
Ensure proper Firestore security rules are configured for multiplayer gameplay.

## Deployment

### Firebase Hosting
```bash
# Build the project
npm run build

# Deploy to Firebase
firebase deploy
```

### Environment Variables
Set production environment variables in your hosting platform.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Write tests for new features
- Follow existing code style
- Update documentation for significant changes
- Test multiplayer functionality thoroughly

## Game Rules

### Victory Conditions
- **Seasonal Play**: Compete during limited-time seasons
- **Credit Accumulation**: Build the largest trading empire
- **Investment Portfolio**: Diversify income sources
- **Strategic Trading**: Master market fluctuations

### Fair Play
- No automated trading bots
- Respect other players
- Report bugs and exploits
- Follow community guidelines

## Known Issues

- See `BUG_REPORT.md` for current known issues
- Report new bugs via GitHub issues
- Check existing issues before reporting duplicates

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by classic TradeWars games
- Built with modern web technologies
- Community feedback and contributions
- Firebase for backend infrastructure

---

**Ready to start your trading empire? Install the game and begin your journey through the stars!**
