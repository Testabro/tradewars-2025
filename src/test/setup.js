import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  onSnapshot: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  runTransaction: vi.fn(),
  writeBatch: vi.fn(),
  serverTimestamp: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  deleteDoc: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

// Mock Firebase app
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

// Mock Web Animations API for tests
global.Element.prototype.animate = vi.fn(() => ({
  finished: Promise.resolve(),
  cancel: vi.fn(),
  finish: vi.fn(),
}));

// Global animation mocks
vi.mock('../utils/animations.js', () => ({
  createParticleEffect: vi.fn(),
  createScreenShake: vi.fn(),
  createFloatingText: vi.fn(),
  createRippleEffect: vi.fn(),
  createPulsingGlow: vi.fn(),
  createMatrixRain: vi.fn(() => vi.fn()), // Return cleanup function
}));

// Global test utilities
global.mockPlayer = {
  id: 'test-player-id',
  name: 'Test Captain',
  credits: 1000,
  currentSector: 1,
  fuel: 100,
  maxFuel: 100,
  hull: 100,
  shields: 0,
  maxShields: 0,
  holds: 10,
  cargo: {
    Gold: 0,
    Organics: 0,
    Equipment: 0,
    Gemstones: 0,
  },
  lastFuelRecharge: new Date().toISOString(),
  lastRewardCollection: Date.now(),
  escapePodActivated: false,
};

global.mockSector = {
  id: 1,
  name: 'Test Sector',
  type: 'EMPTY',
  port: {
    name: 'Test Station',
    isStarPort: true,
    commodities: {
      Gold: { buyPrice: 120, sellPrice: 80 },
      Organics: { buyPrice: 25, sellPrice: 15 },
      Equipment: { buyPrice: 60, sellPrice: 40 },
      Gemstones: { buyPrice: 350, sellPrice: 250 },
    },
    tradePostInvestments: {},
    starPortInvestments: {},
  },
};

global.mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
