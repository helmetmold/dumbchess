const BasePiece = require('./BasePiece');

// Standard Chess Pieces

class King extends BasePiece {
  constructor(color, position) {
    super('king', color, position);
  }

  getPossibleMoves(board, gameState) {
    const moves = [];
    
    if (!this.position) return moves;
    
    // King moves one square in any direction
    const neighbors = board.getNeighbors ? 
      board.getNeighbors(this.position) : 
      board.getKingMoves(this.position);
    
    for (const square of neighbors) {
      if (this.canMoveTo(square, board)) {
        moves.push(square);
      }
    }
    
    // TODO: Add castling logic
    return moves;
  }
}

class Queen extends BasePiece {
  constructor(color, position) {
    super('queen', color, position);
  }

  getPossibleMoves(board, gameState) {
    const moves = [];
    
    if (!this.position) return moves;
    
    // Queen moves like rook + bishop
    const directions = [
      [0, 1], [0, -1], [1, 0], [-1, 0],  // Rook moves
      [1, 1], [1, -1], [-1, 1], [-1, -1] // Bishop moves
    ];
    
    for (const direction of directions) {
      moves.push(...this.getMovesInDirection(board, direction));
    }
    
    return moves;
  }
}

class Rook extends BasePiece {
  constructor(color, position) {
    super('rook', color, position);
  }

  getPossibleMoves(board, gameState) {
    const moves = [];
    
    if (!this.position) return moves;
    
    // Rook moves horizontally and vertically
    const directions = [
      [0, 1], [0, -1], [1, 0], [-1, 0]
    ];
    
    for (const direction of directions) {
      moves.push(...this.getMovesInDirection(board, direction));
    }
    
    return moves;
  }
}

class Bishop extends BasePiece {
  constructor(color, position) {
    super('bishop', color, position);
  }

  getPossibleMoves(board, gameState) {
    const moves = [];
    
    if (!this.position) return moves;
    
    // Bishop moves diagonally
    const directions = [
      [1, 1], [1, -1], [-1, 1], [-1, -1]
    ];
    
    for (const direction of directions) {
      moves.push(...this.getMovesInDirection(board, direction));
    }
    
    return moves;
  }
}

class Knight extends BasePiece {
  constructor(color, position) {
    super('knight', color, position);
  }

  getPossibleMoves(board, gameState) {
    const moves = [];
    
    if (!this.position) return moves;
    
    const file = this.position.charCodeAt(0);
    const rank = parseInt(this.position[1]);
    
    const knightMoves = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    
    for (const [df, dr] of knightMoves) {
      const newFile = String.fromCharCode(file + df);
      const newRank = rank + dr;
      const newSquare = newFile + newRank;
      
      if (board.isValidSquare(newSquare) && this.canMoveTo(newSquare, board)) {
        moves.push(newSquare);
      }
    }
    
    return moves;
  }
}

class Pawn extends BasePiece {
  constructor(color, position) {
    super('pawn', color, position);
  }

  getPossibleMoves(board, gameState) {
    const moves = [];
    
    if (!this.position) return moves;
    
    const file = this.position.charCodeAt(0);
    const rank = parseInt(this.position[1]);
    
    // Direction depends on color
    const direction = this.color === 'white' ? 1 : -1;
    const startRank = this.color === 'white' ? 2 : 7;
    
    // One square forward
    const oneForward = String.fromCharCode(file) + (rank + direction);
    if (board.isValidSquare(oneForward) && board.isEmpty(oneForward)) {
      moves.push(oneForward);
      
      // Two squares forward from starting position
      if (rank === startRank) {
        const twoForward = String.fromCharCode(file) + (rank + (direction * 2));
        if (board.isValidSquare(twoForward) && board.isEmpty(twoForward)) {
          moves.push(twoForward);
        }
      }
    }
    
    // Diagonal captures
    const captureSquares = [
      String.fromCharCode(file - 1) + (rank + direction),
      String.fromCharCode(file + 1) + (rank + direction)
    ];
    
    for (const square of captureSquares) {
      if (board.isValidSquare(square) && this.canCapture(square, board)) {
        moves.push(square);
      }
    }
    
    // TODO: Add en passant logic
    
    return moves;
  }
}

module.exports = {
  King,
  Queen,
  Rook,
  Bishop,
  Knight,
  Pawn
};
