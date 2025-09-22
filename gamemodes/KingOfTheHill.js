const GameEngine = require('../engine/GameEngine');
const BoardFactory = require('../engine/boards/BoardFactory');
const PieceFactory = require('../engine/pieces/PieceFactory');
const RulesEngine = require('../engine/rules/RulesEngine');

// King of the Hill variant
class KingOfTheHill extends GameEngine {
  constructor(gameId, creatorId, creatorName) {
    const config = {
      maxPlayers: 2,
      timeControl: { initial: 600, increment: 0 }, // 10+0
      boardShape: 'standard',
      boardSize: { width: 8, height: 8 },
      winConditions: ['king-of-hill', 'checkmate'],
      specialRules: [],
      customPieces: [],
      hillSquares: ['d4', 'd5', 'e4', 'e5'] // Center squares
    };
    
    super(gameId, creatorId, creatorName, config);
  }

  initializeBoard() {
    return BoardFactory.createBoard('standard');
  }

  initializePieces() {
    return {
      king: PieceFactory.createPiece('king', 'white', null),
      queen: PieceFactory.createPiece('queen', 'white', null),
      rook: PieceFactory.createPiece('rook', 'white', null),
      bishop: PieceFactory.createPiece('bishop', 'white', null),
      knight: PieceFactory.createPiece('knight', 'white', null),
      pawn: PieceFactory.createPiece('pawn', 'white', null)
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
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
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
      hillSquares: this.config.hillSquares
    };
  }

  setupPosition() {
    // Standard starting position
    const standardSetup = {
      'a1': { type: 'rook', color: 'white' },
      'b1': { type: 'knight', color: 'white' },
      'c1': { type: 'bishop', color: 'white' },
      'd1': { type: 'queen', color: 'white' },
      'e1': { type: 'king', color: 'white' },
      'f1': { type: 'bishop', color: 'white' },
      'g1': { type: 'knight', color: 'white' },
      'h1': { type: 'rook', color: 'white' },
      
      'a8': { type: 'rook', color: 'black' },
      'b8': { type: 'knight', color: 'black' },
      'c8': { type: 'bishop', color: 'black' },
      'd8': { type: 'queen', color: 'black' },
      'e8': { type: 'king', color: 'black' },
      'f8': { type: 'bishop', color: 'black' },
      'g8': { type: 'knight', color: 'black' },
      'h8': { type: 'rook', color: 'black' }
    };
    
    // Add pawns
    for (let file = 'a'; file <= 'h'; file = String.fromCharCode(file.charCodeAt(0) + 1)) {
      standardSetup[file + '2'] = { type: 'pawn', color: 'white' };
      standardSetup[file + '7'] = { type: 'pawn', color: 'black' };
    }
    
    // Place pieces on board
    for (const [square, pieceData] of Object.entries(standardSetup)) {
      try {
        const piece = PieceFactory.createPiece(pieceData.type, pieceData.color, square);
        this.board.setPiece(square, piece);
      } catch (error) {
        console.error(`Error placing piece at ${square}:`, error);
      }
    }
  }

  onGameStart() {
    super.onGameStart();
    console.log(`King of the Hill game ${this.id} started`);
    this.setupPosition();
  }

  onMove(move, playerId) {
    super.onMove(move, playerId);
    
    // Check if king reached the hill
    const piece = this.board.getPiece(move.to);
    if (piece && piece.type === 'king' && this.config.hillSquares.includes(move.to)) {
      this.gameState.specialEvents.push({
        type: 'king_reached_hill',
        square: move.to,
        color: piece.color,
        timestamp: new Date()
      });
    }
  }

  getGamemodeInfo() {
    return {
      name: 'King of the Hill',
      description: 'Race to get your king to the center squares to win!',
      category: 'variant',
      timeControl: '10+0',
      maxPlayers: 2,
      boardShape: 'standard',
      customPieces: false,
      features: [
        'Alternative Win Condition',
        'Center Control Strategy',
        'Fast Games',
        'Standard Pieces',
        'Hill Squares: d4, d5, e4, e5'
      ]
    };
  }

  validateConfig(config) {
    const errors = [];
    
    if (config.hillSquares && config.hillSquares.length === 0) {
      errors.push('King of the Hill requires at least one hill square');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
}

module.exports = KingOfTheHill;
