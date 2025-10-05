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
        this.checkURLParameters();
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
            console.log('joined_game event received:', data);
            this.gameId = data.gameId;
            this.playerId = data.playerId;
            this.playerColor = data.playerColor;
            console.log('Game info set:', { gameId: this.gameId, playerId: this.playerId, playerColor: this.playerColor, playerName: this.playerName });
            
            this.updatePlayerInfo(data.players);
            
            // Load the random starting position if provided
            if (data.gameState && data.gameState.fen) {
                this.game.load(data.gameState.fen);
                this.board.position(this.game.chessFen());
                this.applyCustomPieceSkins();
            }
            
            // Set board orientation after a short delay to ensure board is ready
            setTimeout(() => {
                this.setBoardOrientation();
            }, 100);
            
            // Show player color and name clearly
            this.updateGameStatus(`Playing as ${this.playerColor.toUpperCase()}. Waiting for opponent to join...`);
        });

        this.socket.on('player_joined', (data) => {
            this.updatePlayerInfo(data.players);
            if (data.players.length === 2) {
                this.updateGameStatus(`Both players connected! ${this.playerColor === 'white' ? 'You go first!' : 'White goes first - wait for your turn.'}`);
                document.getElementById('resignBtn').disabled = false;
            } else {
                this.updateGameStatus(`Playing as ${this.playerColor.toUpperCase()}. Waiting for opponent to join...`);
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
            this.updateGameStatus(`Game started! Playing as ${this.playerColor.toUpperCase()}. ${this.playerColor === 'white' ? 'You go first!' : 'White goes first - wait for your turn.'}`);
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
        // Use CustomChessEnhanced instead of standard Chess
        this.game = new CustomChessEnhanced();
        
        const config = {
            showErrors: true,
            draggable: true,
            position: 'empty', // Start with empty board, will be filled with server FEN
            pieceTheme: this.getCustomPieceTheme(),
            onDragStart: this.onDragStart.bind(this),
            onDrop: this.onDrop.bind(this),
            onSnapEnd: this.onSnapEnd.bind(this),
            onClick: this.onClick.bind(this)
        };

        this.board = new ChessBoard('board', config);
        this.applyCustomPieceSkins();
    }
    
    // Add this method to create piece theme function
    getCustomPieceTheme() {
        return (piece) => {
            // Render custom symbols directly (wG/bG, wA/bA)
            if (window.CUSTOM_PIECES) {
                const cp = CUSTOM_PIECES.find(p => piece === `w${p.symbol}` || piece === `b${p.symbol}`);
                if (cp) {
                    const color = piece.charAt(0) === 'w' ? 'white' : 'black';
                    return cp.images[color];
                }
            }
            // Map fallback codes at squares that contain custom pieces
            if (this && this.game && this.game.customPiecePositions) {
                const squares = document.querySelectorAll('#board .piece-417db');
                for (const img of squares) {
                    const dataPiece = img.getAttribute('data-piece');
                    if (dataPiece === piece) {
                        const square = img.closest('[data-square]')?.getAttribute('data-square');
                        if (square) {
                            const info = this.game.customPiecePositions.get(square);
                            if (info) {
                                const def = (window.CUSTOM_PIECES || []).find(p => p.symbol === info.symbol);
                                if (def) {
                                    const color = info.color === 'w' ? 'white' : 'black';
                                    return def.images[color];
                                }
                            }
                        }
                    }
                }
            }
            return `img/${piece}.svg`;
        };
    }

    // Replace fallback images (e.g., queens) with custom images on squares that hold custom pieces
    applyCustomPieceSkins() {
        if (!this.board || !this.game || !this.game.customPiecePositions) return;
        const customPositions = this.game.customPiecePositions;
        customPositions.forEach((info, square) => {
            const img = document.querySelector(`#board .square-${square} img`);
            if (!img) return;
            const def = (window.CUSTOM_PIECES || []).find(p => p.symbol === info.symbol);
            if (!def || !def.images) return;
            const color = info.color === 'w' ? 'white' : 'black';
            const url = def.images[color];
            if (img.getAttribute('src') !== url) {
                img.setAttribute('src', url);
                img.setAttribute('data-piece', `${info.color}${info.symbol}`);
            }
        });
    }

    // Build a per-square position object so chessboard.js can render custom pieces reliably
    buildBoardPosition() {
        const position = {};
        for (let rank = 1; rank <= 8; rank++) {
            for (let file = 'a'.charCodeAt(0); file <= 'h'.charCodeAt(0); file++) {
                const square = String.fromCharCode(file) + rank;
                const piece = this.game.get(square);
                if (!piece) continue;
                const colorPrefix = piece.color === 'w' ? 'w' : 'b';
                const customInfo = this.game.customPiecePositions && this.game.customPiecePositions.get(square);
                if (customInfo) {
                    position[square] = `${colorPrefix}${customInfo.symbol}`;
                } else {
                    position[square] = `${colorPrefix}${piece.type.toUpperCase()}`;
                }
            }
        }
        return position;
    }

    setupEventListeners() {
        // Game control events
        document.getElementById('readyBtn').addEventListener('click', () => {
            this.markReady();
        });

        document.getElementById('resignBtn').addEventListener('click', () => {
            this.resignGame();
        });
        
        // Custom piece events
        document.getElementById('addGrasshopperBtn').addEventListener('click', () => {
            this.addCustomPiece('G');
        });
        
        document.getElementById('addArchbishopBtn').addEventListener('click', () => {
            this.addCustomPiece('A');
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
    
    // Add this method to handle custom piece placement
    addCustomPiece(symbol) {
        const pieceInfo = this.getCustomPieceInfo(symbol);
        if (pieceInfo) {
            alert(`Click on a square to place a ${pieceInfo.name}`);
            // You could add click handlers here to place pieces
        }
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

        this.board.position(this.game.chessFen());
        this.applyCustomPieceSkins();
        return true;
    }

    onSnapEnd() {
        this.board.position(this.game.chessFen());
        this.applyCustomPieceSkins();
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
            this.board.position(this.game.chessFen());
            this.applyCustomPieceSkins();
            this.updateLocalTimer();
        }
    }

    updateGameState(data) {
        console.log('Received game state update:', data);
        console.log('Current game FEN:', this.game.fen());
        console.log('New FEN:', data.fen);
        
        if (data.fen !== this.game.fen()) {
            this.game.load(data.fen);
            this.board.position(this.game.chessFen());
            this.applyCustomPieceSkins();
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
            // Show the board from the player's perspective (bottom view)
            // This means the player's pieces are always at the bottom
            console.log('Setting board orientation for player color:', this.playerColor);
            console.log('Current board orientation before change:', this.board.orientation());
            
            // Set orientation so player sees their pieces at the bottom
            // For white players: use 'white' orientation (white pieces at bottom)
            // For black players: use 'black' orientation (black pieces at bottom)
            try {
                this.board.orientation(this.playerColor);
                console.log('Board orientation set to', this.playerColor, '(player perspective)');
            } catch (error) {
                console.error('Error setting board orientation:', error);
            }
        }
    }

    updatePlayerInfo(players) {
        // Clear existing names first
        document.getElementById('whitePlayerName').textContent = 'Waiting...';
        document.getElementById('blackPlayerName').textContent = 'Waiting...';
        document.getElementById('whiteProfilePic').textContent = '?';
        document.getElementById('blackProfilePic').textContent = '?';

        // Update player names based on their colors
        players.forEach(player => {
            if (player.color === 'white') {
                document.getElementById('whitePlayerName').textContent = player.name;
                document.getElementById('whiteProfilePic').textContent = player.name.charAt(0).toUpperCase();
            } else {
                document.getElementById('blackPlayerName').textContent = player.name;
                document.getElementById('blackProfilePic').textContent = player.name.charAt(0).toUpperCase();
            }
        });

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
        if (statusEl) {
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
        } else {
            console.log('Connection status:', this.isConnected ? 'Connected' : 'Disconnected');
        }
    }


    checkURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        const name = urlParams.get('name');
        const gameId = urlParams.get('gameId');
        
        console.log('URL Parameters:', { action, name, gameId });
        
        if (action && name) {
            // Set the player name
            this.playerName = name;
            console.log('Player name set to:', this.playerName);
            
            // Show connecting status
            this.updateGameStatus('Connecting to game...');
            
            // Wait for socket connection before attempting to join
            if (this.isConnected) {
                console.log('Already connected, joining game...');
                this.handleAutoConnect(action, name, gameId);
            } else {
                console.log('Waiting for connection...');
                // Wait for connection
                this.socket.on('connect', () => {
                    console.log('Connected, now joining game...');
                    this.handleAutoConnect(action, name, gameId);
                });
            }
        } else {
            console.log('No valid parameters, redirecting to home page');
            // If no parameters, redirect to home page
            window.location.href = 'index.html';
        }
    }

    handleAutoConnect(action, name, gameId) {
        console.log('handleAutoConnect called with:', { action, name, gameId });
        
        if (action === 'random') {
            console.log('Joining random game with name:', name);
            // Automatically connect to a random game
            this.socket.emit('join', { playerName: name });
        } else if (action === 'join' && gameId) {
            console.log('Joining specific game:', gameId, 'with name:', name);
            // Join specific game with ID
            this.socket.emit('join', { playerName: name, gameId: gameId });
        } else {
            console.error('Invalid action or missing gameId:', { action, gameId });
        }
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
    
    // Add method to place custom pieces
    placeCustomPiece(square, pieceSymbol, color = 'w') {
        if (this.game && this.game.placeCustomPiece) {
            const success = this.game.placeCustomPiece(square, pieceSymbol, color);
            if (success) {
                this.board.position(this.game.chessFen());
                this.applyCustomPieceSkins();
            }
            return success;
        }
        return false;
    }
    
    // Add method to get custom piece info
    getCustomPieceInfo(symbol) {
        if (this.game && this.game.getCustomPieceInfo) {
            return this.game.getCustomPieceInfo(symbol);
        }
        return null;
    }

}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', function() {
    window.chessGame = new SimpleChessGame();
});
