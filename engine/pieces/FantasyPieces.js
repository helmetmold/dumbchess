const BasePiece = require('./BasePiece');

// Fantasy Chess Pieces

class Dragon extends BasePiece {
  constructor(color, position) {
    super('dragon', color, position);
    this.properties = {
      abilities: ['fly', 'breathe_fire'],
      fireBreathUses: 3
    };
  }

  getPossibleMoves(board, gameState) {
    const moves = [];
    
    if (!this.position) return moves;
    
    // Dragon can move like a queen but can also jump over pieces
    const directions = [
      [0, 1], [0, -1], [1, 0], [-1, 0],  // Straight
      [1, 1], [1, -1], [-1, 1], [-1, -1] // Diagonal
    ];
    
    for (const direction of directions) {
      // Normal moves (can jump over pieces due to flying ability)
      const rayMoves = this.getDragonRayMoves(board, direction, 3);
      moves.push(...rayMoves);
    }
    
    return moves;
  }

  getDragonRayMoves(board, direction, maxDistance) {
    const moves = [];
    const [dFile, dRank] = direction;
    
    const file = this.position.charCodeAt(0);
    const rank = parseInt(this.position[1]);
    
    for (let i = 1; i <= maxDistance; i++) {
      const newFile = String.fromCharCode(file + (dFile * i));
      const newRank = rank + (dRank * i);
      const newSquare = newFile + newRank;
      
      if (!board.isValidSquare(newSquare)) {
        break;
      }
      
      if (this.canMoveTo(newSquare, board)) {
        moves.push(newSquare);
      }
    }
    
    return moves;
  }

  onMove(from, to, board, gameState) {
    super.onMove(from, to, board, gameState);
    
    // Dragon can use fire breath after moving
    if (this.properties.fireBreathUses > 0) {
      this.burnAdjacentSquares(board, to);
    }
  }

  burnAdjacentSquares(board, square) {
    if (this.properties.fireBreathUses <= 0) return;
    
    const neighbors = board.getNeighbors ? board.getNeighbors(square) : [];
    for (const neighbor of neighbors) {
      const piece = board.getPiece(neighbor);
      if (piece && piece.color !== this.color && piece.type !== 'dragon') {
        // Burn the piece (remove it)
        board.setPiece(neighbor, null);
      }
    }
    
    this.properties.fireBreathUses--;
  }
}

class Wizard extends BasePiece {
  constructor(color, position) {
    super('wizard', color, position);
    this.properties = {
      abilities: ['teleport', 'spell_cast'],
      spellsRemaining: 3,
      teleportRange: 4
    };
  }

  getPossibleMoves(board, gameState) {
    const moves = [];
    
    if (!this.position) return moves;
    
    // Normal moves (like a knight)
    moves.push(...this.getKnightMoves(board));
    
    // Teleport moves (if spells remaining)
    if (this.properties.spellsRemaining > 0) {
      moves.push(...this.getTeleportMoves(board));
    }
    
    return moves;
  }

  getKnightMoves(board) {
    const moves = [];
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

  getTeleportMoves(board) {
    const moves = [];
    const allSquares = board.getValidSquares();
    
    for (const square of allSquares) {
      if (board.getDistance && board.getDistance(this.position, square) <= this.properties.teleportRange) {
        if (board.isEmpty(square)) {
          moves.push(square);
        }
      }
    }
    
    return moves;
  }

  onMove(from, to, board, gameState) {
    super.onMove(from, to, board, gameState);
    
    // Check if teleport was used
    if (this.isTeleportMove(from, to, board)) {
      this.properties.spellsRemaining--;
    }
  }

  isTeleportMove(from, to, board) {
    const knightMoves = this.getKnightMoves(board);
    return !knightMoves.includes(to);
  }
}

class Phoenix extends BasePiece {
  constructor(color, position) {
    super('phoenix', color, position);
    this.properties = {
      abilities: ['resurrect', 'fly'],
      hasResurrected: false,
      resurrectionsLeft: 1
    };
  }

  getPossibleMoves(board, gameState) {
    const moves = [];
    
    if (!this.position) return moves;
    
    // Phoenix moves like a bishop but can fly over pieces
    const directions = [
      [1, 1], [1, -1], [-1, 1], [-1, -1]
    ];
    
    for (const direction of directions) {
      moves.push(...this.getMovesInDirection(board, direction, 4));
    }
    
    return moves;
  }

