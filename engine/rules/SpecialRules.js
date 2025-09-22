// Special Rules that modify gameplay

class BaseSpecialRule {
  apply(context) {
    throw new Error('apply method must be implemented by subclass');
  }

  getDescription() {
    return 'Base special rule';
  }

  getParameters() {
    return {};
  }
}

class AtomicRule extends BaseSpecialRule {
  apply(context) {
    const { move, board, gameState } = context;
    
    if (move.captured) {
      // Explode surrounding pieces when a capture occurs
      const neighbors = board.getNeighbors ? board.getNeighbors(move.to) : [];
      
      for (const square of neighbors) {
        const piece = board.getPiece(square);
        if (piece && piece.type !== 'pawn') {
          // Remove piece (explosion)
          board.setPiece(square, null);
          
          // Log explosion event
          if (!gameState.specialEvents) gameState.specialEvents = [];
          gameState.specialEvents.push({
            type: 'explosion',
            square: square,
            piece: piece.type,
            timestamp: new Date()
          });
        }
      }
      
      // Remove capturing piece too (except pawns)
      const capturingPiece = board.getPiece(move.to);
      if (capturingPiece && capturingPiece.type !== 'pawn') {
        board.setPiece(move.to, null);
      }
    }
    
    return context;
  }

  getDescription() {
    return 'When a piece is captured, surrounding pieces explode (except pawns)';
  }
}

class ZombieRule extends BaseSpecialRule {
  apply(context) {
    const { move, board, gameState } = context;
    
    if (move.captured && move.captured.type !== 'king') {
      // Convert captured piece to zombie of capturing player's color
      const zombiePiece = {
        type: 'zombie',
        color: board.getPiece(move.to).color,
        originalType: move.captured.type
      };
      
      // Find random empty square to place zombie
      const emptySquares = board.getValidSquares().filter(sq => board.isEmpty(sq));
      if (emptySquares.length > 0) {
        const randomSquare = emptySquares[Math.floor(Math.random() * emptySquares.length)];
        board.setPiece(randomSquare, zombiePiece);
        
        // Log zombie creation
        if (!gameState.specialEvents) gameState.specialEvents = [];
        gameState.specialEvents.push({
          type: 'zombie_created',
          square: randomSquare,
          originalType: move.captured.type,
          timestamp: new Date()
        });
      }
    }
    
    return context;
  }

  getDescription() {
    return 'Captured pieces become zombies fighting for the capturing player';
  }
}

class GravityRule extends BaseSpecialRule {
  apply(context) {
    const { move, board, gameState } = context;
    
    // After each move, apply gravity (pieces fall down)
    this.applyGravity(board);
    
    return context;
  }

  applyGravity(board) {
    const validSquares = board.getValidSquares();
    const changes = [];
    
    // For standard board, make pieces fall to lower ranks
    for (let rank = 2; rank <= 8; rank++) {
      for (let fileCode = 'a'.charCodeAt(0); fileCode <= 'h'.charCodeAt(0); fileCode++) {
        const file = String.fromCharCode(fileCode);
        const square = file + rank;
        
        if (!validSquares.includes(square)) continue;
        
        const piece = board.getPiece(square);
        if (piece) {
          // Find lowest empty square below
          let targetRank = rank;
          for (let r = rank - 1; r >= 1; r--) {
            const belowSquare = file + r;
            if (board.isEmpty(belowSquare)) {
              targetRank = r;
            } else {
              break;
            }
          }
          
          if (targetRank < rank) {
            const targetSquare = file + targetRank;
            changes.push({ from: square, to: targetSquare, piece });
          }
        }
      }
    }
    
    // Apply all gravity changes
    for (const change of changes) {
      board.movePiece(change.from, change.to);
    }
  }

  getDescription() {
    return 'Pieces fall down due to gravity after each move';
  }
}

class FogOfWarRule extends BaseSpecialRule {
  apply(context) {
    const { move, board, gameState, playerId } = context;
    
    // Hide opponent pieces that are not visible
    if (!gameState.visibility) {
      gameState.visibility = { white: new Set(), black: new Set() };
    }
    
    const player = gameState.players?.find(p => p.id === playerId);
    if (player) {
      this.updateVisibility(board, gameState, player.color);
    }
    
    return context;
  }

