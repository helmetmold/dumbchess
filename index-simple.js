document.addEventListener("DOMContentLoaded", function() {
    let game = new Chess();
    let currentMode = 'Player vs Player';
    let board;
    
    // Timer variables
    let whiteTime = 600; // 10 minutes in seconds
    let blackTime = 600; // 10 minutes in seconds
    let currentTimer = null;
    let isTimerRunning = false;
    let gameStarted = false;
    
    // Timer functions
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    function updateTimerDisplay() {
        document.getElementById('white-timer').textContent = formatTime(whiteTime);
        document.getElementById('black-timer').textContent = formatTime(blackTime);
    }
    
    function startTimer() {
        if (isTimerRunning) return;
        isTimerRunning = true;
        currentTimer = setInterval(() => {
            if (game.turn() === 'w') {
                whiteTime--;
                if (whiteTime <= 0) {
                    whiteTime = 0;
                    stopTimer();
                    announceGameOver('Black wins on time!');
                    return;
                }
            } else {
                blackTime--;
                if (blackTime <= 0) {
                    blackTime = 0;
                    stopTimer();
                    announceGameOver('White wins on time!');
                    return;
                }
            }
            updateTimerDisplay();
        }, 1000);
    }
    
    function announceGameOver(message) {
        $('#game-score').text(message);
    }
    
    function stopTimer() {
        if (!isTimerRunning) return;
        isTimerRunning = false;
        if (currentTimer) {
            clearInterval(currentTimer);
            currentTimer = null;
        }
    }
    
    function resetTimers() {
        stopTimer();
        whiteTime = 600; // 10 minutes
        blackTime = 600; // 10 minutes
        gameStarted = false;
        updateTimerDisplay();
    }

    function engineGame(options) {
        options = options || {};
        let engine = typeof STOCKFISH === "function" ? STOCKFISH() : new Worker(options.stockfishjs || './engine/stockfish-nnue-16-single.js');
        let evaler = typeof STOCKFISH === "function" ? STOCKFISH() : new Worker(options.stockfishjs || './engine/stockfish-nnue-16-single.js');
        let engineStatus = {};
        let displayScore = true;
        let playerColor = 'white';
        let isEngineRunning = false;
        let announced_game_over;

        let onDragStart = function(source, piece, position, orientation) {
            console.log('onDragStart called:', { source, piece, currentMode, gameOver: game.game_over() });
            
            if (currentMode === 'Player vs Player') {
                console.log('Player vs Player mode - allowing move:', !game.game_over());
                return !game.game_over();
            }
            let re = playerColor == 'white' ? /^b/ : /^w/;
            if (game.game_over() || piece.search(re) !== -1) {
                console.log('Engine mode - blocking move:', { gameOver: game.game_over(), wrongPiece: piece.search(re) !== -1 });
                return false;
            }
            console.log('Engine mode - allowing move');
            return true;
        };

        let onClickPiece = function(source, target) {
            let move = game.move({
                from: source,
                to: target,
                promotion: 'q' // Always promote to queen for simplicity
            });
            if (move === null) return 'snapback';
            prepareMove();
        };

        setInterval(function() {
            if (announced_game_over) {
                return;
            }
            if (game.game_over()) {
                announced_game_over = true;
                stopTimer();
                $('#game-score').text("Game Over");
            }
        }, 1000);

        function uciCmd(cmd, which) {
            console.log("UCI: " + cmd);
            (which || engine).postMessage(cmd);
        }
        uciCmd('uci');

        function displayStatus() {
            let status = 'Chess Game => ';
            if (engineStatus.search) {
                status += engineStatus.search + ' | ';
                if (engineStatus.score && displayScore) {
                    status += (engineStatus.score.substr(0, 4) === "Mate" ? " " : ' Score: ') + engineStatus.score;
                }
            }
            $('#game-score').html(status);
        }

        function get_moves() {
            let moves = '';
            let history = game.history({ verbose: true });

            for (let i = 0; i < history.length; ++i) {
                let move = history[i];
                moves += ' ' + move.from + move.to + (move.promotion ? move.promotion : '');
            }

            return moves;
        }

        function prepareMove() {
            $('#pgn').text(game.pgn());
            board.position(game.fen());
            
            // Timer logic - start timer on first move by white
            if (!gameStarted && game.turn() === 'b') {
                // White just made their first move, start the timer
                gameStarted = true;
                startTimer();
            }
            
            if (currentMode === 'Player vs Engine') {
                let turn = game.turn() == 'w' ? 'white' : 'black';
                if (!game.game_over() && turn != playerColor) {
                    uciCmd('position startpos moves' + get_moves());
                    uciCmd('position startpos moves' + get_moves(), evaler);

                    // Use a simple depth for engine moves
                    uciCmd("go depth 15");
                    isEngineRunning = true;
                }
            }
        }

        evaler.onmessage = function(event) {
            let line;
            if (event && typeof event === "object") {
                line = event.data;
            } else {
                line = event;
            }
            // Simplified - no evaluation display
        };

        engine.onmessage = function(event) {
            let line;
            if (event && typeof event === "object") {
                line = event.data;
            } else {
                line = event;
            }
            console.log("Reply: " + line);
            if (line == 'uciok') {
                engineStatus.engineLoaded = true;
            } else if (line == 'readyok') {
                engineStatus.engineReady = true;
                displayStatus();
            } else {
                let match = line.match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?/);
                if (match) {
                    isEngineRunning = false;
                    game.move({ from: match[1], to: match[2], promotion: match[3] });
                    prepareMove();
                } else if (match = line.match(/^info .*\bdepth (\d+) .*\bnps (\d+)/)) {
                    engineStatus.search = 'Depth: ' + match[1] + ' Nps: ' + match[2];
                }
                if (match = line.match(/^info .*\bscore (\w+) (-?\d+)/)) {
                    let score = parseInt(match[2]) * (game.turn() == 'w' ? 1 : -1);
                    if (match[1] == 'cp') {
                        engineStatus.score = (score / 100.0).toFixed(2);
                    } else if (match[1] == 'mate') {
                        engineStatus.score = 'Mate in ' + Math.abs(score);
                    }
                    if (match = line.match(/\b(upper|lower)bound\b/)) {
                        engineStatus.score = ((match[1] == 'upper') == (game.turn() == 'w') ? '<= ' : '>= ') + engineStatus.score;
                    }
                }
            }
            displayStatus();
        };

        let onDrop = function(source, target) {
            let move = game.move({
                from: source,
                to: target,
                promotion: 'q' // Always promote to queen for simplicity
            });
            if (move === null) return 'snapback';
            prepareMove();
        };

        let onSnapEnd = function() {
            board.position(game.fen());
        };

        let onClick = function(source, target) {
            onClickPiece(source, target);
            prepareMove();
        };

        let cfg = {
            showErrors: true,
            draggable: true,
            position: 'start',
            onDragStart: onDragStart,
            onDrop: onDrop,
            onSnapEnd: onSnapEnd,
            onClick: onClick
        };

        board = new ChessBoard('board', cfg);

        return {
            reset: function() {
                game.reset();
                resetTimers();
                uciCmd('setoption name Contempt value 0');
                uciCmd('setoption name Skill Level value 10'); // Default skill level
                uciCmd('setoption name King Safety value 0');
                prepareMove();
            },
            setPlayerColor: function(color) {
                playerColor = color;
                board.orientation(playerColor);
            },
            setSkillLevel: function(skill) {
                if (skill < 0) {
                    skill = 0;
                }
                if (skill > 20) {
                    skill = 20;
                }
                uciCmd('setoption name Skill Level value ' + skill);
                let max_err = Math.round((skill * -0.5) + 10);
                let err_prob = Math.round((skill * 6.35) + 1);
                uciCmd('setoption name Skill Level Maximum Error value ' + max_err);
                uciCmd('setoption name Skill Level Probability value ' + err_prob);
            },
            start: function() {
                uciCmd('ucinewgame');
                uciCmd('isready');
                engineStatus.engineReady = false;
                engineStatus.search = null;
                displayStatus();
                prepareMove();
                announced_game_over = false;
            },
            undo: function() {
                game.undo();
                game.undo();
                prepareMove();
            },
            flipBoard: function() {
                board.flip();
            },
            setMode: function(mode) {
                currentMode = mode;
                console.log('Game mode changed to:', mode);
                
                // Stop any running engine when switching to Player vs Player
                if (mode === 'Player vs Player') {
                    isEngineRunning = false;
                    // Clear any engine status
                    engineStatus = {};
                    $('#game-score').text('Player vs Player Mode - Click pieces to move!');
                } else {
                    $('#game-score').text('Player vs Engine Mode');
                }
                
                displayStatus();
            },
            reloadWithFEN: function(fen) {
                // Load the new FEN
                game.load(fen);
                
                // Reset timers when loading new position
                resetTimers();
                
                // Update the board display
                board.position(game.fen());
                
                // Update the displays
                $('#pgn').text(game.pgn());
                
                // Reset game state
                announced_game_over = false;
                $('#game-score').text('');
                
                // Reset engine status
                engineStatus = {};
                
                console.log("Game reloaded with FEN:", fen);
                
                // Prepare for next move
                prepareMove();
            }
        };
    }

    let gameInstance = engineGame();
    
    // Make gameInstance globally accessible
    window.gameInstance = gameInstance;

    // Set default game mode to Player vs Player since we removed the UI controls
    gameInstance.setMode('Player vs Player');

    // Initialize timer display
    updateTimerDisplay();
    
    // Random FEN functionality
    function changeRandomFen() {
        // Use the same RandomFens system as online games
        const randomFen = RandomFens.getWeightedRandomFen();
        console.log("Loading random FEN:", randomFen);
        
        // Wait for game instance to be ready and load the random FEN
        setTimeout(() => {
            if (window.gameInstance && window.gameInstance.reloadWithFEN) {
                window.gameInstance.reloadWithFEN(randomFen);
                console.log("✅ Board reloaded with random FEN");
            }
        }, 100);
    }
    
    // Auto-load a random FEN when the page loads
    window.addEventListener('load', function() {
        // Wait a bit for the game instance to be ready, then load random FEN
        setTimeout(() => {
            changeRandomFen();
        }, 500);
    });
    
    gameInstance.start();
});
