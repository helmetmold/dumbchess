// Win Condition Rules

class BaseWinCondition {
  check(gameState, board) {
    throw new Error('check method must be implemented by subclass');
  }

  getDescription() {
    return 'Base win condition';
  }

  getParameters() {
    return {};
  }
}

class CheckmateRule extends BaseWinCondition {
  check(gameState, board) {
    // Simplified checkmate detection
    // In a real implementation, this would check for actual checkmate
    
    // For now, just check if a king is missing (captured)
    const whiteKing = board.findKing('white');
    const blackKing = board.findKing('black');
    
    if (!whiteKing) {
      return {
        gameOver: true,
        winner: 'black',
        reason: 'White king captured (checkmate)'
      };
    }
    
    if (!blackKing) {
      return {
        gameOver: true,
        winner: 'white',
        reason: 'Black king captured (checkmate)'
      };
    }
    
    return { gameOver: false };
  }

  getDescription() {
    return 'Win by checkmating the opponent\'s king';
  }
}

class KingOfHillRule extends BaseWinCondition {
  constructor(centerSquares = ['d4', 'd5', 'e4', 'e5']) {
    super();
    this.centerSquares = centerSquares;
  }

  check(gameState, board) {
    for (const square of this.centerSquares) {
      const piece = board.getPiece(square);
      if (piece && piece.type === 'king') {
        return {
          gameOver: true,
          winner: piece.color,
          reason: `${piece.color} king reached the center`
        };
      }
    }
    return { gameOver: false };
  }

  getDescription() {
    return 'Win by moving your king to the center squares';
  }

  getParameters() {
    return {
      centerSquares: this.centerSquares
    };
  }
}

class CaptureAllRule extends BaseWinCondition {
  check(gameState, board) {
    const pieceCounts = { white: 0, black: 0 };
    
    // Count non-king pieces
    for (const square of board.getValidSquares()) {
      const piece = board.getPiece(square);
      if (piece && piece.type !== 'king') {
        pieceCounts[piece.color]++;
      }
    }
    
    if (pieceCounts.white === 0) {
      return {
        gameOver: true,
        winner: 'black',
        reason: 'All white pieces captured'
      };
    }
    
    if (pieceCounts.black === 0) {
      return {
        gameOver: true,
        winner: 'white',
        reason: 'All black pieces captured'
      };
    }
    
    return { gameOver: false };
  }

  getDescription() {
    return 'Win by capturing all opponent pieces (except king)';
  }
}

class ReachEndRule extends BaseWinCondition {
  constructor(targetRanks = { white: 8, black: 1 }) {
    super();
    this.targetRanks = targetRanks;
  }

  check(gameState, board) {
    // Check if any piece reached the opponent's end
    for (const square of board.getValidSquares()) {
      const piece = board.getPiece(square);
      if (!piece) continue;
      
      const rank = parseInt(square[1]);
      const targetRank = this.targetRanks[piece.color];
      
      if (rank === targetRank && piece.type !== 'king') {
        return {
          gameOver: true,
          winner: piece.color,
          reason: `${piece.color} ${piece.type} reached the end`
        };
      }
    }
    
    return { gameOver: false };
  }

  getDescription() {
    return 'Win by getting any piece to the opponent\'s end of the board';
  }

  getParameters() {
    return {
      targetRanks: this.targetRanks
    };
  }
}

class EliminationRule extends BaseWinCondition {
  constructor(targetPieces = ['king']) {
    super();
    this.targetPieces = targetPieces;
  }

  check(gameState, board) {
    for (const targetType of this.targetPieces) {
      const whitePieces = board.getPiecesByType(targetType).filter(p => p.piece.color === 'white');
      const blackPieces = board.getPiecesByType(targetType).filter(p => p.piece.color === 'black');
      
      if (whitePieces.length === 0) {
        return {
          gameOver: true,
          winner: 'black',
          reason: `All white ${targetType}s eliminated`
        };
      }
      
      if (blackPieces.length === 0) {
        return {
          gameOver: true,
          winner: 'white',
          reason: `All black ${targetType}s eliminated`
        };
      }
    }
    
    return { gameOver: false };
  }

  getDescription() {
    return `Win by eliminating all opponent ${this.targetPieces.join(', ')}s`;
  }

  getParameters() {
    return {
      targetPieces: this.targetPieces
    };
  }
}

class TimeLimitRule extends BaseWinCondition {
  constructor(timeLimit = 3600) { // 1 hour in seconds
    super();
    this.timeLimit = timeLimit;
  }

  check(gameState, board) {
    const gameTime = (new Date() - gameState.startTime) / 1000;
    
    if (gameTime >= this.timeLimit) {
      // Determine winner by material or other criteria
      const winner = this.determineWinnerByMaterial(board);
      
      return {
        gameOver: true,
        winner: winner,
        reason: 'Time limit reached'
      };
    }
    
    return { gameOver: false };
  }

  determineWinnerByMaterial(board) {
    let whiteMaterial = 0;
    let blackMaterial = 0;
    
    for (const square of board.getValidSquares()) {
      const piece = board.getPiece(square);
      if (piece) {
        const value = piece.getValue ? piece.getValue() : 0;
        if (piece.color === 'white') {
          whiteMaterial += value;
        } else {
          blackMaterial += value;
        }
      }
    }
    
    if (whiteMaterial > blackMaterial) return 'white';
    if (blackMaterial > whiteMaterial) return 'black';
    return 'draw';
  }

  getDescription() {
    return `Win by having more material when time limit (${this.timeLimit}s) is reached`;
  }

  getParameters() {
    return {
      timeLimit: this.timeLimit
    };
  }
}

class PointsRule extends BaseWinCondition {
  constructor(targetPoints = 50) {
    super();
    this.targetPoints = targetPoints;
  }

  check(gameState, board) {
    // Check if either player reached target points
    const whitePoints = gameState.points?.white || 0;
    const blackPoints = gameState.points?.black || 0;
    
    if (whitePoints >= this.targetPoints) {
      return {
        gameOver: true,
        winner: 'white',
        reason: `White reached ${this.targetPoints} points`
      };
    }
    
    if (blackPoints >= this.targetPoints) {
      return {
        gameOver: true,
        winner: 'black',
        reason: `Black reached ${this.targetPoints} points`
      };
    }
    
    return { gameOver: false };
  }

  getDescription() {
    return `Win by reaching ${this.targetPoints} points`;
  }

  getParameters() {
    return {
      targetPoints: this.targetPoints
    };
  }
}

module.exports = {
  BaseWinCondition,
  CheckmateRule,
  KingOfHillRule,
  CaptureAllRule,
  ReachEndRule,
  EliminationRule,
  TimeLimitRule,
  PointsRule
};
