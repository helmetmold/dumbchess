const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const GamemodeFactory = require('./gamemodes/GamemodeFactory');

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

// API endpoint to get available gamemodes
app.get('/api/gamemodes', (req, res) => {
  try {
    const gamemodes = GamemodeFactory.getAvailableGamemodes();
    res.json(gamemodes);
  } catch (error) {
    console.error('Error getting gamemodes:', error);
    res.status(500).json({ error: 'Failed to get gamemodes' });
  }
});

// API endpoint to get gamemode info
app.get('/api/gamemodes/:id', (req, res) => {
  try {
    const info = GamemodeFactory.getGamemodeInfo(req.params.id);
    res.json(info);
  } catch (error) {
    console.error('Error getting gamemode info:', error);
    res.status(404).json({ error: 'Gamemode not found' });
  }
});

// API endpoint to get gamemode statistics
app.get('/api/stats', (req, res) => {
  try {
    const stats = GamemodeFactory.getGamemodeStats();
    res.json({
      ...stats,
      activeGames: games.size,
      activePlayers: players.size
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// API endpoint to get random gamemode
app.get('/api/random-gamemode', (req, res) => {
  try {
    const randomGamemode = GamemodeFactory.getRandomGamemodeWithInfo();
    res.json(randomGamemode);
  } catch (error) {
    console.error('Error getting random gamemode:', error);
    res.status(500).json({ error: 'Failed to get random gamemode' });
  }
});

// API endpoint to get today's featured gamemode
app.get('/api/featured', (req, res) => {
  try {
    const featuredId = GamemodeFactory.getTodaysFeaturedGamemode();
    const featuredInfo = GamemodeFactory.getGamemodeInfo(featuredId);
    res.json({
      id: featuredId,
      ...featuredInfo,
      isFeatured: true
    });
  } catch (error) {
    console.error('Error getting featured gamemode:', error);
    res.status(500).json({ error: 'Failed to get featured gamemode' });
  }
});

// Helper function to get gamemode ID from game instance
function getGamemodeIdFromGame(game) {
  const className = game.constructor.name.toLowerCase();
  
  // Map class names to gamemode IDs
  const classToId = {
    'dumbchess': 'dumb-chess',
    'dragonchess': 'dragon-chess',
    'blitzchess': 'blitz',
    'kingofthehill': 'king-of-hill',
    'atomicchess': 'atomic',
    'fantasychess': 'fantasy'
  };
  
  return classToId[className] || className;
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle player joining
  socket.on('join', async (data) => {
    try {
      const { playerName, gameId, gamemode = 'random' } = data; // Default to random
      players.set(socket.id, { name: playerName, gameId: gameId || null });
      
      let game;
      let selectedGamemode = gamemode;
      let wasRandom = false;
      
      // Handle random gamemode selection - TEMPORARILY FORCE FANTASY CHESS FOR DEBUGGING
      if (gamemode === 'random' || gamemode === undefined || gamemode === 'dumb-chess') {
        selectedGamemode = 'fantasy'; // Force Fantasy Chess for debugging
        wasRandom = true;
        console.log(`🧙‍♂️ DEBUGGING: Forcing Fantasy Chess for ${playerName}`);
      }
      
      if (gameId) {
        // Joining existing game by ID
        game = games.get(gameId);
        if (!game) {
          socket.emit('join_error', 'Game not found');
          return;
        }
        
        const success = game.addPlayer(socket.id, playerName);
        if (!success) {
          socket.emit('join_error', 'Game is full');
          return;
        }
        
      } else {
        // Try to find ANY available game first (prioritize matching over gamemode preference)
        let foundGame = false;
        
        // First, try to find any game with space
        for (let [id, existingGame] of games) {
          const existingGameInfo = existingGame.getGamemodeInfo();
          const hasSpace = existingGame.players.size < existingGame.config.maxPlayers;
          
          console.log(`🔍 Checking existing game: ${existingGameInfo.name}, hasSpace: ${hasSpace}`);
          
          if (hasSpace) {
            game = existingGame;
            const success = game.addPlayer(socket.id, playerName);
            if (success) {
              foundGame = true;
              console.log(`✅ Matched ${playerName} with existing ${existingGameInfo.name} game (any available)`);
              // Override the selected gamemode with the existing game's gamemode
              selectedGamemode = getGamemodeIdFromGame(existingGame);
              wasRandom = false; // Don't show random notification since they're joining existing
              break;
            }
          }
        }
        
        if (!foundGame) {
          // No available games, create new game with random gamemode
          const newGameId = uuidv4();
          
          try {
            game = GamemodeFactory.createGame(selectedGamemode, newGameId, socket.id, playerName);
            games.set(newGameId, game);
            
            // Log the gamemode selection
            if (wasRandom) {
              console.log(`🎮 Created random ${game.getGamemodeInfo().name} game: ${newGameId} (first player)`);
            } else {
              console.log(`🎮 Created ${game.getGamemodeInfo().name} game: ${newGameId}`);
            }
            
            // Start the game if it has setup methods
            if (game.onGameStart) {
              game.onGameStart();
            }
            
          } catch (error) {
            console.error('Error creating game:', error);
            socket.emit('join_error', `Invalid gamemode: ${selectedGamemode}`);
            return;
          }
        }
      }
      
      socket.join(game.id);
      players.set(socket.id, { name: playerName, gameId: game.id });
      
      // Send game data to player (including random gamemode info)
      const gameData = {
        gameId: game.id,
        playerId: socket.id,
        playerColor: game.getPlayer(socket.id).color,
        gameState: game.gameState,
        players: Array.from(game.players.values()),
        gamemode: game.getGamemodeInfo(),
        wasRandom: wasRandom // Let the client know it was random
      };

      // Send custom board position for Fantasy Chess
      if (game.getGamemodeInfo().name === 'Fantasy Chess') {
        console.log(`📋 Sending Fantasy Chess FEN: ${game.gameState.fen}`);
      }

      socket.emit('joined_game', gameData);
      
      // Notify other players if game has multiple players
      if (game.players.size > 1) {
        socket.to(game.id).emit('player_joined', {
          playerId: socket.id,
          playerName: playerName,
          players: Array.from(game.players.values()),
          gamemode: game.getGamemodeInfo() // Include gamemode info
        });
      }
      
    } catch (error) {
      console.error('Error in join handler:', error);
      socket.emit('join_error', 'Server error occurred');
    }
  });

  // Handle moves
  socket.on('make_move', async (data) => {
    try {
      const { gameId, from, to, promotion } = data;
      const game = games.get(gameId);
      
      if (!game || game.gameState.gameOver) {
        return;
      }
      
      // Validate it's the player's turn
      const player = game.getPlayer(socket.id);
      if (!player || player.color !== game.gameState.turn) {
        return;
      }
      
      // Make the move using the game engine
      const move = game.makeMove(from, to, promotion);
      if (!move) {
        return; // Invalid move
      }
      
      // Broadcast move to all players in the game
      const moveData = {
        from: from,
        to: to,
        promotion: promotion,
        playerId: socket.id,
        timestamp: new Date(),
        gameState: game.gameState
      };

      // Temporarily disable custom board position updates for debugging
      // if (game.getGamemodeInfo().customPieces || game.getGamemodeInfo().boardShape !== 'standard') {
      //   moveData.gameState.boardPosition = game.board ? game.board.toJSON() : {};
      //   console.log(`📋 Sending updated board position after move`);
      // }

      io.to(gameId).emit('move_made', moveData);
      
      // Check if game ended
      if (game.gameState.gameOver) {
        io.to(gameId).emit('game_over', {
          winner: game.gameState.winner,
          reason: game.gameState.winReason,
          gameState: game.gameState
        });
      }
      
    } catch (error) {
      console.error('Error in make_move handler:', error);
    }
  });

  // Handle game state update (for compatibility with existing frontend)
  socket.on('update_game_state', async (data) => {
    try {
      const { gameId, fen, pgn, turn, gameOver, winner } = data;
      const game = games.get(gameId);
      
      if (game) {
        // Update game state
        game.gameState.fen = fen;
        game.gameState.pgn = pgn;
        game.gameState.turn = turn;
        game.gameState.gameOver = gameOver;
        game.gameState.winner = winner;
        
        // Broadcast updated state to all players
        io.to(gameId).emit('game_state_updated', {
          fen: fen,
          pgn: pgn,
          turn: turn,
          gameOver: gameOver,
          winner: winner
        });
      }
    } catch (error) {
      console.error('Error in update_game_state handler:', error);
    }
  });

  // Handle timer updates
  socket.on('update_timer', async (data) => {
    try {
      const { gameId, playerId, timeLeft } = data;
      const game = games.get(gameId);
      
      if (game) {
        game.updatePlayerTime(playerId, timeLeft);
        
        socket.to(gameId).emit('timer_updated', {
          playerId: playerId,
          timeLeft: timeLeft
        });
      }
    } catch (error) {
      console.error('Error in update_timer handler:', error);
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

  // Handle special gamemode events
  socket.on('special_ability', async (data) => {
    try {
      const { gameId, ability, target } = data;
      const game = games.get(gameId);
      
      if (game && game.handleSpecialAbility) {
        const result = game.handleSpecialAbility(socket.id, ability, target);
        
        if (result.success) {
          io.to(gameId).emit('special_event', {
            playerId: socket.id,
            ability: ability,
            target: target,
            result: result,
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error in special_ability handler:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    try {
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
    } catch (error) {
      console.error('Error in disconnect handler:', error);
    }
  });
});

// Clean up old games (older than 24 hours)
setInterval(async () => {
  try {
    const now = new Date();
    const gamesToDelete = [];
    
    for (let [gameId, game] of games) {
      const gameAge = now - game.createdAt;
      const isOld = gameAge > 24 * 60 * 60 * 1000; // 24 hours
      const isEmpty = game.players.size === 0;
      const isFinished = game.gameState.gameOver;
      
      if (isOld || (isEmpty && isFinished)) {
        gamesToDelete.push(gameId);
      }
    }
    
    for (const gameId of gamesToDelete) {
      games.delete(gameId);
    }
    
    if (gamesToDelete.length > 0) {
      console.log(`Cleaned up ${gamesToDelete.length} old games`);
    }
  } catch (error) {
    console.error('Error cleaning up old games:', error);
  }
}, 60 * 60 * 1000); // Run every hour

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    activeGames: games.size,
    activePlayers: players.size,
    availableGamemodes: GamemodeFactory.getAvailableGamemodes().length
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Dumb Chess Server running on port ${PORT}`);
  console.log(`🎮 Game available at: http://localhost:${PORT}`);
  console.log(`🎲 Random gamemode system enabled!`);
  
  const availableGamemodes = GamemodeFactory.getAvailableGamemodes();
  console.log(`📋 Available gamemodes (${availableGamemodes.length}):`);
  availableGamemodes.forEach(gm => {
    console.log(`   • ${gm.name} - ${gm.description}`);
  });
  
  const todaysFeatured = GamemodeFactory.getTodaysFeaturedGamemode();
  console.log(`⭐ Today's featured gamemode: ${GamemodeFactory.getGamemodeInfo(todaysFeatured).name}`);
  console.log(`🎯 API endpoints: /api/gamemodes, /api/random-gamemode, /api/featured, /api/stats`);
});
