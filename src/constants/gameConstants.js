// Planet Class Attributes
export const PLANET_CLASSES = {
  M: {
    name: 'Class M',
    description: 'Earth-like, habitable, rich in organics and water.',
    resources: ['Organics', 'Water', 'Gold'],
    rarity: 'common',
  },
  K: {
    name: 'Class K',
    description: 'Desert worlds, limited water, moderate minerals.',
    resources: ['Organics', 'Gold'],
    rarity: 'uncommon',
  },
  G: {
    name: 'Class G',
    description: 'Gas giants, abundant in rare gases and gemstones.',
    resources: ['Gemstones', 'Equipment'],
    rarity: 'rare',
  },
  B: {
    name: 'Class B',
    description: 'Barren, rocky, high in minerals and metals.',
    resources: ['Gold', 'Equipment'],
    rarity: 'uncommon',
  },
  D: {
    name: 'Class D',
    description: 'Dwarf planets, icy, low resources.',
    resources: ['Organics'],
    rarity: 'rare',
  },
};
// Game Configuration Constants
export const GAME_CONFIG = {
  APP_ID: 'tradewars-2025-prod',
  SECTOR_COUNT: 100,
  FUEL_COST_PER_SECTOR: 10,
  FUEL_PRICE_PER_UNIT: 2,
  BASE_WEAPON_DAMAGE: 10,
  COMBAT_COOLDOWN: 10000,
  WARP_FUEL_MULTIPLIER: 3,
  MAX_LOG_ENTRIES: 100,
  DAILY_FUEL_RECHARGE_HOURS: 24
};

// Firebase Paths
export const FIREBASE_PATHS = {
  UNIVERSE: `artifacts/${GAME_CONFIG.APP_ID}/public/data/tradewars_universe`,
  PLAYERS: `artifacts/${GAME_CONFIG.APP_ID}/public/data/tradewars_players`,
  EVENTS: `artifacts/${GAME_CONFIG.APP_ID}/public/data/tradewars_events`,
  NPCS: `artifacts/${GAME_CONFIG.APP_ID}/public/data/tradewars_npcs`,
  COMPANIES: `artifacts/${GAME_CONFIG.APP_ID}/public/data/tradewars_companies`,
  ADMINS: 'admins'
};

// Document IDs
export const DOCUMENT_IDS = {
  UNIVERSE: 'main_universe',
  GAME_STATE: 'game_state'
};

// Game Data
export const COMMODITIES = [
  { name: 'Gold', basePrice: 100 },
  { name: 'Organics', basePrice: 20 },
  { name: 'Equipment', basePrice: 50 },
  { name: 'Gemstones', basePrice: 300 }
];

// Ship Upgrade System - Permanent improvements to your ship
export const SHIP_UPGRADES = {
  CARGO_EXPANSION: {
    name: 'Cargo Bay Expansion',
    baseCost: 2500,
    increment: 5,
    maxUpgrades: 10, // Can upgrade 10 times max
    description: 'Expand your cargo capacity by 5 units',
    playerProperty: 'holds'
  },
  SHIELD_UPGRADE: {
    name: 'Shield Generator Upgrade',
    baseCost: 5000,
    increment: 25,
    maxUpgrades: 8, // Can upgrade 8 times max
    description: 'Install additional shield capacity (+25 shields)',
    playerProperty: 'maxShields'
  },
  FUEL_TANK_UPGRADE: {
    name: 'Fuel Tank Expansion',
    baseCost: 3000,
    increment: 50,
    maxUpgrades: 6, // Can upgrade 6 times max
    description: 'Increase fuel tank capacity by 50 units',
    playerProperty: 'maxFuel'
  },
  ARMOR_PLATING: {
    name: 'Reinforced Armor Plating',
    baseCost: 4000,
    increment: 10,
    maxUpgrades: 5, // Can upgrade 5 times max
    description: 'Increase maximum hull integrity (+10% max hull)',
    playerProperty: 'maxHull'
  },
  WEAPON_SYSTEMS: {
    name: 'Weapon System Upgrade',
    baseCost: 7500,
    increment: 5,
    maxUpgrades: 4, // Can upgrade 4 times max
    description: 'Enhance combat effectiveness (+5 weapon damage)',
    playerProperty: 'weaponDamage',
    baseValue: 15 // All ships start with 15 base weapon damage
  }
};

