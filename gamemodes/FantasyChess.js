const GameEngine = require('../engine/GameEngine');
const BoardFactory = require('../engine/boards/BoardFactory');
const PieceFactory = require('../engine/pieces/PieceFactory');
const RulesEngine = require('../engine/rules/RulesEngine');

// Fantasy Chess with dragons and wizards on standard board
class FantasyChess extends GameEngine {
  constructor(gameId, creatorId, creatorName) {
    const config = {
      maxPlayers: 2,
      timeControl: { initial: 720, increment: 3 }, // 12+3
      boardShape: 'standard',
      boardSize: { width: 8, height: 8 },
      winConditions: ['checkmate', 'capture-all'],
      specialRules: [],
      customPieces: ['dragon', 'wizard', 'phoenix', 'unicorn']
    };
    
    super(gameId, creatorId, creatorName, config);
  }

  initializeBoard() {
    return BoardFactory.createBoard('standard');
  }

  initializePieces() {
    return {
      // Standard pieces
      king: PieceFactory.createPiece('king', 'white', null),
      queen: PieceFactory.createPiece('queen', 'white', null),
      rook: PieceFactory.createPiece('rook', 'white', null),
      bishop: PieceFactory.createPiece('bishop', 'white', null),
      knight: PieceFactory.createPiece('knight', 'white', null),
      pawn: PieceFactory.createPiece('pawn', 'white', null),
      
      // Fantasy pieces
      dragon: PieceFactory.createPiece('dragon', 'white', null),
      wizard: PieceFactory.createPiece('wizard', 'white', null),
      phoenix: PieceFactory.createPiece('phoenix', 'white', null),
      unicorn: PieceFactory.createPiece('unicorn', 'white', null)
    };
  }

  initializeRules() {
    return new RulesEngine({
      winConditions: this.config.winConditions,
      specialRules: this.config.specialRules
    });
  }

  initializeGameState() {
    // Fantasy Chess FEN with custom pieces: D=Dragon, W=Wizard, U=Unicorn, F=Phoenix
    // Standard layout but with fantasy pieces replacing some positions
    const fantasyFen = 'ruwdkwur/ppfpppfp/8/8/8/8/PPFPPPFP/RUWDKWUR w - - 0 1';
    
    return {
      fen: fantasyFen,
      pgn: '',
      turn: 'w', // Use 'w'/'b' format for compatibility
      gameOver: false,
      winner: null,
      winReason: null,
      moveHistory: [],
      lastMoveTime: null,
      timerRunning: false,
      startTime: new Date(),
      specialEvents: [],
      dragonBreathUses: { white: 2, black: 2 },
      wizardSpells: { white: 3, black: 3 }
    };
  }

  setupPosition() {
    // For now, use standard chess setup but pieces have fantasy abilities
    // The frontend will see normal pieces, but server handles fantasy behavior
    console.log('🧙‍♂️ Fantasy Chess: Using standard position with fantasy abilities');
    
    // Don't set up custom pieces - let the standard FEN handle the board
    // The magic happens in the move handling, not the initial setup
  }

  onGameStart() {
    super.onGameStart();
    console.log(`🧙‍♂️ Fantasy Chess game ${this.id} started with dragons and wizards!`);
    this.setupPosition();
  }

  onMove(move, playerId) {
    super.onMove(move, playerId);
    
    // Handle fantasy piece special abilities
    const piece = this.board.getPiece(move.to);
    if (piece) {
      this.handleFantasyAbilities(piece, move);
    }
  }

  handleFantasyAbilities(piece, move) {
    switch (piece.type) {
      case 'dragon':
        if (this.gameState.dragonBreathUses[piece.color] > 0 && move.captured) {
          this.useDragonBreath(piece, move);
        }
        break;
      case 'wizard':
        if (this.gameState.wizardSpells[piece.color] > 0) {
          this.castWizardSpell(piece, move);
        }
        break;
      case 'phoenix':
        this.leaveFireTrail(piece, move);
        break;
      case 'unicorn':
        this.healNearbyAllies(piece, move);
        break;
    }
  }

  useDragonBreath(dragon, move) {
    const neighbors = this.board.getNeighbors(move.to);
    let burnedPieces = 0;
    
    for (const neighbor of neighbors) {
      const piece = this.board.getPiece(neighbor);
      if (piece && piece.color !== dragon.color && piece.type !== 'dragon') {
        this.board.setPiece(neighbor, null);
        burnedPieces++;
      }
    }
    
    if (burnedPieces > 0) {
      this.gameState.dragonBreathUses[dragon.color]--;
      this.gameState.specialEvents.push({
        type: 'dragon_breath',
        square: move.to,
        piecesBurned: burnedPieces,
        timestamp: new Date()
      });
    }
  }

  castWizardSpell(wizard, move) {
    // Wizard teleports a random friendly piece
    const friendlyPieces = this.board.getPiecesByColor(wizard.color);
    const nonWizardPieces = friendlyPieces.filter(p => p.piece.type !== 'wizard' && p.piece.type !== 'king');
    
    if (nonWizardPieces.length > 0) {
      const randomPiece = nonWizardPieces[Math.floor(Math.random() * nonWizardPieces.length)];
      const emptySquares = this.board.getValidSquares().filter(sq => this.board.isEmpty(sq));
      
      if (emptySquares.length > 0) {
        const newSquare = emptySquares[Math.floor(Math.random() * emptySquares.length)];
        this.board.movePiece(randomPiece.square, newSquare);
        
        this.gameState.wizardSpells[wizard.color]--;
        this.gameState.specialEvents.push({
          type: 'wizard_teleport',
          from: randomPiece.square,
          to: newSquare,
          piece: randomPiece.piece.type,
          timestamp: new Date()
        });
      }
    }
  }

  leaveFireTrail(phoenix, move) {
    // Phoenix leaves a fire trail that damages enemies
    this.gameState.specialEvents.push({
      type: 'phoenix_trail',
      square: move.from,
      timestamp: new Date()
    });
  }

  healNearbyAllies(unicorn, move) {
    // Unicorn heals nearby friendly pieces
    const neighbors = this.board.getNeighbors(move.to);
    let healedPieces = 0;
    
    for (const neighbor of neighbors) {
      const piece = this.board.getPiece(neighbor);
      if (piece && piece.color === unicorn.color && piece.properties) {
        // Restore abilities
        if (piece.properties.spellsRemaining !== undefined) {
          piece.properties.spellsRemaining = Math.min(piece.properties.spellsRemaining + 1, 3);
          healedPieces++;
        }
      }
    }
    
    if (healedPieces > 0) {
      this.gameState.specialEvents.push({
        type: 'unicorn_healing',
        square: move.to,
        piecesHealed: healedPieces,
        timestamp: new Date()
      });
    }
  }

  getGamemodeInfo() {
    return {
      name: 'Fantasy Chess',
      description: 'Epic battles with dragons, wizards, phoenixes and unicorns on a standard board!',
      category: 'fantasy',
      timeControl: '12+3',
      maxPlayers: 2,
      boardShape: 'standard',
      customPieces: true,
      features: [
        '🐉 Dragons with Fire Breath',
        '🧙‍♂️ Wizards with Teleportation',
        '🔥 Phoenixes with Fire Trails',
        '🦄 Unicorns with Healing',
        '⚔️ Standard Board Layout',
        '🎯 Multiple Win Conditions'
      ]
    };
  }

  validateConfig(config) {
    const errors = [];
    
    if (config.timeControl && config.timeControl.initial < 300) {
      errors.push('Fantasy Chess requires longer time control (minimum 5 minutes)');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
}

module.exports = FantasyChess;
