const GameEngine = require('../engine/GameEngine');
const BoardFactory = require('../engine/boards/BoardFactory');
const PieceFactory = require('../engine/pieces/PieceFactory');
const RulesEngine = require('../engine/rules/RulesEngine');
const RandomFens = require('../RandomFens');

// Original Dumb Chess gamemode with random starting positions
class DumbChess extends GameEngine {
  constructor(gameId, creatorId, creatorName) {
    const config = {
      maxPlayers: 2,
      timeControl: { initial: 600, increment: 0 }, // 10+0
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
    const randomFen = RandomFens.getWeightedRandomFen();
    
    return {
      fen: randomFen,
      pgn: '',
      turn: 'w', // Use 'w'/'b' format for compatibility
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

  // Load the random FEN position onto the board
  setupPosition() {
    try {
      // Parse FEN and set up board
      const fenParts = this.gameState.fen.split(' ');
      const position = fenParts[0];
      
      this.parseFenPosition(position);
      
      // Set turn from FEN
      this.gameState.turn = fenParts[1] === 'w' ? 'white' : 'black';
      
    } catch (error) {
      console.error('Error setting up position:', error);
      // Fallback to standard starting position
      this.setupStandardPosition();
    }
  }

  parseFenPosition(position) {
    const ranks = position.split('/');
    
    for (let rankIndex = 0; rankIndex < ranks.length; rankIndex++) {
      const rank = 8 - rankIndex; // FEN starts from rank 8
      let fileIndex = 0;
      
      for (const char of ranks[rankIndex]) {
        if (char >= '1' && char <= '8') {
          // Empty squares
          fileIndex += parseInt(char);
        } else {
          // Piece
          const file = String.fromCharCode('a'.charCodeAt(0) + fileIndex);
          const square = file + rank;
          
          const piece = this.createPieceFromFenChar(char, square);
          if (piece) {
            this.board.setPiece(square, piece);
          }
          
          fileIndex++;
        }
      }
    }
  }

  createPieceFromFenChar(fenChar, square) {
    const pieceMap = {
      'k': 'king', 'q': 'queen', 'r': 'rook',
      'b': 'bishop', 'n': 'knight', 'p': 'pawn'
    };
    
    const pieceType = pieceMap[fenChar.toLowerCase()];
    if (!pieceType) return null;
    
    const color = fenChar === fenChar.toUpperCase() ? 'white' : 'black';
    
    try {
      const piece = PieceFactory.createPiece(pieceType, color, square);
      return piece;
    } catch (error) {
      console.error(`Error creating piece ${pieceType}:`, error);
      return null;
    }
  }

  setupStandardPosition() {
    // Standard chess starting position as fallback
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
    console.log(`Dumb Chess game ${this.id} started with random position: ${this.gameState.fen}`);
    
    // Set up the board position
    this.setupPosition();
  }

  onMove(move, playerId) {
    super.onMove(move, playerId);
    
    // Update FEN after move (simplified)
    this.updateFen();
  }

  updateFen() {
    // Generate FEN from current board state
    try {
      this.gameState.fen = this.generateFen();
    } catch (error) {
      console.error('Error updating FEN:', error);
    }
  }

  generateFen() {
    let fen = '';
    
    // Generate position part
    for (let rank = 8; rank >= 1; rank--) {
      let emptyCount = 0;
      let rankFen = '';
      
      for (let file = 'a'; file <= 'h'; file = String.fromCharCode(file.charCodeAt(0) + 1)) {
        const square = file + rank;
        const piece = this.board.getPiece(square);
        
        if (piece) {
          if (emptyCount > 0) {
            rankFen += emptyCount;
            emptyCount = 0;
          }
          
          const fenChar = this.pieceToFenChar(piece);
          rankFen += fenChar;
        } else {
          emptyCount++;
        }
      }
      
      if (emptyCount > 0) {
        rankFen += emptyCount;
      }
      
      fen += rankFen;
      if (rank > 1) fen += '/';
    }
    
    // Add turn, castling, en passant, halfmove, fullmove
    const turn = this.gameState.turn === 'white' ? 'w' : 'b';
    fen += ` ${turn} - - 0 1`;
    
    return fen;
  }

  pieceToFenChar(piece) {
    const pieceMap = {
      'king': 'k', 'queen': 'q', 'rook': 'r',
      'bishop': 'b', 'knight': 'n', 'pawn': 'p'
    };
    
    const char = pieceMap[piece.type] || '?';
    return piece.color === 'white' ? char.toUpperCase() : char;
  }

  getGamemodeInfo() {
    return {
      name: 'Dumb Chess',
      description: 'Random starting positions with standard chess rules',
      category: 'standard',
      timeControl: '10+0',
      maxPlayers: 2,
      boardShape: 'standard',
      customPieces: false,
      features: [
        'Random Starting Positions',
        'Standard Rules',
        'Classic Timer',
        'Push-ups for Losers!'
      ]
    };
  }

  validateConfig(config) {
    const errors = [];
    
    if (config.timeControl && config.timeControl.initial < 30) {
      errors.push('Time control too short (minimum 30 seconds)');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
}

module.exports = DumbChess;