// Ship Types Available for Purchase
export const SHIP_TYPES = {
  SCOUT: {
    name: 'Scout Ship',
    price: 15000,
    holds: 15,
    maxFuel: 150,
    maxShields: 25,
    hull: 100,
    description: 'Fast and agile, perfect for exploration and quick trades.'
  },
  MERCHANT: {
    name: 'Merchant Vessel',
    price: 25000,
    holds: 30,
    maxFuel: 200,
    maxShields: 50,
    hull: 100,
    description: 'Balanced cargo capacity and defenses for serious traders.'
  },
  FREIGHTER: {
    name: 'Heavy Freighter',
    price: 45000,
    holds: 60,
    maxFuel: 250,
    maxShields: 75,
    hull: 100,
    description: 'Maximum cargo capacity for bulk trading operations.'
  },
  CRUISER: {
    name: 'Battle Cruiser',
    price: 60000,
    holds: 25,
    maxFuel: 300,
    maxShields: 150,
    hull: 100,
    description: 'Heavily armed and shielded for dangerous sectors.'
  },
  FLAGSHIP: {
    name: 'Corporate Flagship',
    price: 100000,
    holds: 50,
    maxFuel: 400,
    maxShields: 200,
    hull: 100,
    description: 'The ultimate vessel combining cargo, speed, and firepower.'
  }
};

// Starport Services - Repairs and temporary services (not permanent upgrades)
export const STARPORT_SERVICES = {
  SHIP_REPAIR: {
    name: 'Hull Repair',
    basePrice: 100, // Flat rate to restore hull to 100%
    description: 'Restore your ship to full hull integrity',
    serviceType: 'repair'
  },
  SHIELD_REPAIR: {
    name: 'Shield Maintenance',
    basePrice: 50, // Flat rate to restore shields to max
    description: 'Repair and calibrate shield systems to maximum capacity',
    serviceType: 'repair'
  },
  EMERGENCY_REPAIRS: {
    name: 'Emergency Repair Kit',
    basePrice: 1500,
    description: 'Quick field repairs (+25 hull, basic shield restoration)',
    serviceType: 'emergency'
  },
  SYSTEM_DIAGNOSTICS: {
    name: 'System Diagnostics',
    basePrice: 500,
    description: 'Full system check and minor optimizations (+5% efficiency)',
    serviceType: 'maintenance'
  }
};

// Starport Upgrades - Permanent ship improvements (separate from services)
export const STARPORT_UPGRADES = {
  CARGO_EXPANSION: {
    name: 'Cargo Bay Expansion',
    basePrice: 2500,
    description: 'Permanently increase cargo capacity by 5 units',
    upgradeType: 'CARGO_EXPANSION',
    linkedUpgrade: 'CARGO_EXPANSION'
  },
  SHIELD_UPGRADE: {
    name: 'Shield Generator Upgrade',
    basePrice: 5000,
    description: 'Install additional shield capacity (+25 max shields)',
    upgradeType: 'SHIELD_UPGRADE',
    linkedUpgrade: 'SHIELD_UPGRADE'
  },
  FUEL_TANK_UPGRADE: {
    name: 'Fuel Tank Expansion',
    basePrice: 3000,
    description: 'Increase fuel tank capacity by 50 units',
    upgradeType: 'FUEL_TANK_UPGRADE',
    linkedUpgrade: 'FUEL_TANK_UPGRADE'
  },
  ARMOR_PLATING: {
    name: 'Reinforced Armor Plating',
    basePrice: 4000,
    description: 'Increase maximum hull integrity (+10% max hull)',
    upgradeType: 'ARMOR_PLATING',
    linkedUpgrade: 'ARMOR_PLATING'
  },
  WEAPON_SYSTEMS: {
    name: 'Weapon System Upgrade',
    basePrice: 7500,
    description: 'Enhance combat effectiveness (+5 weapon damage)',
    upgradeType: 'WEAPON_SYSTEMS',
    linkedUpgrade: 'WEAPON_SYSTEMS'
  }
};

// Investment System
export const INVESTMENT_CONFIG = {
  MIN_INVESTMENT: 1000,
  MAX_OWNERSHIP_PERCENTAGE: 100,
  HOURLY_REWARD_BASE: 50, // Base hourly reward per percentage point
  TRADE_COMMISSION_RATE: 0.05, // 5% of trade volume goes to investors
  INVESTMENT_MULTIPLIERS: {
    TRADE_POST: 1.0,
    STARPORT: 1.5 // StarPorts are more expensive but more profitable
  },
  PAYOUT_INTERVAL_HOURS: 1
};

