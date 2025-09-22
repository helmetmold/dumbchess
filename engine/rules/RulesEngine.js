const WinConditions = require('./WinConditions');
const SpecialRules = require('./SpecialRules');

// Rules Engine for managing game rules and win conditions
class RulesEngine {
  constructor(config = {}) {
    this.winConditions = new Map();
    this.specialRules = new Map();
    this.config = config;
    
    this.setupRules(config);
  }

  setupRules(config) {
    // Register win conditions
    this.registerWinCondition('checkmate', new WinConditions.CheckmateRule());
    this.registerWinCondition('king-of-hill', new WinConditions.KingOfHillRule(config.hillSquares));
    this.registerWinCondition('capture-all', new WinConditions.CaptureAllRule());
    this.registerWinCondition('reach-end', new WinConditions.ReachEndRule());
    this.registerWinCondition('elimination', new WinConditions.EliminationRule());
    this.registerWinCondition('time-limit', new WinConditions.TimeLimitRule());
    
    // Register special rules
    this.registerSpecialRule('atomic', new SpecialRules.AtomicRule());
    this.registerSpecialRule('zombie', new SpecialRules.ZombieRule());
    this.registerSpecialRule('gravity', new SpecialRules.GravityRule());
    this.registerSpecialRule('fog-of-war', new SpecialRules.FogOfWarRule());
    this.registerSpecialRule('mutation', new SpecialRules.MutationRule());
  }

  registerWinCondition(name, rule) {
    this.winConditions.set(name, rule);
  }

  registerSpecialRule(name, rule) {
    this.specialRules.set(name, rule);
  }

  checkWinCondition(condition, gameState, board) {
    const rule = this.winConditions.get(condition);
    if (!rule) {
      return { gameOver: false };
    }
    
    try {
      return rule.check(gameState, board);
    } catch (error) {
      console.error(`Error checking win condition '${condition}':`, error);
      return { gameOver: false };
    }
  }

  applySpecialRule(ruleName, context) {
    const rule = this.specialRules.get(ruleName);
    if (!rule) {
      return context;
    }
    
    try {
      return rule.apply(context);
    } catch (error) {
      console.error(`Error applying special rule '${ruleName}':`, error);
      return context;
    }
  }

  // Check all win conditions
  checkAllWinConditions(gameState, board) {
    for (const [conditionName, rule] of this.winConditions) {
      const result = this.checkWinCondition(conditionName, gameState, board);
      if (result.gameOver) {
        result.condition = conditionName;
        return result;
      }
    }
    return { gameOver: false };
  }

  // Apply all active special rules
  applyAllSpecialRules(context, activeRules = []) {
    let updatedContext = context;
    
    for (const ruleName of activeRules) {
      updatedContext = this.applySpecialRule(ruleName, updatedContext);
    }
    
    return updatedContext;
  }

  // Get available win conditions
  getAvailableWinConditions() {
    return Array.from(this.winConditions.keys());
  }

  // Get available special rules
  getAvailableSpecialRules() {
    return Array.from(this.specialRules.keys());
  }

  // Get rule information
  getRuleInfo(ruleName, type = 'win') {
    const rules = type === 'win' ? this.winConditions : this.specialRules;
    const rule = rules.get(ruleName);
    
    if (!rule) {
      return null;
    }
    
    return {
      name: ruleName,
      type: type,
      description: rule.getDescription ? rule.getDescription() : 'No description available',
      parameters: rule.getParameters ? rule.getParameters() : {}
    };
  }

  // Validate rules configuration
  validateRulesConfig(config) {
    const errors = [];
    
    // Check win conditions
    if (config.winConditions) {
      for (const condition of config.winConditions) {
        if (!this.winConditions.has(condition)) {
          errors.push(`Unknown win condition: ${condition}`);
        }
      }
    }
    
    // Check special rules
    if (config.specialRules) {
      for (const rule of config.specialRules) {
        if (!this.specialRules.has(rule)) {
          errors.push(`Unknown special rule: ${rule}`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // Clone rules engine
  clone() {
    return new RulesEngine(this.config);
  }

  // Export rules state
  toJSON() {
    return {
      config: this.config,
      winConditions: Array.from(this.winConditions.keys()),
      specialRules: Array.from(this.specialRules.keys())
    };
  }
}

module.exports = RulesEngine;
