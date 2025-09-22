const DumbChess = require('./DumbChess');
const DragonChess = require('./DragonChess');
const BlitzChess = require('./BlitzChess');
const KingOfTheHill = require('./KingOfTheHill');
const AtomicChess = require('./AtomicChess');
const FantasyChess = require('./FantasyChess');

// Gamemode Factory for creating different game types
class GamemodeFactory {
  static gamemodes = new Map();

  // Initialize with available gamemodes
  static init() {
    this.registerGamemode('dumb-chess', DumbChess);
    this.registerGamemode('dragon-chess', DragonChess);
    this.registerGamemode('blitz', BlitzChess);
    this.registerGamemode('king-of-hill', KingOfTheHill);
    this.registerGamemode('atomic', AtomicChess);
    this.registerGamemode('fantasy', FantasyChess);
  }

  static registerGamemode(id, GamemodeClass) {
    this.gamemodes.set(id, GamemodeClass);
  }

  static createGame(gamemode, gameId, creatorId, creatorName) {
    const GamemodeClass = this.gamemodes.get(gamemode);
    if (!GamemodeClass) {
      throw new Error(`Unknown gamemode: ${gamemode}`);
    }
    return new GamemodeClass(gameId, creatorId, creatorName);
  }

  static getAvailableGamemodes() {
    return Array.from(this.gamemodes.keys()).map(key => {
      const GamemodeClass = this.gamemodes.get(key);
      
      try {
        // Create temporary instance to get info
        const tempInstance = new GamemodeClass('temp', 'temp', 'temp');
        return {
          id: key,
          ...tempInstance.getGamemodeInfo()
        };
      } catch (error) {
        console.error(`Error getting info for gamemode ${key}:`, error);
        return {
          id: key,
          name: GamemodeClass.name,
          description: 'Custom gamemode',
          error: error.message
        };
      }
    });
  }

  static getGamemodeInfo(gamemodeId) {
    const GamemodeClass = this.gamemodes.get(gamemodeId);
    if (!GamemodeClass) {
      throw new Error(`Unknown gamemode: ${gamemodeId}`);
    }

    const tempInstance = new GamemodeClass('temp', 'temp', 'temp');
    return {
      id: gamemodeId,
      ...tempInstance.getGamemodeInfo()
    };
  }

  static isValidGamemode(gamemodeId) {
    return this.gamemodes.has(gamemodeId);
  }

  static getGamemodesByCategory(category) {
    const allGamemodes = this.getAvailableGamemodes();
    
    switch (category) {
      case 'standard':
        return allGamemodes.filter(gm => 
          ['dumb-chess', 'blitz', 'king-of-hill'].includes(gm.id)
        );
      case 'fantasy':
        return allGamemodes.filter(gm => 
          ['dragon-chess'].includes(gm.id)
        );
      case 'variant':
        return allGamemodes.filter(gm => 
          ['atomic', 'king-of-hill'].includes(gm.id)
        );
      case 'all':
      default:
        return allGamemodes;
    }
  }

  // Validate gamemode configuration
  static validateGamemodeConfig(gamemodeId, config = {}) {
    const GamemodeClass = this.gamemodes.get(gamemodeId);
    if (!GamemodeClass) {
      return {
        valid: false,
        errors: [`Unknown gamemode: ${gamemodeId}`]
      };
    }

    try {
      const tempInstance = new GamemodeClass('temp', 'temp', 'temp');
      
      // Check if gamemode has validation method
      if (tempInstance.validateConfig) {
        return tempInstance.validateConfig(config);
      }
      
      return { valid: true, errors: [] };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message]
      };
    }
  }

  // Get recommended gamemodes for new players
  static getRecommendedGamemodes() {
    return [
      'dumb-chess',
      'blitz',
      'king-of-hill'
    ];
  }

  // Get advanced gamemodes
  static getAdvancedGamemodes() {
    return [
      'dragon-chess',
      'atomic'
    ];
  }

  // Search gamemodes by features
  static searchGamemodes(query) {
    const allGamemodes = this.getAvailableGamemodes();
    const searchTerm = query.toLowerCase();
    
    return allGamemodes.filter(gamemode => {
      const searchableText = [
        gamemode.name,
        gamemode.description,
        ...(gamemode.features || [])
      ].join(' ').toLowerCase();
      
      return searchableText.includes(searchTerm);
    });
  }

  // Get gamemode statistics
  static getGamemodeStats() {
    const stats = {
      total: this.gamemodes.size,
      categories: {},
      boardTypes: {},
      features: {}
    };

    const allGamemodes = this.getAvailableGamemodes();
    
    for (const gamemode of allGamemodes) {
      // Count by category
      const category = gamemode.category || 'other';
      stats.categories[category] = (stats.categories[category] || 0) + 1;
      
      // Count by board type
      const boardType = gamemode.boardShape || 'standard';
      stats.boardTypes[boardType] = (stats.boardTypes[boardType] || 0) + 1;
      
      // Count features
      if (gamemode.features) {
        for (const feature of gamemode.features) {
          stats.features[feature] = (stats.features[feature] || 0) + 1;
        }
      }
    }

    return stats;
  }

  // Get random gamemode
  static getRandomGamemode(excludeAdvanced = false) {
    let availableGamemodes;
    
    if (excludeAdvanced) {
      // Only use beginner-friendly gamemodes
      availableGamemodes = this.getRecommendedGamemodes();
    } else {
      // Use all available gamemodes
      availableGamemodes = Array.from(this.gamemodes.keys());
    }
    
    if (availableGamemodes.length === 0) {
      return 'dumb-chess'; // Fallback
    }
    
    const randomIndex = Math.floor(Math.random() * availableGamemodes.length);
    return availableGamemodes[randomIndex];
  }

  // Weighted random selection for more control
  static getWeightedRandomGamemode() {
    // Define weights for different gamemodes (higher = more likely)
    const weights = {
      'dumb-chess': 25,     // Most common - your signature mode
      'blitz': 20,          // Popular fast games
      'king-of-hill': 18,   // Fun variant
      'fantasy': 15,        // Fantasy pieces on standard board
      'atomic': 12,         // Exciting explosions
      'dragon-chess': 10    // Advanced hexagonal fantasy mode
    };
    
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    let randomValue = Math.random() * totalWeight;
    
    for (const [gamemode, weight] of Object.entries(weights)) {
      randomValue -= weight;
      if (randomValue <= 0) {
        return gamemode;
      }
    }
    
    return 'dumb-chess'; // Fallback
  }

  // Get random gamemode with info
  static getRandomGamemodeWithInfo(excludeAdvanced = false) {
    const randomId = this.getWeightedRandomGamemode();
    
    try {
      const info = this.getGamemodeInfo(randomId);
      return {
        id: randomId,
        ...info
      };
    } catch (error) {
      console.error('Error getting random gamemode info:', error);
      return {
        id: 'dumb-chess',
        name: 'Dumb Chess',
        description: 'Random starting positions'
      };
    }
  }

  // Get today's featured gamemode (changes daily)
  static getTodaysFeaturedGamemode() {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
    
    const gamemodes = Array.from(this.gamemodes.keys());
    const featuredIndex = dayOfYear % gamemodes.length;
    
    return gamemodes[featuredIndex];
  }
}

// Initialize the factory
GamemodeFactory.init();

module.exports = GamemodeFactory;