// Investment Types
export const INVESTMENT_TYPES = {
  TRADE_POST: 'TRADE_POST',
  STARPORT: 'STARPORT'
};

// Log Message Types
export const LOG_TYPES = {
  STANDARD: 'standard',
  EVENT: 'event',
  COMBAT_SELF: 'combat_self',
  COMBAT_OTHER: 'combat_other',
  SUCCESS: 'success',
  WARNING: 'warning',
  EMERGENCY: 'emergency'
};

// Log Color Mapping
export const LOG_COLORS = {
  [LOG_TYPES.STANDARD]: 'text-green-500',
  [LOG_TYPES.EVENT]: 'text-yellow-400',
  [LOG_TYPES.COMBAT_SELF]: 'text-red-400',
  [LOG_TYPES.COMBAT_OTHER]: 'text-orange-400',
  [LOG_TYPES.SUCCESS]: 'text-cyan-400',
  [LOG_TYPES.WARNING]: 'text-yellow-600',
  [LOG_TYPES.EMERGENCY]: 'text-red-500'
};

// Random Events System
export const RANDOM_EVENTS = {
  // Positive Events (Delight)
  SPACE_LOTTERY: {
    id: 'SPACE_LOTTERY',
    type: 'positive',
    title: '🎰 Galactic Lottery Winner!',
    description: 'You receive a transmission: "Congratulations! Your ship registration won the Galactic Lottery!"',
    probability: 0.02, // 2% chance
    effects: {
      credits: { min: 5000, max: 25000 }
    },
    logType: LOG_TYPES.SUCCESS
  },
  
  FUEL_CACHE: {
    id: 'FUEL_CACHE',
    type: 'positive',
    title: '⛽ Abandoned Fuel Cache',
    description: 'Your sensors detect an abandoned fuel depot drifting in space. Free fuel for everyone!',
    probability: 0.03, // 3% chance
    effects: {
      fuel: 'fill_tank'
    },
    logType: LOG_TYPES.SUCCESS
  },
  
  MERCHANT_GIFT: {
    id: 'MERCHANT_GIFT',
    type: 'positive',
    title: '🎁 Grateful Merchant',
    description: 'A merchant you helped before recognizes your ship and gifts you valuable cargo!',
    probability: 0.025, // 2.5% chance
    effects: {
      cargo: { commodity: 'random', amount: { min: 5, max: 15 } }
    },
    logType: LOG_TYPES.SUCCESS
  },
  
  TECH_UPGRADE: {
    id: 'TECH_UPGRADE',
    type: 'positive',
    title: '🔧 Prototype Technology',
    description: 'Space engineers test a prototype upgrade on your ship. Your cargo capacity increases!',
    probability: 0.015, // 1.5% chance
    effects: {
      holds: { min: 3, max: 8 }
    },
    logType: LOG_TYPES.SUCCESS
  },
  
  // Challenging Events
  PIRATE_AMBUSH: {
    id: 'PIRATE_AMBUSH',
    type: 'challenge',
    title: '🏴‍☠️ Pirate Ambush!',
    description: 'Pirates decloak and demand tribute! Pay up or face the consequences.',
    probability: 0.04, // 4% chance
    effects: {
      credits: { min: -2000, max: -8000 },
      hull: { min: -10, max: -25 }
    },
    logType: LOG_TYPES.WARNING
  },
  
  SYSTEM_MALFUNCTION: {
    id: 'SYSTEM_MALFUNCTION',
    type: 'challenge',
    title: '⚠️ System Malfunction',
    description: 'Critical systems malfunction! Emergency repairs drain your credits and damage hull integrity.',
    probability: 0.03, // 3% chance
    effects: {
      credits: { min: -1500, max: -5000 },
      hull: { min: -5, max: -15 }
    },
    logType: LOG_TYPES.WARNING
  },
  
  FUEL_LEAK: {
    id: 'FUEL_LEAK',
    type: 'challenge',
    title: '💨 Fuel Leak Detected',
    description: 'A micro-meteorite punctures your fuel tank! Emergency sealing procedures activated.',
    probability: 0.035, // 3.5% chance
    effects: {
      fuel: { min: -20, max: -50 }
    },
    logType: LOG_TYPES.WARNING
  },
  
  // Surprise Events
  TIME_WARP: {
    id: 'TIME_WARP',
    type: 'surprise',
    title: '🌀 Temporal Anomaly',
    description: 'You drift through a time warp! When you emerge, everything has changed...',
    probability: 0.01, // 1% chance
    effects: {
      random_sector: true,
      credits: { min: -2000, max: 10000 },
      fuel: { min: -30, max: 50 }
    },
    logType: LOG_TYPES.EVENT
  },
  
  ALIEN_ENCOUNTER: {
    id: 'ALIEN_ENCOUNTER',
    type: 'surprise',
    title: '👽 First Contact',
    description: 'An alien vessel approaches! They seem friendly and offer to trade exotic technology.',
    probability: 0.008, // 0.8% chance
    effects: {
      shields: { min: 10, max: 50 },
      maxShields: { min: 10, max: 50 },
      credits: { min: -1000, max: 5000 }
    },
    logType: LOG_TYPES.EVENT
  },
  
  SPACE_STORM: {
    id: 'SPACE_STORM',
    type: 'surprise',
    title: '⛈️ Ion Storm',
    description: 'A massive ion storm engulfs your ship! Systems go haywire as you ride the cosmic winds.',
    probability: 0.02, // 2% chance
    effects: {
      random_sector: true,
      hull: { min: -15, max: 5 },
      fuel: { min: -10, max: 20 }
    },
    logType: LOG_TYPES.EVENT
  },
  
  CARGO_INSPECTION: {
    id: 'CARGO_INSPECTION',
    type: 'surprise',
    title: '🚔 Customs Inspection',
    description: 'Space patrol conducts a random cargo inspection. They find contraband... or do they?',
    probability: 0.025, // 2.5% chance
    effects: {
      cargo: { lose_random: { min: 0, max: 5 } },
      credits: { min: -3000, max: 2000 }
    },
    logType: LOG_TYPES.EVENT
  },
  
  DISTRESS_BEACON: {
    id: 'DISTRESS_BEACON',
    type: 'surprise',
    title: '📡 Distress Beacon',
    description: 'You receive a distress signal from a nearby ship. Help them... or ignore their plight?',
    probability: 0.03, // 3% chance
    effects: {
      credits: { min: -500, max: 8000 },
      fuel: { min: -15, max: 0 },
      reputation: { min: -1, max: 3 }
    },
    logType: LOG_TYPES.EVENT
  }
};

