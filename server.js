const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const RandomFens = require('./RandomFens');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Store active games and players
const games = new Map();
const players = new Map();

// Game state structure
class GameRoom {
  constructor(id, creatorId, creatorName) {
    this.id = id;
    this.players = new Map();
    // Randomly assign first player's color
    const firstPlayerColor = Math.random() < 0.5 ? 'white' : 'black';
    this.players.set(creatorId, {
      id: creatorId,
      name: creatorName,
      color: firstPlayerColor,
      timeLeft: 600 // 10 minutes in seconds
    });
    const randomFen = RandomFens.getWeightedRandomFen();
    console.log('🎲 Server generated FEN:', randomFen);
    
    this.gameState = {
      fen: randomFen,
      pgn: '',
      turn: 'w',
      gameOver: false,
      winner: null,
      timerRunning: false,
      lastMoveTime: null
    };
    this.createdAt = new Date();
    this.maxPlayers = 2;
  }

  addPlayer(playerId, playerName) {
    if (this.players.size >= this.maxPlayers) {
      return false;
    }

    // Get the opposite color of the first player
    const firstPlayer = Array.from(this.players.values())[0];
    const color = firstPlayer.color === 'white' ? 'black' : 'white';
    this.players.set(playerId, {
      id: playerId,
      name: playerName,
      color: color,
      timeLeft: 600
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

  // isReadyToStart method removed - game starts automatically on first move

  updateGameState(newFen, newPgn, turn, gameOver = false, winner = null) {
    this.gameState.fen = newFen;
    this.gameState.pgn = newPgn;
    this.gameState.turn = turn;
    this.gameState.gameOver = gameOver;
    this.gameState.winner = winner;
    this.gameState.lastMoveTime = new Date();
  }

  updatePlayerTime(playerId, timeLeft) {
    const player = this.players.get(playerId);
    if (player) {
      player.timeLeft = timeLeft;
    }
  }
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle player joining
  socket.on('join', (data) => {
    const { playerName, gameId } = data;
    players.set(socket.id, { name: playerName, gameId: gameId || null });
    
    if (gameId && games.has(gameId)) {
      // Joining existing game
      const game = games.get(gameId);
      const success = game.addPlayer(socket.id, playerName);
      
      if (success) {
        socket.join(gameId);
        socket.emit('joined_game', {
          gameId: gameId,
          playerId: socket.id,
          playerColor: game.getPlayer(socket.id).color,
          gameState: game.gameState,
          players: Array.from(game.players.values())
        });
        
        // Notify other players
        socket.to(gameId).emit('player_joined', {
          playerId: socket.id,
          playerName: playerName,
          players: Array.from(game.players.values())
        });
      } else {
        socket.emit('join_error', 'Game is full');
      }
    } else {
      // Try to find an existing game with only one player
      let joinedGame = false;
      for (let [id, game] of games) {
        if (game.players.size === 1) {
          const success = game.addPlayer(socket.id, playerName);
          if (success) {
            socket.join(id);
            players.set(socket.id, { name: playerName, gameId: id });
            
            socket.emit('joined_game', {
              gameId: id,
              playerId: socket.id,
              playerColor: game.getPlayer(socket.id).color,
              gameState: game.gameState,
              players: Array.from(game.players.values())
            });
            
            socket.to(id).emit('player_joined', {
              playerId: socket.id,
              playerName: playerName,
              players: Array.from(game.players.values())
            });
            
            joinedGame = true;
            break;
          }
        }
      }
      
      if (!joinedGame) {
        // No available games, create a new one
        const newGameId = uuidv4();
        const game = new GameRoom(newGameId, socket.id, playerName);
        games.set(newGameId, game);
        
        socket.join(newGameId);
        players.set(socket.id, { name: playerName, gameId: newGameId });
        
        socket.emit('joined_game', {
          gameId: newGameId,
          playerId: socket.id,
          playerColor: game.getPlayer(socket.id).color,
          gameState: game.gameState,
          players: Array.from(game.players.values())
        });
      }
    }
  });

  // Handle creating a new game
  socket.on('create_game', (data) => {
    const { playerName } = data;
    const gameId = uuidv4();
    const game = new GameRoom(gameId, socket.id, playerName);
    games.set(gameId, game);
    
    socket.join(gameId);
    players.set(socket.id, { name: playerName, gameId: gameId });
    
    socket.emit('joined_game', {
      gameId: gameId,
      playerId: socket.id,
      playerColor: game.getPlayer(socket.id).color,
      gameState: game.gameState,
      players: Array.from(game.players.values())
    });
  });

  // Handle player ready status (removed - game starts automatically on first move)

  // Handle moves
  socket.on('make_move', (data) => {
    const { gameId, from, to, promotion } = data;
    const game = games.get(gameId);
    
    if (game && !game.gameState.gameOver) {
      // Broadcast move to all players in the game
      io.to(gameId).emit('move_made', {
        from: from,
        to: to,
        promotion: promotion,
        playerId: socket.id,
        timestamp: new Date()
      });
    }
  });

  // Handle game state update
  socket.on('update_game_state', (data) => {
    const { gameId, fen, pgn, turn, gameOver, winner } = data;
    const game = games.get(gameId);
    
    if (game) {
      game.updateGameState(fen, pgn, turn, gameOver, winner);
      
      // Broadcast updated state to all players
      io.to(gameId).emit('game_state_updated', {
        fen: fen,
        pgn: pgn,
        turn: turn,
        gameOver: gameOver,
        winner: winner
      });
    }
  });

  // Handle timer updates
  socket.on('update_timer', (data) => {
    const { gameId, playerId, timeLeft } = data;
    const game = games.get(gameId);
    
    if (game) {
      game.updatePlayerTime(playerId, timeLeft);
      
      socket.to(gameId).emit('timer_updated', {
        playerId: playerId,
        timeLeft: timeLeft
      });
    }
  });

  // Handle chat messages
  socket.on('chat_message', (data) => {
    const { gameId, message } = data;
    const player = players.get(socket.id);
    
    if (player && gameId) {
      io.to(gameId).emit('chat_message', {
        playerId: socket.id,
        playerName: player.name,
        message: message,
        timestamp: new Date()
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    const player = players.get(socket.id);
    if (player && player.gameId) {
      const game = games.get(player.gameId);
      if (game) {
        game.removePlayer(socket.id);
        
        // Notify other players
        socket.to(player.gameId).emit('player_left', {
          playerId: socket.id,
          players: Array.from(game.players.values())
        });
        
        // Clean up empty games
        if (game.players.size === 0) {
          games.delete(player.gameId);
        }
      }
    }
    
    players.delete(socket.id);
  });
});

// Clean up old games (older than 24 hours)
setInterval(() => {
  const now = new Date();
  for (let [gameId, game] of games) {
    if (now - game.createdAt > 24 * 60 * 60 * 1000) {
      games.delete(gameId);
    }
  }
}, 60 * 60 * 1000); // Run every hour

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Chess game available at: http://localhost:${PORT}`);
});
