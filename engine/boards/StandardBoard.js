const BaseBoard = require('./BaseBoard');

// Standard 8x8 Chess Board
class StandardBoard extends BaseBoard {
  constructor(config = {}) {
    // Initialize files and ranks before calling super
    const squares = {};
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = [1, 2, 3, 4, 5, 6, 7, 8];
    
    for (const file of files) {
      for (const rank of ranks) {
        const square = file + rank;
        squares[square] = null;
      }
    }
    
    super(config);
    this.files = files;
    this.ranks = ranks;
    this.squares = squares;
  }

  initializeSquares() {
    // This is now handled in constructor
    return this.squares || {};
  }

  getValidSquares() {
    return Object.keys(this.squares);
  }

  getNeighbors(square) {
    const file = square.charCodeAt(0);
    const rank = parseInt(square[1]);
    const neighbors = [];

    // All 8 directions
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [df, dr] of directions) {
      const newFile = String.fromCharCode(file + df);
      const newRank = rank + dr;
      const newSquare = newFile + newRank;
      
      if (this.isValidSquare(newSquare)) {
        neighbors.push(newSquare);
      }
    }

    return neighbors;
  }

  // Get squares in a specific direction from a square
  getRaySquares(square, direction, maxDistance = 8) {
    const file = square.charCodeAt(0);
    const rank = parseInt(square[1]);
    const squares = [];
    
    const [df, dr] = direction;
    
    for (let i = 1; i <= maxDistance; i++) {
      const newFile = String.fromCharCode(file + (df * i));
      const newRank = rank + (dr * i);
      const newSquare = newFile + newRank;
      
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

  // Get all squares a rook can move to from a given square
  getRookMoves(square) {
    const moves = [];
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]]; // N, S, E, W
    
    for (const direction of directions) {
      moves.push(...this.getRaySquares(square, direction));
    }
    
    return moves;
  }

  // Get all squares a bishop can move to from a given square
  getBishopMoves(square) {
    const moves = [];
    const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]]; // NE, SE, NW, SW
    
    for (const direction of directions) {
      moves.push(...this.getRaySquares(square, direction));
    }
    
    return moves;
  }

  // Get all squares a knight can move to from a given square
  getKnightMoves(square) {
    const file = square.charCodeAt(0);
    const rank = parseInt(square[1]);
    const moves = [];
    
    const knightMoves = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    
    for (const [df, dr] of knightMoves) {
      const newFile = String.fromCharCode(file + df);
      const newRank = rank + dr;
      const newSquare = newFile + newRank;
      
      if (this.isValidSquare(newSquare)) {
        moves.push(newSquare);
      }
    }
    
    return moves;
  }

  // Get all squares a king can move to from a given square
  getKingMoves(square) {
    return this.getNeighbors(square);
  }

  // Override getLineBetween for standard board
  getLineBetween(from, to) {
    const fromFile = from.charCodeAt(0);
    const fromRank = parseInt(from[1]);
    const toFile = to.charCodeAt(0);
    const toRank = parseInt(to[1]);
    
    const deltaFile = toFile - fromFile;
    const deltaRank = toRank - fromRank;
    
    // Not on same line
    if (deltaFile !== 0 && deltaRank !== 0 && Math.abs(deltaFile) !== Math.abs(deltaRank)) {
      return [];
    }
    
    const line = [];
    const steps = Math.max(Math.abs(deltaFile), Math.abs(deltaRank));
    
    if (steps <= 1) return []; // Adjacent squares
    
    const stepFile = deltaFile === 0 ? 0 : deltaFile / Math.abs(deltaFile);
    const stepRank = deltaRank === 0 ? 0 : deltaRank / Math.abs(deltaRank);
    
    for (let i = 1; i < steps; i++) {
      const file = String.fromCharCode(fromFile + (stepFile * i));
      const rank = fromRank + (stepRank * i);
      line.push(file + rank);
    }
    
    return line;
  }

  // Check if a square is on a specific rank
  isOnRank(square, rank) {
    return parseInt(square[1]) === rank;
  }

  // Check if a square is on a specific file
  isOnFile(square, file) {
    return square[0] === file;
  }

  // Check if a square is on a diagonal
  isOnDiagonal(square1, square2) {
    const file1 = square1.charCodeAt(0);
    const rank1 = parseInt(square1[1]);
    const file2 = square2.charCodeAt(0);
    const rank2 = parseInt(square2[1]);
    
    return Math.abs(file1 - file2) === Math.abs(rank1 - rank2);
  }

  // Check if a square is on a rank, file, or diagonal
  isOnSameLine(square1, square2) {
    const file1 = square1.charCodeAt(0);
    const rank1 = parseInt(square1[1]);
    const file2 = square2.charCodeAt(0);
    const rank2 = parseInt(square2[1]);
    
    return file1 === file2 || rank1 === rank2 || Math.abs(file1 - file2) === Math.abs(rank1 - rank2);
  }

  // Get distance between two squares
  getDistance(square1, square2) {
    const file1 = square1.charCodeAt(0);
    const rank1 = parseInt(square1[1]);
    const file2 = square2.charCodeAt(0);
    const rank2 = parseInt(square2[1]);
    
    return Math.max(Math.abs(file1 - file2), Math.abs(rank1 - rank2));
  }
}

module.exports = StandardBoard;
