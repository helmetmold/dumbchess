const BaseBoard = require('./BaseBoard');

// Hexagonal Board for fantasy chess variants
class HexagonalBoard extends BaseBoard {
  constructor(config = {}) {
    super(config);
    this.radius = config.radius || 5;
  }

  initializeSquares() {
    const squares = {};
    
    // Generate hexagonal coordinates using axial coordinate system
    for (let q = -this.radius; q <= this.radius; q++) {
      const r1 = Math.max(-this.radius, -q - this.radius);
      const r2 = Math.min(this.radius, -q + this.radius);
      
      for (let r = r1; r <= r2; r++) {
        const square = `${q},${r}`;
        squares[square] = null;
      }
    }
    
    return squares;
  }

  getValidSquares() {
    return Object.keys(this.squares);
  }

  getNeighbors(square) {
    const [q, r] = square.split(',').map(Number);
    const neighbors = [];
    
    // Hexagonal neighbors in axial coordinates
    const directions = [
      [1, 0], [1, -1], [0, -1],
      [-1, 0], [-1, 1], [0, 1]
    ];

    for (const [dq, dr] of directions) {
      const newSquare = `${q + dq},${r + dr}`;
      if (this.isValidSquare(newSquare)) {
        neighbors.push(newSquare);
      }
    }

    return neighbors;
  }

  // Get squares in a specific direction from a square
  getRaySquares(square, direction, maxDistance = this.radius) {
    const [q, r] = square.split(',').map(Number);
    const squares = [];
    const [dq, dr] = direction;
    
    for (let i = 1; i <= maxDistance; i++) {
      const newQ = q + (dq * i);
      const newR = r + (dr * i);
      const newSquare = `${newQ},${newR}`;
      
      if (!this.isValidSquare(newSquare)) {
        break;
      }
      
      squares.push(newSquare);
      
      // Stop if we hit a piece
      if (this.isOccupied(newSquare)) {
        break;
      }
    }
    
    return squares;
  }

  // Get all squares in straight lines (6 directions on hex board)
  getLineMoves(square) {
    const moves = [];
    const directions = [
      [1, 0], [1, -1], [0, -1],
      [-1, 0], [-1, 1], [0, 1]
    ];
    
    for (const direction of directions) {
      moves.push(...this.getRaySquares(square, direction));
    }
    
    return moves;
  }

  // Get all squares in diagonal lines (6 diagonals on hex board)
  getDiagonalMoves(square) {
    const moves = [];
    // On hexagonal board, diagonals are different from straight lines
    // These would be the "knight-like" moves in hex
    const [q, r] = square.split(',').map(Number);
    
    const diagonalMoves = [
      [2, -1], [1, 1], [-1, 2],
      [-2, 1], [-1, -1], [1, -2]
    ];
    
    for (const [dq, dr] of diagonalMoves) {
      const newSquare = `${q + dq},${r + dr}`;
      if (this.isValidSquare(newSquare)) {
        moves.push(newSquare);
      }
    }
    
    return moves;
  }

  // Get distance between two hexagonal squares
  getDistance(square1, square2) {
    const [q1, r1] = square1.split(',').map(Number);
    const [q2, r2] = square2.split(',').map(Number);
    
    return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
  }

  // Override getLineBetween for hexagonal geometry
  getLineBetween(from, to) {
    const [fromQ, fromR] = from.split(',').map(Number);
    const [toQ, toR] = to.split(',').map(Number);
    
    const distance = this.getDistance(from, to);
    if (distance <= 1) return []; // Adjacent squares
    
    const line = [];
    
    for (let i = 1; i < distance; i++) {
      const t = i / distance;
      const q = Math.round(fromQ * (1 - t) + toQ * t);
      const r = Math.round(fromR * (1 - t) + toR * t);
      line.push(`${q},${r}`);
    }
    
    return line;
  }

  // Check if two squares are on the same hex line
  isOnSameLine(square1, square2) {
    const [q1, r1] = square1.split(',').map(Number);
    const [q2, r2] = square2.split(',').map(Number);
    
    // Same q-axis, r-axis, or diagonal
    return q1 === q2 || r1 === r2 || (q1 + r1) === (q2 + r2);
  }

  // Get all squares at a specific distance
  getSquaresAtDistance(square, distance) {
    const [q, r] = square.split(',').map(Number);
    const squares = [];
    
    for (let dq = -distance; dq <= distance; dq++) {
      const dr1 = Math.max(-distance, -dq - distance);
      const dr2 = Math.min(distance, -dq + distance);
      
      for (let dr = dr1; dr <= dr2; dr++) {
        if (Math.abs(dq) + Math.abs(dr) + Math.abs(-dq - dr) === distance * 2) {
          const newSquare = `${q + dq},${r + dr}`;
          if (this.isValidSquare(newSquare)) {
            squares.push(newSquare);
          }
        }
      }
    }
    
    return squares;
  }

  // Convert hex coordinates to screen coordinates for rendering
  hexToScreen(square, hexSize = 50) {
    const [q, r] = square.split(',').map(Number);
    const x = hexSize * (3/2 * q);
    const y = hexSize * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
    return { x, y };
  }

  // Convert screen coordinates to hex coordinates
  screenToHex(x, y, hexSize = 50) {
    const q = (2/3 * x) / hexSize;
    const r = (-1/3 * x + Math.sqrt(3)/3 * y) / hexSize;
    
    // Round to nearest hex
    const roundedQ = Math.round(q);
    const roundedR = Math.round(r);
    
    return `${roundedQ},${roundedR}`;
  }
}

module.exports = HexagonalBoard;
