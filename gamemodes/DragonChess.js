const GameEngine = require('../engine/GameEngine');
const BoardFactory = require('../engine/boards/BoardFactory');
const PieceFactory = require('../engine/pieces/PieceFactory');
const RulesEngine = require('../engine/rules/RulesEngine');

// Fantasy Dragon Chess on hexagonal board
class DragonChess extends GameEngine {
  constructor(gameId, creatorId, creatorName) {
    const config = {
      maxPlayers: 2,
      timeControl: { initial: 900, increment: 5 }, // 15+5
      boardShape: 'hexagonal',
      boardSize: { radius: 5 },
      winConditions: ['capture-all', 'king-of-hill'],
      specialRules: ['atomic'],
      customPieces: ['dragon', 'wizard', 'phoenix', 'unicorn'],
      hillSquares: ['0,0', '1,0', '0,1', '-1,0', '0,-1', '1,-1', '-1,1'] // Center hexes
    };
    
    super(gameId, creatorId, creatorName, config);
  }

  initializeBoard() {
    return BoardFactory.createBoard('hexagonal', { radius: 5 });
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
      specialRules: this.config.specialRules,
      hillSquares: this.config.hillSquares
    });
  }

  initializeGameState() {
    return {
      fen: this.generateStartingFen(),
      pgn: '',
      turn: 'w',
      gameOver: false,
      winner: null,
      winReason: null,
      moveHistory: [],
      lastMoveTime: null,
      timerRunning: false,
      startTime: new Date(),
      specialEvents: [],
      dragonBreathUses: { white: 3, black: 3 },
      wizardSpells: { white: 3, black: 3 }
    };
  }

  generateStartingFen() {
    // Custom starting position for hexagonal dragon chess
    return 'dragon-chess-hex-start';
  }

  setupPosition() {
    // Set up custom dragon chess starting position
    const whiteSetup = {
      // Back row (closest to white)
      '0,-4': { type: 'rook', color: 'white' },
      '1,-4': { type: 'knight', color: 'white' },
      '2,-3': { type: 'bishop', color: 'white' },
      '3,-3': { type: 'dragon', color: 'white' },
      '4,-2': { type: 'king', color: 'white' },
      '3,-2': { type: 'queen', color: 'white' },
      '2,-2': { type: 'wizard', color: 'white' },
      '1,-3': { type: 'unicorn', color: 'white' },
      '0,-3': { type: 'phoenix', color: 'white' },
      '-1,-3': { type: 'bishop', color: 'white' },
      '-2,-3': { type: 'knight', color: 'white' },
      '-3,-2': { type: 'rook', color: 'white' },
      
      // Pawn row
      '0,-2': { type: 'pawn', color: 'white' },
      '1,-2': { type: 'pawn', color: 'white' },
      '2,-1': { type: 'pawn', color: 'white' },
      '3,-1': { type: 'pawn', color: 'white' },
      '3,0': { type: 'pawn', color: 'white' },
      '2,0': { type: 'pawn', color: 'white' },
      '1,0': { type: 'pawn', color: 'white' },
      '0,-1': { type: 'pawn', color: 'white' },
      '-1,-1': { type: 'pawn', color: 'white' },
      '-2,-1': { type: 'pawn', color: 'white' },
      '-3,-1': { type: 'pawn', color: 'white' }
    };
    
    const blackSetup = {
      // Back row (closest to black)
      '0,4': { type: 'rook', color: 'black' },
      '-1,4': { type: 'knight', color: 'black' },
      '-2,3': { type: 'bishop', color: 'black' },
      '-3,3': { type: 'dragon', color: 'black' },
      '-4,2': { type: 'king', color: 'black' },
      '-3,2': { type: 'queen', color: 'black' },
      '-2,2': { type: 'wizard', color: 'black' },
      '-1,3': { type: 'unicorn', color: 'black' },
      '0,3': { type: 'phoenix', color: 'black' },
      '1,3': { type: 'bishop', color: 'black' },
      '2,3': { type: 'knight', color: 'black' },
      '3,2': { type: 'rook', color: 'black' },
      
      // Pawn row
      '0,2': { type: 'pawn', color: 'black' },
      '-1,2': { type: 'pawn', color: 'black' },
      '-2,1': { type: 'pawn', color: 'black' },
      '-3,1': { type: 'pawn', color: 'black' },
      '-3,0': { type: 'pawn', color: 'black' },
      '-2,0': { type: 'pawn', color: 'black' },
      '-1,0': { type: 'pawn', color: 'black' },
      '0,1': { type: 'pawn', color: 'black' },
      '1,1': { type: 'pawn', color: 'black' },
      '2,1': { type: 'pawn', color: 'black' },
      '3,1': { type: 'pawn', color: 'black' }
    };
    
    // Place all pieces
    const allSetup = { ...whiteSetup, ...blackSetup };
    
    for (const [square, pieceData] of Object.entries(allSetup)) {
      try {
        const piece = PieceFactory.createPiece(pieceData.type, pieceData.color, square);
        this.board.setPiece(square, piece);
      } catch (error) {
        console.error(`Error placing ${pieceData.type} at ${square}:`, error);
      }
    }
  }

  onGameStart() {
    super.onGameStart();
    console.log(`Dragon Chess game ${this.id} started on hexagonal board`);
    
    // Set up the board position
    this.setupPosition();
  }

  onMove(move, playerId) {
    super.onMove(move, playerId);
    
    // Handle special dragon chess events
    const piece = this.board.getPiece(move.to);
    if (piece) {
      this.handleSpecialPieceAbilities(piece, move);
    }
  }

  handleSpecialPieceAbilities(piece, move) {
    switch (piece.type) {
      case 'dragon':
        this.handleDragonBreath(piece, move);
        break;
      case 'wizard':
        this.handleWizardSpell(piece, move);
        break;
      case 'phoenix':
        this.handlePhoenixFlight(piece, move);
        break;
      case 'unicorn':
        this.handleUnicornHealing(piece, move);
        break;
    }
  }

  handleDragonBreath(dragon, move) {
    if (this.gameState.dragonBreathUses[dragon.color] > 0) {
      // Dragon breath affects adjacent hexes
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
  }

  handleWizardSpell(wizard, move) {
    if (this.gameState.wizardSpells[wizard.color] > 0) {
      // Wizard can teleport friendly pieces
      const friendlyPieces = this.board.getPiecesByColor(wizard.color);
      
      if (friendlyPieces.length > 0) {
        // Randomly teleport a friendly piece
        const randomPiece = friendlyPieces[Math.floor(Math.random() * friendlyPieces.length)];
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
  }

  handlePhoenixFlight(phoenix, move) {
    // Phoenix leaves fire trail
    this.gameState.specialEvents.push({
      type: 'phoenix_trail',
      square: move.from,
      timestamp: new Date()
    });
  }

  handleUnicornHealing(unicorn, move) {
    // Unicorn heals nearby friendly pieces
    const neighbors = this.board.getNeighbors(move.to);
    let healedPieces = 0;
    
    for (const neighbor of neighbors) {
      const piece = this.board.getPiece(neighbor);
      if (piece && piece.color === unicorn.color && piece.properties) {
        // Restore special abilities
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
      name: 'Dragon Chess',
      description: 'Epic fantasy chess with dragons and wizards on a mystical hexagonal battlefield',
      category: 'fantasy',
      timeControl: '15+5',
      maxPlayers: 2,
      boardShape: 'hexagonal',
      customPieces: true,
      features: [
        'Hexagonal Board',
        'Fantasy Pieces (Dragons, Wizards, Phoenix, Unicorn)',
        'Dragon Breath Attacks',
        'Wizard Teleportation',
        'Atomic Captures',
        'Multiple Win Conditions',
        'King of the Hill',
        'Capture All Pieces'
      ]
    };
  }

  validateConfig(config) {
    const errors = [];
    
    if (config.boardSize && config.boardSize.radius < 3) {
      errors.push('Hexagonal board radius too small (minimum 3)');
    }
    
    if (config.timeControl && config.timeControl.initial < 300) {
      errors.push('Dragon Chess requires longer time control (minimum 5 minutes)');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
}

module.exports = DragonChess;
