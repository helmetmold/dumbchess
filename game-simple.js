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
        this.isLocalMoveInProgress = false;
        
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
            this.gameId = data.gameId;
            this.playerId = data.playerId;
            this.playerColor = data.playerColor;
            this.gamemode = data.gamemode;
            this.updatePlayerInfo(data.players);
            
            // Temporarily disable custom engine for debugging
            this.useCustomEngine = true;
            
            // Check if this is a fantasy gamemode that needs custom engine
            // this.useCustomEngine = data.gamemode && (
            //     data.gamemode.customPieces === true || 
            //     data.gamemode.boardShape !== 'standard' ||
            //     (data.gamemode.features && data.gamemode.features.some(f => 
            //         f.includes('Dragon') || f.includes('Wizard') || f.includes('Fantasy') || f.includes('Hexagonal')
            //     ))
            // );
            
            console.log(`Gamemode: ${data.gamemode?.name}, Custom Engine: ${this.useCustomEngine}`);
            
            // Show game ID for sharing
            this.showGameId(data.gameId);
            
            // Show random gamemode notification if it was randomly selected
            if (data.wasRandom && data.gamemode) {
                this.showRandomGamemodeNotification(data.gamemode);
            }
            
            // Load the starting position
            if (data.gameState && data.gameState.fen) {
                console.log('Loading starting position:', data.gameState.fen);
                
                if (this.useCustomEngine) {
                    console.log('Loading custom gamemode:', data.gameState.fen);
                    this.setupCustomGamemode(data.gameState, data.gamemode);
                } else {
                    // For standard gamemodes, use chess.js
                    try {
                        this.game.load(data.gameState.fen);
                        this.board.position(data.gameState.fen);
                        console.log('Successfully loaded FEN:', this.game.fen());
                    } catch (error) {
                        console.log('FEN load failed, using server position:', error);
                        this.setupCustomGamemode(data.gameState, data.gamemode);
                    }
                }
            } else {
                // Fallback to standard starting position if no FEN provided
                console.log('No FEN provided, using standard starting position');
                this.game.reset();
                this.board.position('start');
            }
            
            // Set board orientation after a short delay to ensure board is ready
            setTimeout(() => {
                this.setBoardOrientation();
            }, 100);
            this.hideConnectionDialog();
            
            // Update status based on player count
            if (data.players.length === 1) {
                this.updateGameStatus('Waiting for opponent to join... Share your Game ID with a friend or wait for a random player!');
            } else {
                this.startCountdown();
                this.updateGameStatus('Opponent found! Game will start when white makes the first move.');
            }
        });

        this.socket.on('player_joined', (data) => {
            this.updatePlayerInfo(data.players);
            if (data.players.length === 2) {
                this.startCountdown();
                this.updateGameStatus('Opponent found! Game will start when white makes the first move.');
                document.getElementById('resignBtn').disabled = false;
            } else {
                this.updateGameStatus('Waiting for opponent to join... Share your Game ID with a friend or wait for a random player!');
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
            
            // Update custom board position if available
            if (this.useCustomEngine && data.gameState && data.gameState.boardPosition) {
                this.updateCustomBoard(data.gameState.boardPosition);
            }
        });

        this.socket.on('game_state_updated', (data) => {
            this.updateGameState(data);
        });

        this.socket.on('timer_updated', (data) => {
            if (data.playerId !== this.playerId) {
                // Sync opponent's timer to prevent drift from local simulation
                if (this.playerColor === 'white') {
                    // Opponent is black
                    this.blackTime = data.timeLeft;
                } else {
                    // Opponent is white
                    this.whiteTime = data.timeLeft;
                }
                this.updateTimerDisplay();
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
        this.useCustomEngine = false; // Will be set based on gamemode
        
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
        
        // Ensure the board starts with a valid position
        console.log('Board initialized with position:', this.board.position());
        console.log('Game FEN:', this.game.fen());
    }

    setupEventListeners() {
        // Connection dialog events
        document.getElementById('connectBtn').addEventListener('click', () => {
            this.connectToRandomGame();
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

        // Copy game ID functionality
        document.getElementById('copy-game-id').addEventListener('click', () => {
            this.copyGameId();
        });

        // New game button functionality
        document.getElementById('newGameBtn').addEventListener('click', () => {
            this.startNewGame();
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
        console.log('onDragStart called:', { source, piece, gameStarted: this.gameStarted, playerColor: this.playerColor, gameTurn: this.game.turn() });
        
        // For custom engine gamemodes, use different validation
        if (this.useCustomEngine) {
            return this.customOnDragStart(source, piece, position, orientation);
        }

        if (this.game.game_over()) {
            console.log('Game is over, blocking move');
            return false;
        }

        // Check if player is trying to move their own piece
        const pieceColor = piece.charAt(0);
        const playerPieceColor = this.playerColor === 'white' ? 'w' : 'b';
        
        if (pieceColor !== playerPieceColor) {
            console.log('Not your piece, blocking move');
            return false;
        }

        // For the first move, allow white to start regardless of gameStarted status
        if (!this.gameStarted && this.playerColor === 'white') {
            console.log('First move by white player, allowing');
            return true;
        }

        // Check if it's the player's turn
        const isPlayerTurn = (this.playerColor === 'white' && this.game.turn() === 'w') ||
                            (this.playerColor === 'black' && this.game.turn() === 'b');
        
        if (!isPlayerTurn) {
            console.log('Not your turn, blocking move');
            return false;
        }

        console.log('Move allowed');
        return true;
    }

    customOnDragStart(source, piece, position, orientation) {
        // For custom gamemodes, use server game state for turn checking
        const currentTurn = this.customGameState ? this.customGameState.turn : 'w';
        
        // Check if it's the player's turn
        const isPlayerTurn = (this.playerColor === 'white' && currentTurn === 'w') ||
                            (this.playerColor === 'black' && currentTurn === 'b') ||
                            (!this.gameStarted && this.playerColor === 'white' && currentTurn === 'w');
        
        if (!isPlayerTurn) {
            return false;
        }

        // Check if player is trying to move their own piece
        const pieceColor = piece.charAt(0);
        const playerPieceColor = this.playerColor === 'white' ? 'w' : 'b';
        
        return pieceColor === playerPieceColor;
    }

    onDrop(source, target) {
        console.log('onDrop called:', { source, target, gameStarted: this.gameStarted, playerColor: this.playerColor, gameTurn: this.game.turn() });
        
        // For custom engine gamemodes, let server handle all validation
        if (this.useCustomEngine) {
            return this.handleCustomMove(source, target);
        }

        // Standard chess.js validation for normal gamemodes
        if (this.game.game_over()) {
            console.log('Game is over, snapping back');
            return 'snapback';
        }

        const move = this.game.move({
            from: source,
            to: target,
            promotion: 'q' // Always promote to queen for simplicity
        });

        if (move === null) {
            console.log('Invalid move, snapping back');
            return 'snapback';
        }

        console.log('Move successful:', move);
        console.log('Game FEN after move:', this.game.fen());
        console.log('Game turn after move:', this.game.turn());

        // Set flag to prevent server updates from overriding local move
        this.isLocalMoveInProgress = true;

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
        }

        return true;
    }

    onSnapEnd() {
        console.log('onSnapEnd called, updating board position to:', this.game.fen());
        // Only update the board if the game state is valid
        if (this.game && this.game.fen()) {
            this.board.position(this.game.fen());
        } else {
            console.log('Game state invalid, not updating board');
        }
        
        // Clear the local move flag after the move is complete
        this.isLocalMoveInProgress = false;
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
            // Start the game on first move if not already started
            if (!this.gameStarted) {
                this.gameStarted = true;
                this.startTimer();
                this.updateGameStatus('Game started! Good luck!');
                document.getElementById('readyBtn').disabled = true;
                document.getElementById('readyBtn').textContent = 'Game Started!';
            }
            
            this.board.position(this.game.fen());
        }
    }

    updateGameState(data) {
        console.log('Received game state update:', data);
        console.log('Current game FEN:', this.game.fen());
        console.log('New FEN:', data.fen);
        console.log('Local move in progress:', this.isLocalMoveInProgress);
        
        // Don't update if we're in the middle of a local move
        if (this.isLocalMoveInProgress) {
            console.log('Ignoring server update - local move in progress');
            return;
        }
        
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
                this.showGameOverScreen(true); // You win
            } else if (data.winner) {
                this.showGameOverScreen(false); // You lose
            } else {
                // Draw - could show a different screen, but for now treat as loss
                this.showGameOverScreen(false);
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
        if (players.length === 0) return;

        // Find yourself and opponent
        let myPlayer = null;
        let opponentPlayer = null;
        
        for (let player of players) {
            if (player.id === this.playerId) {
                myPlayer = player;
            } else {
                opponentPlayer = player;
            }
        }

        // Update player names based on board orientation
        // Your name always goes at the bottom, opponent at the top
        if (myPlayer) {
            if (this.playerColor === 'white') {
                // You are white, so you're at the bottom (white position)
                document.getElementById('whitePlayerName').textContent = myPlayer.name;
                document.getElementById('whiteProfilePic').textContent = myPlayer.name.charAt(0).toUpperCase();
                
                if (opponentPlayer) {
                    document.getElementById('blackPlayerName').textContent = opponentPlayer.name;
                    document.getElementById('blackProfilePic').textContent = opponentPlayer.name.charAt(0).toUpperCase();
                } else {
                    document.getElementById('blackPlayerName').textContent = 'Waiting...';
                    document.getElementById('blackProfilePic').textContent = '?';
                }
            } else {
                // You are black, but since board flips, you're still at the bottom (white position on screen)
                document.getElementById('whitePlayerName').textContent = myPlayer.name;
                document.getElementById('whiteProfilePic').textContent = myPlayer.name.charAt(0).toUpperCase();
                
                if (opponentPlayer) {
                    document.getElementById('blackPlayerName').textContent = opponentPlayer.name;
                    document.getElementById('blackProfilePic').textContent = opponentPlayer.name.charAt(0).toUpperCase();
                } else {
                    document.getElementById('blackPlayerName').textContent = 'Waiting...';
                    document.getElementById('blackProfilePic').textContent = '?';
                }
            }
        }

        // Store opponent name
        this.opponentName = opponentPlayer ? opponentPlayer.name : 'Waiting...';

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
            // Update both timers locally for smooth countdown
            const isMyTurn = (this.playerColor === 'white' && this.game.turn() === 'w') ||
                            (this.playerColor === 'black' && this.game.turn() === 'b');
            
            if (isMyTurn) {
                // Deduct time from your own timer
                if (this.playerColor === 'white') {
                    this.whiteTime = Math.max(0, this.whiteTime - 1);
                    if (this.whiteTime <= 0) {
                        this.gameStarted = false;
                        this.stopTimer();
                        this.showGameOverScreen(false); // You lose
                        this.socket.emit('update_game_state', {
                            gameId: this.gameId,
                            fen: this.game.fen(),
                            pgn: this.game.pgn(),
                            turn: this.game.turn(),
                            gameOver: true,
                            winner: 'black'
                        });
                        return;
                    }
                } else {
                    this.blackTime = Math.max(0, this.blackTime - 1);
                    if (this.blackTime <= 0) {
                        this.gameStarted = false;
                        this.stopTimer();
                        this.showGameOverScreen(false); // You lose
                        this.socket.emit('update_game_state', {
                            gameId: this.gameId,
                            fen: this.game.fen(),
                            pgn: this.game.pgn(),
                            turn: this.game.turn(),
                            gameOver: true,
                            winner: 'white'
                        });
                        return;
                    }
                }
                
                // Send timer update to server every 3 seconds for better sync
                const myTime = this.playerColor === 'white' ? this.whiteTime : this.blackTime;
                if (myTime % 3 === 0) {
                    if (this.gameId) {
                        this.socket.emit('update_timer', {
                            gameId: this.gameId,
                            playerId: this.playerId,
                            timeLeft: myTime
                        });
                    }
                }
            } else {
                // It's opponent's turn - simulate their timer countdown locally
                // This will be corrected by network updates every 3 seconds
                if (this.playerColor === 'white') {
                    // Opponent is black
                    this.blackTime = Math.max(0, this.blackTime - 1);
                } else {
                    // Opponent is white  
                    this.whiteTime = Math.max(0, this.whiteTime - 1);
                }
            }
            
            this.updateTimerDisplay();
        }
    }

    startTimer() {
        if (this.isTimerRunning) return;
        this.isTimerRunning = true;
        
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
        // Display timers based on screen position, not piece color
        // Bottom timer is always yours, top timer is always opponent's
        if (this.playerColor === 'white') {
            // You are white: your time at bottom (white-timer), opponent at top (black-timer)
            document.getElementById('white-timer').textContent = this.formatTime(this.whiteTime);
            document.getElementById('black-timer').textContent = this.formatTime(this.blackTime);
        } else {
            // You are black: your time at bottom (white-timer), opponent at top (black-timer)
            document.getElementById('white-timer').textContent = this.formatTime(this.blackTime);
            document.getElementById('black-timer').textContent = this.formatTime(this.whiteTime);
        }
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

    checkURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        const name = urlParams.get('name');
        const gameId = urlParams.get('gameId');
        
        if (action && name) {
            // Pre-fill the name and immediately hide the connection dialog
            document.getElementById('playerName').value = name;
            this.playerName = name;
            this.hideConnectionDialog();
            
            // Show connecting status
            this.updateGameStatus('Connecting to game...');
            
            // Wait for socket connection before attempting to join
            if (this.isConnected) {
                this.handleAutoConnect(action, name, gameId);
            } else {
                // Wait for connection
                this.socket.on('connect', () => {
                    this.handleAutoConnect(action, name, gameId);
                });
            }
        }
    }

    handleAutoConnect(action, name, gameId) {
        if (action === 'random') {
            // Automatically connect to a random game
            this.socket.emit('join', { playerName: name });
        } else if (action === 'join' && gameId) {
            // Join specific game with ID
            this.socket.emit('join', { playerName: name, gameId: gameId });
        }
    }

    showGameId(gameId) {
        document.getElementById('game-id-value').textContent = gameId;
        document.getElementById('game-id-display').classList.remove('hidden');
    }

    copyGameId() {
        const gameId = document.getElementById('game-id-value').textContent;
        navigator.clipboard.writeText(gameId).then(() => {
            const button = document.getElementById('copy-game-id');
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.classList.add('bg-green-500');
            button.classList.remove('bg-blue-500');
            
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('bg-green-500');
                button.classList.add('bg-blue-500');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy game ID:', err);
            alert('Failed to copy game ID. Please copy manually: ' + gameId);
        });
    }

    showBoardCover() {
        const cover = document.getElementById('boardCover');
        if (cover) {
            cover.style.display = 'flex';
        }
    }

    hideBoardCover() {
        const cover = document.getElementById('boardCover');
        if (cover) {
            cover.style.display = 'none';
        }
    }

    startCountdown() {
        const cover = document.getElementById('boardCover');
        if (!cover) return;

        let count = 3;
        
        // Update the cover content for countdown
        const updateCountdownDisplay = (number) => {
            cover.innerHTML = `
                <div class="text-center">
                    <h2 class="text-white text-6xl md:text-8xl font-bold tracking-wider mb-4">
                        DUMB CHESS
                    </h2>
                    <div id="countdown-number" class="text-white text-8xl md:text-9xl font-bold mb-4">
                        ${number}
                    </div>
                    <div class="text-white text-xl opacity-75">
                        Get ready...
                    </div>
                </div>
            `;
        };

        // Show gamemode announcement
        const showGamemodeAnnouncement = () => {
            const gamemodeName = this.gamemode ? this.gamemode.name : 'DUMB CHESS';
            const gamemodeDescription = this.gamemode ? this.gamemode.description : 'Random starting positions';
            
            cover.innerHTML = `
                <div class="text-center">
                    <h2 class="text-white text-6xl md:text-8xl font-bold tracking-wider mb-4">
                        DUMB CHESS
                    </h2>
                    <div class="text-yellow-400 text-4xl md:text-6xl font-bold mb-4 animate-pulse">
                        ${gamemodeName.toUpperCase()}
                    </div>
                    <div class="text-white text-lg opacity-90 max-w-md mx-auto">
                        ${gamemodeDescription}
                    </div>
                    ${this.gamemode && this.gamemode.features ? `
                        <div class="text-white text-sm opacity-75 mt-4">
                            ${this.gamemode.features.slice(0, 3).join(' • ')}
                        </div>
                    ` : ''}
                </div>
            `;
        };

        // Show initial count (3)
        updateCountdownDisplay(count);
        
        const countdownInterval = setInterval(() => {
            count--;
            
            if (count > 0) {
                updateCountdownDisplay(count);
            } else if (count === 0) {
                // Show gamemode announcement
                showGamemodeAnnouncement();
            } else {
                // Hide cover after announcement
                clearInterval(countdownInterval);
                this.hideBoardCover();
            }
        }, 1000);
    }

    showGameOverScreen(didWin) {
        const gameOverScreen = document.getElementById('gameOverScreen');
        const gameOverTitle = document.getElementById('gameOverTitle');
        const gameOverSubtext = document.getElementById('gameOverSubtext');
        const resignBtn = document.getElementById('resignBtn');
        
        if (didWin) {
            gameOverTitle.textContent = 'YOU WIN';
            gameOverSubtext.textContent = '';
        } else {
            gameOverTitle.textContent = 'YOU LOSE';
            gameOverSubtext.textContent = 'DO 10 PUSH UPS';
        }
        
        // Hide the resign button
        if (resignBtn) {
            resignBtn.style.display = 'none';
        }
        
        gameOverScreen.classList.remove('hidden');
    }

    hideGameOverScreen() {
        const gameOverScreen = document.getElementById('gameOverScreen');
        gameOverScreen.classList.add('hidden');
    }

    startNewGame() {
        // Redirect back to home page for a new game
        window.location.href = 'index.html';
    }

    setupCustomGamemode(gameState, gamemode) {
        console.log(`Setting up custom gamemode: ${gamemode.name}`);
        
        // For custom gamemodes, we'll maintain our own position state
        this.customPosition = {};
        this.customGameState = gameState;
        
        // Load the custom FEN into the chess.js game as well
        if (gameState.fen) {
            try {
                console.log('Loading custom FEN into chess.js:', gameState.fen);
                this.game.load(gameState.fen);
                console.log('Chess.js FEN after load:', this.game.fen());
            } catch (error) {
                console.log('Failed to load custom FEN into chess.js:', error);
            }
        }
        
        // Set up the board with custom pieces if available
        if (gameState.boardPosition) {
            this.updateCustomBoard(gameState.boardPosition);
        } else if (gameState.fen) {
            // Use the FEN to set up the board
            this.board.position(gameState.fen);
        } else {
            // Fallback to empty board for now
            this.board.position('start');
        }
    }

    handleCustomMove(source, target) {
        console.log('handleCustomMove called:', { source, target });
        
        // For custom engine gamemodes, we trust the server completely
        // Just send the move and let server validate
        
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.startTimer();
            this.updateGameStatus('Game started! Good luck!');
            document.getElementById('readyBtn').disabled = true;
            document.getElementById('readyBtn').textContent = 'Game Started!';
        }

        // Send move to server for validation and processing
        if (this.gameId) {
            this.socket.emit('make_move', {
                gameId: this.gameId,
                from: source,
                to: target,
                promotion: 'q'
            });
        }

        // For custom engine, we need to update the local chess.js game state too
        // Try to make the move in the local game state
        try {
            const move = this.game.move({
                from: source,
                to: target,
                promotion: 'q'
            });
            
            if (move) {
                console.log('Custom move successful in local game:', move);
                console.log('Game FEN after custom move:', this.game.fen());
                this.isLocalMoveInProgress = true;
            } else {
                console.log('Custom move failed in local game, but allowing visual move');
            }
        } catch (error) {
            console.log('Custom move error in local game:', error);
        }

        // Optimistically update the board (will be corrected by server if invalid)
        this.board.move(source + '-' + target);
        
        return true; // Allow the move visually
    }

    updateCustomBoard(boardPosition) {
        // Convert custom board position to chessboard.js format
        const position = {};
        
        for (const [square, piece] of Object.entries(boardPosition)) {
            if (piece) {
                // Map custom pieces to display pieces
                const displayPiece = this.mapCustomPieceToDisplay(piece);
                if (displayPiece) {
                    position[square] = displayPiece;
                }
            }
        }
        
        this.board.position(position);
    }

    mapCustomPieceToDisplay(piece) {
        // Map custom pieces to available chess piece symbols for display
        const pieceMap = {
            // Standard pieces
            'king': piece.color === 'white' ? 'wK' : 'bK',
            'queen': piece.color === 'white' ? 'wQ' : 'bQ',
            'rook': piece.color === 'white' ? 'wR' : 'bR',
            'bishop': piece.color === 'white' ? 'wB' : 'bB',
            'knight': piece.color === 'white' ? 'wN' : 'bN',
            'pawn': piece.color === 'white' ? 'wP' : 'bP',
            
            // Fantasy pieces - map to similar looking standard pieces for now
            'dragon': piece.color === 'white' ? 'wQ' : 'bQ', // Use queen symbol
            'wizard': piece.color === 'white' ? 'wB' : 'bB',  // Use bishop symbol
            'phoenix': piece.color === 'white' ? 'wN' : 'bN', // Use knight symbol
            'unicorn': piece.color === 'white' ? 'wR' : 'bR', // Use rook symbol
            'assassin': piece.color === 'white' ? 'wP' : 'bP'  // Use pawn symbol
        };
        
        return pieceMap[piece.type] || (piece.color === 'white' ? 'wP' : 'bP');
    }

    showRandomGamemodeNotification(gamemode) {
        // Create a notification element
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-pulse';
        notification.innerHTML = `
            <div class="text-center">
                <div class="font-bold text-lg mb-1">🎲 Random Gamemode!</div>
                <div class="text-lg font-semibold">${gamemode.name}</div>
                <div class="text-sm opacity-90 mt-1">${gamemode.description}</div>
                ${gamemode.features ? `<div class="text-xs opacity-75 mt-2">${gamemode.features.slice(0, 3).join(' • ')}</div>` : ''}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 6 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translate(-50%, -100%)';
                notification.style.transition = 'all 0.5s ease-out';
                
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 500);
            }
        }, 6000);
        
        // Also update the game status to include gamemode info
        setTimeout(() => {
            const statusEl = document.getElementById('game-status');
            if (statusEl) {
                const currentStatus = statusEl.textContent;
                if (currentStatus.includes('Waiting for opponent')) {
                    statusEl.innerHTML = `${currentStatus}<br><small class="text-purple-600 font-semibold">Playing: ${gamemode.name}</small>`;
                }
            }
        }, 2000);
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', function() {
    window.chessGame = new SimpleChessGame();
});
