const GameEngine = require('../engine/GameEngine');
const BoardFactory = require('../engine/boards/BoardFactory');
const PieceFactory = require('../engine/pieces/PieceFactory');
const RulesEngine = require('../engine/rules/RulesEngine');

// Atomic Chess - pieces explode when captured
class AtomicChess extends GameEngine {
  constructor(gameId, creatorId, creatorName) {
    const config = {
      maxPlayers: 2,
      timeControl: { initial: 480, increment: 2 }, // 8+2
      boardShape: 'standard',
      boardSize: { width: 8, height: 8 },
      winConditions: ['checkmate', 'elimination'],
      specialRules: ['atomic'],
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
      specialEvents: [],
      explosions: []
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
    console.log(`Atomic Chess game ${this.id} started`);
    this.setupPosition();
  }

  onMove(move, playerId) {
    super.onMove(move, playerId);
    
    // Track explosions for special effects
    if (move.captured) {
      this.gameState.explosions.push({
        square: move.to,
        timestamp: new Date(),
        capturedPiece: move.captured.type
      });
    }
  }

  // Override makeMove to handle atomic explosions
  makeMove(from, to, promotion = null) {
    const piece = this.board.getPiece(from);
    if (!piece) return null;

    const captured = this.board.getPiece(to);
    
    // Make the move first
    const move = super.makeMove(from, to, promotion);
    if (!move) return null;

    // Apply atomic rule if there was a capture
    if (captured) {
      this.handleAtomicExplosion(to, captured);
    }

    return move;
  }

  handleAtomicExplosion(square, capturedPiece) {
    const neighbors = this.board.getNeighbors(square);
    const explodedPieces = [];
    
    for (const neighbor of neighbors) {
      const piece = this.board.getPiece(neighbor);
      if (piece && piece.type !== 'pawn') {
        explodedPieces.push({
          square: neighbor,
          piece: piece.type,
          color: piece.color
        });
        this.board.setPiece(neighbor, null);
      }
    }
    
    // Remove the capturing piece too (except pawns)
    const capturingPiece = this.board.getPiece(square);
    if (capturingPiece && capturingPiece.type !== 'pawn') {
      explodedPieces.push({
        square: square,
        piece: capturingPiece.type,
        color: capturingPiece.color
      });
      this.board.setPiece(square, null);
    }
    
    // Log the explosion
    this.gameState.specialEvents.push({
      type: 'atomic_explosion',
      epicenter: square,
      explodedPieces: explodedPieces,
      capturedPiece: capturedPiece.type,
      timestamp: new Date()
    });
  }

  getGamemodeInfo() {
    return {
      name: 'Atomic Chess',
      description: 'Explosive chess where captures cause chain reactions!',
      category: 'variant',
      timeControl: '8+2',
      maxPlayers: 2,
      boardShape: 'standard',
      customPieces: false,
      features: [
        'Atomic Explosions',
        'Chain Reactions',
        'Pawns Survive Explosions',
        'Kings Can Be Blown Up',
        'Tactical Sacrifices',
        'High Risk/Reward'
      ]
    };
  }

  validateConfig(config) {
    const errors = [];
    
    if (config.specialRules && !config.specialRules.includes('atomic')) {
      errors.push('Atomic Chess requires the atomic special rule');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
}

module.exports = AtomicChess;