  updateVisibility(board, gameState, playerColor) {
    const visibleSquares = new Set();
    
    // Each piece can see squares it can move to
    for (const square of board.getValidSquares()) {
      const piece = board.getPiece(square);
      if (piece && piece.color === playerColor) {
        visibleSquares.add(square);
        
        // Add squares this piece can see
        if (piece.getPossibleMoves) {
          const moves = piece.getPossibleMoves(board, gameState);
          moves.forEach(move => visibleSquares.add(move));
        }
        
        // Add adjacent squares
        const neighbors = board.getNeighbors ? board.getNeighbors(square) : [];
        neighbors.forEach(neighbor => visibleSquares.add(neighbor));
      }
    }
    
    gameState.visibility[playerColor] = visibleSquares;
  }

  getDescription() {
    return 'Players can only see pieces within range of their own pieces';
  }
}

class MutationRule extends BaseSpecialRule {
  constructor(mutationChance = 0.1) {
    super();
    this.mutationChance = mutationChance;
  }

  apply(context) {
    const { move, board, gameState } = context;
    
    // Random chance for pieces to mutate after moving
    if (Math.random() < this.mutationChance) {
      const piece = board.getPiece(move.to);
      if (piece && piece.type !== 'king') {
        const newType = this.getRandomMutation(piece.type);
        if (newType !== piece.type) {
          piece.type = newType;
          
          // Log mutation
          if (!gameState.specialEvents) gameState.specialEvents = [];
          gameState.specialEvents.push({
            type: 'mutation',
            square: move.to,
            oldType: move.piece,
            newType: newType,
            timestamp: new Date()
          });
        }
      }
    }
    
    return context;
  }

  getRandomMutation(currentType) {
    const standardPieces = ['pawn', 'knight', 'bishop', 'rook', 'queen'];
    const fantasyPieces = ['dragon', 'wizard', 'phoenix', 'unicorn'];
    
    const allPieces = [...standardPieces, ...fantasyPieces];
    const availableMutations = allPieces.filter(type => type !== currentType);
    
    return availableMutations[Math.floor(Math.random() * availableMutations.length)];
  }

  getDescription() {
    return `Pieces have a ${this.mutationChance * 100}% chance to mutate into different pieces when moving`;
  }

  getParameters() {
    return {
      mutationChance: this.mutationChance
    };
  }
}

class TeleportRule extends BaseSpecialRule {
  constructor(teleportChance = 0.05) {
    super();
    this.teleportChance = teleportChance;
  }

  apply(context) {
    const { move, board, gameState } = context;
    
    // Random chance for pieces to teleport instead of normal move
    if (Math.random() < this.teleportChance) {
      const piece = board.getPiece(move.to);
      if (piece) {
        const emptySquares = board.getValidSquares().filter(sq => board.isEmpty(sq));
        if (emptySquares.length > 0) {
          const randomSquare = emptySquares[Math.floor(Math.random() * emptySquares.length)];
          
          // Teleport piece
          board.setPiece(move.to, null);
          board.setPiece(randomSquare, piece);
          piece.position = randomSquare;
          
          // Log teleport
          if (!gameState.specialEvents) gameState.specialEvents = [];
          gameState.specialEvents.push({
            type: 'teleport',
            from: move.to,
            to: randomSquare,
            piece: piece.type,
            timestamp: new Date()
          });
        }
      }
    }
    
    return context;
  }

  getDescription() {
    return `Pieces have a ${this.teleportChance * 100}% chance to teleport to a random square after moving`;
  }

  getParameters() {
    return {
      teleportChance: this.teleportChance
    };
  }
}

class MultiTurnRule extends BaseSpecialRule {
  apply(context) {
    const { move, board, gameState } = context;
    
    // Some pieces get extra turns
    const piece = board.getPiece(move.to);
    if (piece && this.shouldGetExtraTurn(piece)) {
      // Don't switch turns
      gameState.extraTurn = true;
      
      // Log extra turn
      if (!gameState.specialEvents) gameState.specialEvents = [];
      gameState.specialEvents.push({
        type: 'extra_turn',
        piece: piece.type,
        square: move.to,
        timestamp: new Date()
      });
    }
    
    return context;
  }

  shouldGetExtraTurn(piece) {
    // Knights and wizards get extra turns on captures
    return (piece.type === 'knight' || piece.type === 'wizard') && piece.justCaptured;
  }

  getDescription() {
    return 'Certain pieces get extra turns when they capture';
  }
}

module.exports = {
  BaseSpecialRule,
  AtomicRule,
  ZombieRule,
  GravityRule,
  FogOfWarRule,
  MutationRule,
  TeleportRule,
  MultiTurnRule
};
