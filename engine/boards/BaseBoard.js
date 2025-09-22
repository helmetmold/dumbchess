// Base Board Class
class BaseBoard {
  constructor(config = {}) {
    this.config = config;
    // Only call initializeSquares if not already set by subclass
    if (!this.squares) {
      this.squares = this.initializeSquares();
    }
  }

  // Abstract methods - must be implemented by subclasses
  initializeSquares() {
    throw new Error('initializeSquares must be implemented by subclass');
  }

  getValidSquares() {
    throw new Error('getValidSquares must be implemented by subclass');
  }

  getNeighbors(square) {
    throw new Error('getNeighbors must be implemented by subclass');
  }

  // Common methods
  getPiece(square) {
    return this.squares[square] || null;
  }

  setPiece(square, piece) {
    if (this.isValidSquare(square)) {
      this.squares[square] = piece;
    }
  }

  movePiece(from, to) {
    const piece = this.getPiece(from);
    this.setPiece(to, piece);
    this.setPiece(from, null);
    
    // Update piece position if it has one
    if (piece && piece.position !== undefined) {
      piece.position = to;
    }
  }

  isValidSquare(square) {
    return this.getValidSquares().includes(square);
  }

  isEmpty(square) {
    return !this.getPiece(square);
  }

  isOccupied(square) {
    return !!this.getPiece(square);
  }

  isOccupiedByColor(square, color) {
    const piece = this.getPiece(square);
    return piece && piece.color === color;
  }

  isOccupiedByOpponent(square, color) {
    const piece = this.getPiece(square);
    return piece && piece.color !== color;
  }

  // Get all pieces of a specific color
  getPiecesByColor(color) {
    const pieces = [];
    for (const square of this.getValidSquares()) {
      const piece = this.getPiece(square);
      if (piece && piece.color === color) {
        pieces.push({ piece, square });
      }
    }
    return pieces;
  }

  // Get all pieces of a specific type
  getPiecesByType(type) {
    const pieces = [];
    for (const square of this.getValidSquares()) {
      const piece = this.getPiece(square);
      if (piece && piece.type === type) {
        pieces.push({ piece, square });
      }
    }
    return pieces;
  }

  // Find king of specific color
  findKing(color) {
    for (const square of this.getValidSquares()) {
      const piece = this.getPiece(square);
      if (piece && piece.type === 'king' && piece.color === color) {
        return square;
      }
    }
    return null;
  }

  // Get line of squares between two squares (for sliding pieces)
  getLineBetween(from, to) {
    const line = [];
    // This would be implemented based on board geometry
    // For now, return empty array
    return line;
  }

  // Check if there are any pieces between two squares
  isPathClear(from, to) {
    const line = this.getLineBetween(from, to);
    return line.every(square => this.isEmpty(square));
  }

  // Clone the board state
  clone() {
    const cloned = new this.constructor(this.config);
    for (const square of this.getValidSquares()) {
      const piece = this.getPiece(square);
      if (piece) {
        cloned.setPiece(square, { ...piece });
      }
    }
    return cloned;
  }

  // Convert to simple object for JSON serialization
  toJSON() {
    const result = {};
    for (const square of this.getValidSquares()) {
      const piece = this.getPiece(square);
      if (piece) {
        result[square] = piece;
      }
    }
    return result;
  }

  // Load from JSON object
  fromJSON(data) {
    // Clear current state
    for (const square of this.getValidSquares()) {
      this.setPiece(square, null);
    }
    
    // Load new state
    for (const [square, piece] of Object.entries(data)) {
      if (this.isValidSquare(square)) {
        this.setPiece(square, piece);
      }
    }
  }
}

module.exports = BaseBoard;
