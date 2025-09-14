// Simple Online Chess Game
class SimpleChessGame {
    constructor() {
        this.socket = null;
        this.gameId = null;
        this.playerId = null;
        this.playerColor = null;
        this.playerName = '';
        this.opponentName = '';
        this.game = null;
        this.board = null;
        this.gameStarted = false;
        this.isConnected = false;
        
        // Timer variables
        this.whiteTime = 600; // 10 minutes
        this.blackTime = 600;
        this.currentTimer = null;
        this.isTimerRunning = false;
        
        this.init();
    }

    init() {
        this.initializeSocket();
        this.initializeGame();
        this.setupEventListeners();
        this.updateTimerDisplay();
    }

    initializeSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.isConnected = true;
            this.updateConnectionStatus();
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.isConnected = false;
            this.updateConnectionStatus();
        });

        this.socket.on('joined_game', (data) => {
            this.gameId = data.gameId;
            this.playerId = data.playerId;
            this.playerColor = data.playerColor;
            this.updatePlayerInfo(data.players);
            
            // Load the random starting position if provided
            if (data.gameState && data.gameState.fen) {
                console.log('Loading random starting position:', data.gameState.fen);
                this.game.load(data.gameState.fen);
                this.board.position(data.gameState.fen);
            }
            
            // Set board orientation after a short delay to ensure board is ready
            setTimeout(() => {
                this.setBoardOrientation();
            }, 100);
            this.hideConnectionDialog();
            this.updateGameStatus('Waiting for opponent to join...');
        });

        this.socket.on('player_joined', (data) => {
            this.updatePlayerInfo(data.players);
            if (data.players.length === 2) {
                this.updateGameStatus('Both players connected! Game will start when white makes the first move.');
                document.getElementById('resignBtn').disabled = false;
            } else {
                this.updateGameStatus('Waiting for opponent to join...');
            }
        });

        this.socket.on('player_ready', (data) => {
            this.updatePlayerInfo(data.players);
            this.updateGameStatus('Waiting for other player to be ready...');
        });

        this.socket.on('game_start', (data) => {
            this.gameStarted = true;
            this.updatePlayerInfo(data.players);
            this.startTimer();
            this.updateGameStatus('Game started! Good luck!');
            document.getElementById('readyBtn').disabled = true;
            document.getElementById('readyBtn').textContent = 'Ready!';
            document.getElementById('resignBtn').disabled = false;
        });

        this.socket.on('move_made', (data) => {
            if (data.playerId !== this.playerId) {
                this.handleRemoteMove(data);
            }
        });

        this.socket.on('game_state_updated', (data) => {
            this.updateGameState(data);
        });

        this.socket.on('timer_updated', (data) => {
            if (data.playerId !== this.playerId) {
                if (data.playerId === this.getOpponentId()) {
                    if (this.playerColor === 'white') {
                        this.blackTime = data.timeLeft;
                    } else {
                        this.whiteTime = data.timeLeft;
                    }
                    this.updateTimerDisplay();
                }
            }
        });

        this.socket.on('chat_message', (data) => {
            this.addChatMessage(data);
        });

        this.socket.on('player_left', (data) => {
            this.updatePlayerInfo(data.players);
            if (data.players.length < 2) {
                this.gameStarted = false;
                this.stopTimer();
                this.updateGameStatus('Opponent left the game.');
                document.getElementById('readyBtn').disabled = true;
                document.getElementById('resignBtn').disabled = true;
            }
        });

        this.socket.on('join_error', (message) => {
            alert('Error: ' + message);
        });
    }

    initializeGame() {
        this.game = new Chess();
        
        const config = {
            showErrors: true,
            draggable: true,
            position: 'start',
            onDragStart: this.onDragStart.bind(this),
            onDrop: this.onDrop.bind(this),
            onSnapEnd: this.onSnapEnd.bind(this),
            onClick: this.onClick.bind(this)
        };

        this.board = new ChessBoard('board', config);
    }

    setupEventListeners() {
        // Connection dialog events
        document.getElementById('connectBtn').addEventListener('click', () => {
            this.connectToRandomGame();
        });

        document.getElementById('createGameBtn').addEventListener('click', () => {
            this.createNewGame();
        });

        document.getElementById('joinGameBtn').addEventListener('click', () => {
            this.joinExistingGame();
        });

        // Game control events
        document.getElementById('readyBtn').addEventListener('click', () => {
            this.markReady();
        });

        document.getElementById('resignBtn').addEventListener('click', () => {
            this.resignGame();
        });

        // Chat events
        document.getElementById('sendChatBtn').addEventListener('click', () => {
            this.sendChatMessage();
        });

        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });
    }

    connectToRandomGame() {
        const playerName = document.getElementById('playerName').value.trim();
        if (!playerName) {
            alert('Please enter your name');
            return;
        }

        this.playerName = playerName;
        this.socket.emit('join', { playerName: playerName });
    }

    createNewGame() {
        const playerName = document.getElementById('playerName').value.trim();
        if (!playerName) {
            alert('Please enter your name');
            return;
        }

        this.playerName = playerName;
        this.socket.emit('create_game', { playerName: playerName });
    }

    joinExistingGame() {
        const playerName = document.getElementById('playerName').value.trim();
        const gameId = document.getElementById('gameId').value.trim();
        
        if (!playerName) {
            alert('Please enter your name');
            return;
        }
        
        if (!gameId) {
            alert('Please enter a game ID');
            return;
        }

        this.playerName = playerName;
        this.socket.emit('join', { playerName: playerName, gameId: gameId });
    }

    markReady() {
        if (this.gameId) {
            this.socket.emit('player_ready', { gameId: this.gameId });
        }
    }

    resignGame() {
        if (this.gameId && this.gameStarted) {
            const winner = this.playerColor === 'white' ? 'black' : 'white';
            this.socket.emit('update_game_state', {
                gameId: this.gameId,
                fen: this.game.fen(),
                pgn: this.game.pgn(),
                turn: this.game.turn(),
                gameOver: true,
                winner: winner
            });
            this.updateGameStatus(`You resigned. ${winner === 'white' ? 'White' : 'Black'} wins!`);
        }
    }

    sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (message && this.gameId) {
            this.socket.emit('chat_message', {
                gameId: this.gameId,
                message: message
            });
            input.value = '';
        }
    }

    onDragStart(source, piece, position, orientation) {
        if (this.game.game_over()) {
            return false;
        }

        // Check if it's the player's turn (or if game hasn't started yet, allow white to start)
        const isPlayerTurn = (this.playerColor === 'white' && this.game.turn() === 'w') ||
                            (this.playerColor === 'black' && this.game.turn() === 'b') ||
                            (!this.gameStarted && this.playerColor === 'white' && this.game.turn() === 'w');
        
        if (!isPlayerTurn) {
            return false;
        }

        // Check if player is trying to move their own piece
        const pieceColor = piece.charAt(0);
        const playerPieceColor = this.playerColor === 'white' ? 'w' : 'b';
        
        return pieceColor === playerPieceColor;
    }

    onDrop(source, target) {
        // Allow moves even if game hasn't started yet (for first move)
        if (this.game.game_over()) return 'snapback';

        const move = this.game.move({
            from: source,
            to: target,
            promotion: 'q' // Always promote to queen for simplicity
        });

        if (move === null) return 'snapback';

        // Start the game on first move if not already started
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.startTimer();
            this.updateGameStatus('Game started! Good luck!');
            document.getElementById('readyBtn').disabled = true;
            document.getElementById('readyBtn').textContent = 'Game Started!';
        }

        // Send move to server
        if (this.gameId) {
            this.socket.emit('make_move', {
                gameId: this.gameId,
                from: source,
                to: target,
                promotion: 'q'
            });

            // Update game state on server
            this.socket.emit('update_game_state', {
                gameId: this.gameId,
                fen: this.game.fen(),
                pgn: this.game.pgn(),
                turn: this.game.turn(),
                gameOver: this.game.game_over(),
                winner: this.game.game_over() ? (this.game.turn() === 'w' ? 'black' : 'white') : null
            });

            // Update local timer
            this.updateLocalTimer();
        }

        return true;
    }

    onSnapEnd() {
        this.board.position(this.game.fen());
    }

    onClick(source, target) {
        // Handle piece clicking for mobile devices
        if (source && target) {
            this.onDrop(source, target);
        }
    }

    handleRemoteMove(data) {
        const move = this.game.move({
            from: data.from,
            to: data.to,
            promotion: data.promotion
        });

        if (move) {
            this.board.position(this.game.fen());
            this.updateLocalTimer();
        }
    }

    updateGameState(data) {
        console.log('Received game state update:', data);
        console.log('Current game FEN:', this.game.fen());
        console.log('New FEN:', data.fen);
        
        if (data.fen !== this.game.fen()) {
            console.log('Updating game state with new FEN');
            this.game.load(data.fen);
            this.board.position(data.fen);
        } else {
            console.log('FEN is the same, no update needed');
        }

        if (data.gameOver) {
            this.gameStarted = false;
            this.stopTimer();
            
            if (data.winner === this.playerColor) {
                this.updateGameStatus('Congratulations! You won!');
            } else if (data.winner) {
                this.updateGameStatus(`Game over! ${data.winner === 'white' ? 'White' : 'Black'} wins!`);
            } else {
                this.updateGameStatus('Game ended in a draw!');
            }
        }
    }

    setBoardOrientation() {
        if (this.board && this.playerColor) {
            // Set board orientation so the player's pieces are at the bottom
            // For white players: use 'white' orientation (white pieces at bottom)
            // For black players: use 'black' orientation (black pieces at bottom)
            console.log('Setting board orientation for player color:', this.playerColor);
            console.log('Current board orientation before change:', this.board.orientation());
            
            // Try to set orientation - chessboard.js uses 'white' and 'black' as orientation values
            try {
                this.board.orientation(this.playerColor);
                console.log('Board orientation after change:', this.board.orientation());
            } catch (error) {
                console.error('Error setting board orientation:', error);
                // Fallback: try to flip the board if setting orientation fails
                if (this.playerColor === 'black') {
                    this.board.flip();
                    console.log('Used flip() method for black player');
                }
            }
        }
    }

    updatePlayerInfo(players) {
        if (players.length >= 1) {
            const player1 = players[0];
            if (player1.color === 'white') {
                document.getElementById('whitePlayerName').textContent = player1.name;
                document.getElementById('whiteProfilePic').textContent = player1.name.charAt(0).toUpperCase();
                if (player1.id === this.playerId) {
                    this.opponentName = players.length > 1 ? players[1].name : 'Waiting...';
                }
            } else {
                document.getElementById('blackPlayerName').textContent = player1.name;
                document.getElementById('blackProfilePic').textContent = player1.name.charAt(0).toUpperCase();
                if (player1.id === this.playerId) {
                    this.opponentName = players.length > 1 ? players[1].name : 'Waiting...';
                }
            }
        }

        if (players.length >= 2) {
            const player2 = players[1];
            if (player2.color === 'white') {
                document.getElementById('whitePlayerName').textContent = player2.name;
                document.getElementById('whiteProfilePic').textContent = player2.name.charAt(0).toUpperCase();
            } else {
                document.getElementById('blackPlayerName').textContent = player2.name;
                document.getElementById('blackProfilePic').textContent = player2.name.charAt(0).toUpperCase();
            }
        }

        // Enable chat when connected to a game
        if (players.length > 0) {
            document.getElementById('chatInput').disabled = false;
            document.getElementById('sendChatBtn').disabled = false;
        }
    }

    getOpponentId() {
        // This would need to be tracked from the player info updates
        // For now, we'll handle timer updates differently
        return null;
    }

    updateLocalTimer() {
        if (this.gameStarted && this.isTimerRunning) {
            const currentTime = Date.now();
            if (this.lastMoveTime) {
                const timeDiff = Math.floor((currentTime - this.lastMoveTime) / 1000);
                
                if (this.game.turn() === 'b') {
                    this.whiteTime = Math.max(0, this.whiteTime - timeDiff);
                } else {
                    this.blackTime = Math.max(0, this.blackTime - timeDiff);
                }
                
                this.updateTimerDisplay();
                
                // Send timer update to server
                if (this.gameId) {
                    this.socket.emit('update_timer', {
                        gameId: this.gameId,
                        playerId: this.playerId,
                        timeLeft: this.playerColor === 'white' ? this.whiteTime : this.blackTime
                    });
                }
                
                // Check for time out
                if (this.whiteTime <= 0) {
                    this.gameStarted = false;
                    this.stopTimer();
                    this.updateGameStatus('Black wins on time!');
                    this.socket.emit('update_game_state', {
                        gameId: this.gameId,
                        fen: this.game.fen(),
                        pgn: this.game.pgn(),
                        turn: this.game.turn(),
                        gameOver: true,
                        winner: 'black'
                    });
                } else if (this.blackTime <= 0) {
                    this.gameStarted = false;
                    this.stopTimer();
                    this.updateGameStatus('White wins on time!');
                    this.socket.emit('update_game_state', {
                        gameId: this.gameId,
                        fen: this.game.fen(),
                        pgn: this.game.pgn(),
                        turn: this.game.turn(),
                        gameOver: true,
                        winner: 'white'
                    });
                }
            }
            this.lastMoveTime = currentTime;
        }
    }

    startTimer() {
        if (this.isTimerRunning) return;
        this.isTimerRunning = true;
        this.lastMoveTime = Date.now();
        
        this.currentTimer = setInterval(() => {
            this.updateLocalTimer();
        }, 1000);
    }

    stopTimer() {
        if (this.currentTimer) {
            clearInterval(this.currentTimer);
            this.currentTimer = null;
        }
        this.isTimerRunning = false;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    updateTimerDisplay() {
        document.getElementById('white-timer').textContent = this.formatTime(this.whiteTime);
        document.getElementById('black-timer').textContent = this.formatTime(this.blackTime);
    }

    updateGameStatus(message) {
        document.getElementById('game-status').textContent = message;
    }

    updateConnectionStatus() {
        const statusEl = document.getElementById('connectionStatus');
        if (this.isConnected) {
            statusEl.innerHTML = `
                <div class="flex items-center justify-center text-green-600">
                    <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    Connected
                </div>
            `;
        } else {
            statusEl.innerHTML = `
                <div class="flex items-center justify-center text-red-600">
                    <div class="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    Disconnected
                </div>
            `;
        }
    }

    hideConnectionDialog() {
        document.getElementById('connectionDialog').classList.add('hidden');
    }

    addChatMessage(data) {
        const chatContainer = document.getElementById('chatMessages');
        
        // Clear the placeholder message
        if (chatContainer.children.length === 1 && chatContainer.children[0].textContent.includes('Chat will appear here')) {
            chatContainer.innerHTML = '';
        }
        
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${data.playerId === this.playerId ? 'own' : ''}`;
        
        const time = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageEl.innerHTML = `
            <div class="font-semibold text-sm">${data.playerName}</div>
            <div>${data.message}</div>
            <div class="text-xs text-gray-500">${time}</div>
        `;
        
        chatContainer.appendChild(messageEl);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', function() {
    window.chessGame = new SimpleChessGame();
});