// Event Configuration
export const EVENT_CONFIG = {
  BASE_CHANCE_PER_SECTOR: 0.15, // 15% chance per sector jump
  COOLDOWN_SECTORS: 3, // Minimum sectors between events
  MAX_EVENTS_PER_SESSION: 5 // Maximum events per play session
};

// Company System
export const COMPANY_CONFIG = {
  CREATION_COST: 50000, // Cost to create a company
  MAX_MEMBERS: 20, // Maximum members per company
  MIN_NAME_LENGTH: 3,
  MAX_NAME_LENGTH: 30,
  TREASURY_SHARE: 0.05, // 5% of member trades go to company treasury
  MEMBER_ROLES: {
    FOUNDER: 'Founder',
    OFFICER: 'Officer', 
    MEMBER: 'Member'
  },
  PERMISSIONS: {
    FOUNDER: ['invite', 'kick', 'promote', 'demote', 'disband', 'withdraw', 'deposit', 'edit'],
    OFFICER: ['invite', 'kick', 'deposit'],
    MEMBER: ['deposit']
  }
};

// Company Benefits
export const COMPANY_BENEFITS = {
  FUEL_DISCOUNT: 0.1, // 10% fuel discount for company members
  REPAIR_DISCOUNT: 0.15, // 15% repair cost discount
  TRADE_BONUS: 0.05, // 5% bonus credits on trades
  SHARED_INTEL: true, // Share sector information
  EMERGENCY_FUND: true // Access to company emergency funds
};

// Pirate Combat System
export const PIRATE_CONFIG = {
  ENCOUNTER_CHANCE: 0.12, // 12% chance per sector
  MIN_SECTORS_BETWEEN_ENCOUNTERS: 2, // Minimum sectors between pirate encounters
  COMBAT_COOLDOWN: 3000, // 3 seconds between combat actions
  PIRATE_ATTACK_COOLDOWN: 1000, // 1 second between pirate attacks
  ESCAPE_CHANCE: 0.3, // 30% chance to escape combat
  LOOT_MULTIPLIER: 1.5, // Loot is 1.5x the pirate's threat level
  MAX_PIRATES_PER_ENCOUNTER: 3 // Maximum pirates in one encounter
};