  onBeingCaptured(capturingPiece, board, gameState) {
    super.onBeingCaptured(capturingPiece, board, gameState);
    
    // Phoenix can resurrect once
    if (this.properties.resurrectionsLeft > 0 && !this.properties.hasResurrected) {
      this.resurrect(board);
    }
  }

  resurrect(board) {
    // Find an empty square near the capture location
    const emptySquares = board.getValidSquares().filter(square => board.isEmpty(square));
    
    if (emptySquares.length > 0) {
      const randomSquare = emptySquares[Math.floor(Math.random() * emptySquares.length)];
      board.setPiece(randomSquare, this);
      this.position = randomSquare;
      this.properties.hasResurrected = true;
      this.properties.resurrectionsLeft--;
    }
  }
}

class Unicorn extends BasePiece {
  constructor(color, position) {
    super('unicorn', color, position);
    this.properties = {
      abilities: ['heal', 'purify'],
      healingPower: 2
    };
  }

  getPossibleMoves(board, gameState) {
    const moves = [];
    
    if (!this.position) return moves;
    
    // Unicorn moves like a combination of bishop and knight
    
    // Bishop-like moves (but only 2 squares)
    const directions = [
      [1, 1], [1, -1], [-1, 1], [-1, -1]
    ];
    
    for (const direction of directions) {
      moves.push(...this.getMovesInDirection(board, direction, 2));
    }
    
    // Knight-like moves
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

  onMove(from, to, board, gameState) {
    super.onMove(from, to, board, gameState);
    
    // Heal friendly pieces nearby
    this.healNearbyAllies(board, to);
  }

  healNearbyAllies(board, square) {
    const neighbors = board.getNeighbors ? board.getNeighbors(square) : [];
    
    for (const neighbor of neighbors) {
      const piece = board.getPiece(neighbor);
      if (piece && piece.color === this.color && piece.properties) {
        // Heal the piece (restore abilities, etc.)
        if (piece.properties.spellsRemaining !== undefined) {
          piece.properties.spellsRemaining = Math.min(
            piece.properties.spellsRemaining + 1,
            3 // Max spells
          );
        }
      }
    }
  }
}

class Assassin extends BasePiece {
  constructor(color, position) {
    super('assassin', color, position);
    this.properties = {
      abilities: ['stealth', 'backstab'],
      isInvisible: false,
      backstabDamage: 2
    };
  }

  getPossibleMoves(board, gameState) {
    const moves = [];
    
    if (!this.position) return moves;
    
    // Assassin moves like a king but can become invisible
    const neighbors = board.getNeighbors ? 
      board.getNeighbors(this.position) : 
      board.getKingMoves(this.position);
    
    for (const square of neighbors) {
      if (this.canMoveTo(square, board)) {
        moves.push(square);
      }
    }
    
    // Can also jump 2 squares when invisible
    if (this.properties.isInvisible) {
      const jumpMoves = this.getJumpMoves(board);
      moves.push(...jumpMoves);
    }
    
    return moves;
  }

  getJumpMoves(board) {
    const moves = [];
    const file = this.position.charCodeAt(0);
    const rank = parseInt(this.position[1]);
    
    // Can jump 2 squares in any direction
    const directions = [
      [0, 2], [0, -2], [2, 0], [-2, 0],
      [2, 2], [2, -2], [-2, 2], [-2, -2]
    ];
    
    for (const [df, dr] of directions) {
      const newFile = String.fromCharCode(file + df);
      const newRank = rank + dr;
      const newSquare = newFile + newRank;
      
      if (board.isValidSquare(newSquare) && this.canMoveTo(newSquare, board)) {
        moves.push(newSquare);
      }
    }
    
    return moves;
  }

  onMove(from, to, board, gameState) {
    super.onMove(from, to, board, gameState);
    
    // Toggle invisibility
    this.properties.isInvisible = !this.properties.isInvisible;
  }

  onCapture(capturedPiece, board, gameState) {
    super.onCapture(capturedPiece, board, gameState);
    
    // Backstab damage - might capture additional pieces
    if (this.properties.isInvisible) {
      const neighbors = board.getNeighbors ? board.getNeighbors(this.position) : [];
      for (const neighbor of neighbors) {
        const piece = board.getPiece(neighbor);
        if (piece && piece.color !== this.color && Math.random() < 0.3) {
          // 30% chance to eliminate adjacent enemy piece
          board.setPiece(neighbor, null);
        }
      }
    }
  }
}

module.exports = {
  Dragon,
  Wizard,
  Phoenix,
  Unicorn,
  Assassin
};
