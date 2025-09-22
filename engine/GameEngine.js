// Core Game Engine Base Class
class GameEngine {
  constructor(gameId, creatorId, creatorName, config = {}) {
    this.id = gameId;
    this.players = new Map();
    this.createdAt = new Date();
    
    // Core configuration
    this.config = {
      maxPlayers: 2,
      timeControl: { initial: 600, increment: 0 },
      boardShape: 'standard', // standard, hexagonal, circular, custom
      boardSize: { width: 8, height: 8 },
      winConditions: ['checkmate'],
      specialRules: [],
      ...config
    };
    
    // Game components
    this.board = this.initializeBoard();
    this.pieces = this.initializePieces();
    this.rules = this.initializeRules();
    this.gameState = this.initializeGameState();
    
    this.addPlayer(creatorId, creatorName);
  }

  // Abstract methods - must be implemented by subclasses
  initializeBoard() {
    throw new Error('initializeBoard must be implemented by subclass');
  }

  initializePieces() {
    throw new Error('initializePieces must be implemented by subclass');
  }

  initializeRules() {
    throw new Error('initializeRules must be implemented by subclass');
  }

  initializeGameState() {
    throw new Error('initializeGameState must be implemented by subclass');
  }

  // Common methods all gamemodes share
  addPlayer(playerId, playerName) {
    if (this.players.size >= this.config.maxPlayers) {
      return false;
    }

    const color = this.assignPlayerColor(playerId);
    this.players.set(playerId, {
      id: playerId,
      name: playerName,
      color: color,
      timeLeft: this.config.timeControl.initial
    });
    return true;
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
  }

  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  getOpponent(playerId) {
    for (let [id, player] of this.players) {
      if (id !== playerId) {
        return player;
      }
    }
    return null;
  }

  assignPlayerColor(playerId) {
    // Default: first player gets random color, second gets opposite
    if (this.players.size === 0) {
      return Math.random() < 0.5 ? 'white' : 'black';
    } else {
      const firstPlayer = Array.from(this.players.values())[0];
      return firstPlayer.color === 'white' ? 'black' : 'white';
    }
  }

  // Core game logic
  isValidMove(from, to, piece, gameState) {
    const pieceRules = this.pieces[piece.type];
    if (!pieceRules) return false;
    
    return pieceRules.isValidMove(from, to, piece, gameState, this.board);
  }

  makeMove(from, to, promotion = null) {
    // Validate move
    const piece = this.board.getPiece(from);
    if (!piece || !this.isValidMove(from, to, piece, this.gameState)) {
      return null;
    }

    // Execute move
    const move = {
      from,
      to,
      piece: piece.type,
      captured: this.board.getPiece(to),
      promotion,
      timestamp: new Date()
    };

    this.board.movePiece(from, to);
    
    // Handle promotion
    if (promotion) {
      this.board.setPiece(to, { type: promotion, color: piece.color });
    }

    // Apply special rules
    for (const ruleName of this.config.specialRules) {
      this.rules.applySpecialRule(ruleName, { move, board: this.board, gameState: this.gameState });
    }

    // Update game state
    this.updateGameState(move);
    
    // Check win conditions
    this.checkWinConditions();
    
    // Call hook
    this.onMove(move, piece.color);
    
    return move;
  }

  updateGameState(move) {
    this.gameState.moveHistory.push(move);
    this.gameState.turn = this.gameState.turn === 'white' ? 'black' : 'white';
    this.gameState.lastMoveTime = new Date();
  }

  checkWinConditions() {
    for (const condition of this.config.winConditions) {
      const result = this.rules.checkWinCondition(condition, this.gameState, this.board);
      if (result.gameOver) {
        this.gameState.gameOver = true;
        this.gameState.winner = result.winner;
        this.gameState.winReason = result.reason;
        this.onGameEnd(result.winner);
        break;
      }
    }
  }

  updatePlayerTime(playerId, timeLeft) {
    const player = this.players.get(playerId);
    if (player) {
      player.timeLeft = timeLeft;
    }
  }

  // Compatibility method for server integration
  updateGameState(newFen, newPgn, turn, gameOver = false, winner = null) {
    this.gameState.fen = newFen;
    this.gameState.pgn = newPgn;
    this.gameState.turn = turn;
    this.gameState.gameOver = gameOver;
    this.gameState.winner = winner;
    this.gameState.lastMoveTime = new Date();
  }

  // Hook methods - can be overridden by subclasses
  onGameStart() {
    console.log(`Game ${this.id} started`);
  }

  onMove(move, playerId) {
    console.log(`Move made in game ${this.id}:`, move);
  }

  onGameEnd(winner) {
    console.log(`Game ${this.id} ended. Winner: ${winner}`);
  }

  onSpecialEvent(event) {
    console.log(`Special event in game ${this.id}:`, event);
  }

  // Utility methods
  toJSON() {
    return {
      id: this.id,
      config: this.config,
      players: Array.from(this.players.values()),
      gameState: this.gameState,
      createdAt: this.createdAt
    };
  }
}

module.exports = GameEngine;
