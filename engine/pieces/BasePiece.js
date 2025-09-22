// Base Piece Class
class BasePiece {
  constructor(type, color, position) {
    this.type = type;
    this.color = color;
    this.position = position;
    this.moveCount = 0;
    this.lastMoved = null;
    this.properties = {}; // For custom piece properties
  }

  // Abstract methods - must be implemented by subclasses
  getPossibleMoves(board, gameState) {
    throw new Error('getPossibleMoves must be implemented by subclass');
  }

  // Common validation method
  isValidMove(from, to, board, gameState) {
    const possibleMoves = this.getPossibleMoves(board, gameState);
    return possibleMoves.includes(to);
  }

  // Hook methods that can be overridden
  onMove(from, to, board, gameState) {
    this.moveCount++;
    this.lastMoved = new Date();
    this.position = to;
  }

  onCapture(capturedPiece, board, gameState) {
    // Called when this piece captures another
  }

  onBeingCaptured(capturingPiece, board, gameState) {
    // Called when this piece is captured
  }

  onSpecialAbility(ability, context) {
    // Called when piece uses special ability
  }

  // Common utility methods
  canCapture(targetSquare, board) {
    const targetPiece = board.getPiece(targetSquare);
    return targetPiece && targetPiece.color !== this.color;
  }

  canMoveTo(targetSquare, board) {
    return board.isEmpty(targetSquare) || this.canCapture(targetSquare, board);
  }

  isBlocked(targetSquare, board) {
    const targetPiece = board.getPiece(targetSquare);
    return targetPiece && targetPiece.color === this.color;
  }

  // Filter moves to only include valid destinations
  filterValidMoves(moves, board) {
    return moves.filter(square => 
      board.isValidSquare(square) && 
      this.canMoveTo(square, board)
    );
  }

  // Get all moves in a specific direction until blocked
  getMovesInDirection(board, direction, maxDistance = 8) {
    const moves = [];
    const [dFile, dRank] = direction;
    
    if (!this.position) return moves;
    
    const file = this.position.charCodeAt(0);
    const rank = parseInt(this.position[1]);
    
    for (let i = 1; i <= maxDistance; i++) {
      const newFile = String.fromCharCode(file + (dFile * i));
      const newRank = rank + (dRank * i);
      const newSquare = newFile + newRank;
      
      if (!board.isValidSquare(newSquare)) {
        break;
      }
      
      if (board.isEmpty(newSquare)) {
        moves.push(newSquare);
      } else if (this.canCapture(newSquare, board)) {
        moves.push(newSquare);
        break; // Can't move past captured piece
      } else {
        break; // Blocked by own piece
      }
    }
    
    return moves;
  }

  // Get symbol for display
  getSymbol() {
    const symbols = {
      'king': '♔♚',
      'queen': '♕♛',
      'rook': '♖♜',
      'bishop': '♗♝',
      'knight': '♘♞',
      'pawn': '♙♟',
      'dragon': '🐉🐲',
      'wizard': '🧙‍♂️🧙‍♀️',
      'phoenix': '🔥🔥',
      'unicorn': '🦄🦄'
    };
    
    const pieceSymbols = symbols[this.type] || '??';
    return this.color === 'white' ? pieceSymbols[0] : pieceSymbols[1];
  }

  // Get piece value for evaluation
  getValue() {
    const values = {
      'pawn': 1,
      'knight': 3,
      'bishop': 3,
      'rook': 5,
      'queen': 9,
      'king': 0,
      'dragon': 12,
      'wizard': 7,
      'phoenix': 8,
      'unicorn': 6
    };
    return values[this.type] || 0;
  }

  // Check if piece has special abilities
  hasAbility(ability) {
    return this.properties.abilities && this.properties.abilities.includes(ability);
  }

  // Add special ability to piece
  addAbility(ability) {
    if (!this.properties.abilities) {
      this.properties.abilities = [];
    }
    if (!this.properties.abilities.includes(ability)) {
      this.properties.abilities.push(ability);
    }
  }

  // Remove special ability from piece
  removeAbility(ability) {
    if (this.properties.abilities) {
      this.properties.abilities = this.properties.abilities.filter(a => a !== ability);
    }
  }

  // Clone piece
  clone() {
    const cloned = new this.constructor(this.type, this.color, this.position);
    cloned.moveCount = this.moveCount;
    cloned.lastMoved = this.lastMoved;
    cloned.properties = { ...this.properties };
    return cloned;
  }

  // Convert to JSON
  toJSON() {
    return {
      type: this.type,
      color: this.color,
      position: this.position,
      moveCount: this.moveCount,
      lastMoved: this.lastMoved,
      properties: this.properties
    };
  }

  // Create from JSON
  static fromJSON(data) {
    const piece = new this(data.type, data.color, data.position);
    piece.moveCount = data.moveCount || 0;
    piece.lastMoved = data.lastMoved ? new Date(data.lastMoved) : null;
    piece.properties = data.properties || {};
    return piece;
  }
}

module.exports = BasePiece;
