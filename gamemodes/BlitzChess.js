const GameEngine = require('../engine/GameEngine');
const BoardFactory = require('../engine/boards/BoardFactory');
const PieceFactory = require('../engine/pieces/PieceFactory');
const RulesEngine = require('../engine/rules/RulesEngine');

// Fast-paced Blitz Chess
class BlitzChess extends GameEngine {
  constructor(gameId, creatorId, creatorName) {
    const config = {
      maxPlayers: 2,
      timeControl: { initial: 180, increment: 2 }, // 3+2 blitz
      boardShape: 'standard',
      boardSize: { width: 8, height: 8 },
      winConditions: ['checkmate'],
      specialRules: [],
      customPieces: []
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
      specialRules: this.config.specialRules
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
      specialEvents: []
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
    console.log(`Blitz Chess game ${this.id} started`);
    this.setupPosition();
  }

  onMove(move, playerId) {
    super.onMove(move, playerId);
    
    // Add time increment after each move
    const player = this.getPlayer(playerId);
    if (player) {
      player.timeLeft += this.config.timeControl.increment;
    }
  }

  getGamemodeInfo() {
    return {
      name: 'Blitz Chess',
      description: 'Fast-paced chess with time increment for quick games',
      category: 'standard',
      timeControl: '3+2',
      maxPlayers: 2,
      boardShape: 'standard',
      customPieces: false,
      features: [
        'Standard Starting Position',
        'Time Increment',
        'Fast Games',
        'Classic Rules'
      ]
    };
  }
}

module.exports = BlitzChess;