// Pirate Types
export const PIRATE_TYPES = {
  RAIDER: {
    name: 'Pirate Raider',
    hull: 60,
    shields: 30,
    damage: { min: 8, max: 15 },
    threatLevel: 1,
    loot: {
      credits: { min: 500, max: 1500 },
      cargo: { chance: 0.3, amount: { min: 1, max: 3 } },
      fuel: { chance: 0.4, amount: { min: 10, max: 25 } }
    },
    description: 'A lightly armed pirate vessel looking for easy targets.'
  },
  CORSAIR: {
    name: 'Pirate Corsair',
    hull: 80,
    shields: 50,
    damage: { min: 12, max: 20 },
    threatLevel: 2,
    loot: {
      credits: { min: 1000, max: 3000 },
      cargo: { chance: 0.4, amount: { min: 2, max: 5 } },
      fuel: { chance: 0.5, amount: { min: 15, max: 35 } },
      equipment: { chance: 0.2, amount: { min: 1, max: 2 } }
    },
    description: 'A well-armed pirate ship with experienced crew.'
  },
  MARAUDER: {
    name: 'Pirate Marauder',
    hull: 100,
    shields: 75,
    damage: { min: 15, max: 25 },
    threatLevel: 3,
    loot: {
      credits: { min: 2000, max: 5000 },
      cargo: { chance: 0.6, amount: { min: 3, max: 8 } },
      fuel: { chance: 0.6, amount: { min: 20, max: 50 } },
      equipment: { chance: 0.4, amount: { min: 1, max: 3 } },
      gemstones: { chance: 0.3, amount: { min: 1, max: 2 } }
    },
    description: 'A heavily armed pirate warship. Extremely dangerous!'
  },
  FLAGSHIP: {
    name: 'Pirate Flagship',
    hull: 150,
    shields: 100,
    damage: { min: 20, max: 35 },
    threatLevel: 4,
    loot: {
      credits: { min: 5000, max: 12000 },
      cargo: { chance: 0.8, amount: { min: 5, max: 12 } },
      fuel: { chance: 0.7, amount: { min: 30, max: 75 } },
      equipment: { chance: 0.6, amount: { min: 2, max: 5 } },
      gemstones: { chance: 0.5, amount: { min: 1, max: 4 } },
      gold: { chance: 0.4, amount: { min: 1, max: 3 } }
    },
    description: 'The flagship of a pirate fleet. Victory brings great rewards!'
  }
};

// Combat Actions
export const COMBAT_ACTIONS = {
  ATTACK: 'ATTACK',
  DEFEND: 'DEFEND',
  ESCAPE: 'ESCAPE',
  SPECIAL: 'SPECIAL'
};

// Combat Results
export const COMBAT_RESULTS = {
  HIT: 'HIT',
  MISS: 'MISS',
  CRITICAL: 'CRITICAL',
  BLOCKED: 'BLOCKED',
  ESCAPED: 'ESCAPED',
  DESTROYED: 'DESTROYED'
};

// Pirate Encounter Messages
export const PIRATE_MESSAGES = {
  ENCOUNTER: [
    "🏴‍☠️ Pirates decloak and surround your ship!",
    "⚠️ Pirate vessels detected on long-range sensors!",
    "🚨 ALERT: Hostile ships approaching fast!",
    "💀 Pirates emerge from the asteroid field!",
    "⚡ Enemy ships drop out of warp nearby!"
  ],
  ATTACK: [
    "fires plasma cannons at your ship!",
    "launches a missile barrage!",
    "targets your engines with laser fire!",
    "attempts to disable your shields!",
    "unleashes a devastating energy blast!"
  ],
  VICTORY: [
    "💥 The pirate ship explodes in a brilliant fireball!",
    "🎯 Direct hit! The enemy vessel is destroyed!",
    "⚡ Critical systems failure! Pirate ship eliminated!",
    "🔥 The pirate vessel breaks apart under your assault!",
    "💀 Another pirate meets their fate in the void!"
  ],
  DEFEAT: [
    "💔 Your ship's hull is breached! Critical damage sustained!",
    "⚠️ Systems failing! You barely escape with your life!",
    "🚨 Emergency protocols activated! Retreat immediately!",
    "💥 Your ship takes heavy damage from the pirate assault!",
    "🆘 Hull integrity compromised! Seeking emergency repairs!"
  ],
  ESCAPE: [
    "🏃 You successfully escape into hyperspace!",
    "⚡ Emergency warp drive activated! You're safe... for now.",
    "🌟 You slip away while the pirates are distracted!",
    "🚀 Your ship's speed saves you from certain doom!",
    "💨 You vanish into a nearby nebula, losing your pursuers!"
  ]
};
