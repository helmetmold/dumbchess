// custom-chess-enhanced.js - Enhanced Custom Chess Engine
class CustomChessEnhanced {
    constructor(pieceManager) {
        // Create a Chess instance
        this.chess = new Chess();
        
        // Store piece manager reference first
        this.pieceManager = pieceManager || new PieceManager();
        
        // Initialize custom pieces if CUSTOM_PIECES is available
        if (typeof CUSTOM_PIECES !== 'undefined') {
            this.pieceManager.loadPieces(CUSTOM_PIECES);
        }
        
        // Copy all methods and properties from Chess to this instance
        Object.assign(this, this.chess);
        
        // Track active color separately for custom moves
        this.activeColor = 'w';

        // Override methods AFTER Object.assign to ensure they take precedence
        this.load = this.customLoad.bind(this);
        this.board = this.customBoard.bind(this);
        this.fen = this.customFen.bind(this);
        this.turn = this.customTurn.bind(this);
        
        console.log('✨ CustomChessEnhanced initialized with', this.pieceManager.pieces.size, 'custom pieces');
    }
    
    /**
     * Custom load method to handle custom piece symbols in FEN
     */
    customLoad(fen) {
        console.log('🔄 CustomChessEnhanced.customLoad() called with FEN:', fen);
        console.log('🔍 This is the custom load method, not the chess.js one!');
        
        // Parse custom FEN and convert custom symbols to standard ones
        const parsedFen = this.parseCustomFen(fen);
        
        // Store custom piece positions for later reference
        this.customPiecePositions = this.extractCustomPiecePositions(fen);
        console.log('🎯 Extracted custom piece positions:', this.customPiecePositions);
        
        // Update active color from incoming FEN if present
        const fenParts = (fen || '').split(' ');
        if (fenParts.length > 1 && (fenParts[1] === 'w' || fenParts[1] === 'b')) {
            this.activeColor = fenParts[1];
        } else {
            this.activeColor = this.chess.turn();
        }

        // Load the parsed FEN into the standard chess engine
        const result = this.chess.load(parsedFen);
        console.log('📋 Standard chess engine loaded with FEN:', parsedFen);
        console.log('🎯 Standard chess engine board state:', this.chess.board());
        
        // Restore custom pieces by replacing standard pieces with custom ones
        this.restoreCustomPieces();
        console.log('🔄 Custom pieces restored. Final board state:', this.board());
        
        // Update the FEN to reflect the custom pieces
        const finalFen = this.generateCustomFen();
        console.log('🎯 Final FEN with custom pieces:', finalFen);
        
        return result;
    }
    
    /**
     * Parse FEN string and convert custom piece symbols to standard ones
     */
    parseCustomFen(fen) {
        if (!fen) return fen;
        
        let parsedFen = fen;
        
        // Get all custom piece symbols
        const customSymbols = this.pieceManager.getAllSymbols();
        
        // Replace custom symbols with their fallback symbols for chess.js compatibility
        customSymbols.forEach(symbol => {
            const customPiece = this.pieceManager.getPiece(symbol);
            if (customPiece && customPiece.fallbackSymbol) {
                // Replace uppercase (white pieces)
                parsedFen = parsedFen.replace(new RegExp(symbol, 'g'), customPiece.fallbackSymbol);
                // Replace lowercase (black pieces)
                parsedFen = parsedFen.replace(new RegExp(symbol.toLowerCase(), 'g'), customPiece.fallbackSymbol.toLowerCase());
            }
        });
        
        console.log('🔄 Parsed custom FEN:', fen, '->', parsedFen);
        return parsedFen;
    }
    
    /**
     * Extract custom piece positions from original FEN
     */
    extractCustomPiecePositions(fen) {
        const positions = new Map();
        const customSymbols = this.pieceManager.getAllSymbols();
        
        console.log('🔍 extractCustomPiecePositions called with FEN:', fen);
        console.log('🔍 Available custom symbols:', customSymbols);
        
        if (!fen) return positions;
        
        const boardPart = fen.split(' ')[0];
        const ranks = boardPart.split('/');
        
        ranks.forEach((rank, rankIndex) => {
            let fileIndex = 0;
            console.log(`🔍 Processing rank ${rankIndex}: ${rank}`);
            
            for (let char of rank) {
                if (isNaN(char)) {
                    // It's a piece
                    const square = String.fromCharCode(97 + fileIndex) + (8 - rankIndex);
                    console.log(`🔍 Found piece ${char} at square ${square}`);
                    
                    if (customSymbols.includes(char.toUpperCase())) {
                        const color = char === char.toUpperCase() ? 'w' : 'b';
                        positions.set(square, {
                            symbol: char.toUpperCase(),
                            color: color
                        });
                        console.log(`🎯 Found custom piece ${char} at ${square}`);
                    }
                    
                    fileIndex++;
                } else {
                    // It's a number (empty squares)
                    fileIndex += parseInt(char);
                }
            }
        });
        
        return positions;
    }
    
    /**
     * Restore custom pieces after loading standard FEN
     */
    restoreCustomPieces() {
        console.log('🔄 restoreCustomPieces() called');
        console.log('🎯 customPiecePositions:', this.customPiecePositions);
        
        if (!this.customPiecePositions) {
            console.log('❌ No custom piece positions to restore');
            return;
        }
        
        this.customPiecePositions.forEach((pieceInfo, square) => {
            console.log(`🔄 Processing custom piece ${pieceInfo.symbol} at ${square}`);
            
            // Remove the standard piece that was placed there
            this.chess.remove(square);
            console.log(`🗑️ Removed standard piece from ${square}`);
            
            // Get the fallback piece type for chess.js compatibility
            const customPiece = this.pieceManager.getPiece(pieceInfo.symbol);
            const fallbackType = customPiece ? customPiece.fallbackSymbol.toLowerCase() : 'q';
            
            // Place the fallback piece type in chess.js
            console.log(`🔍 Placing fallback piece type:`, { type: fallbackType, color: pieceInfo.color }, `at ${square}`);
            const result = this.chess.put({ type: fallbackType, color: pieceInfo.color }, square);
            console.log(`✅ Put result:`, result);
            console.log(`🔍 Piece at ${square} after put:`, this.chess.get(square));
        });
        
        console.log('🎯 Final board state after restoration:', this.board());
    }
    
    /**
     * Custom board method to return the current board state
     */
    customBoard() {
        return this.chess.board();
    }

    /**
     * Custom FEN method to return FEN with custom pieces
     */
    customFen() {
        if (this.customPiecePositions && this.customPiecePositions.size > 0) {
            return this.generateCustomFen();
        }
        return this.chess.fen();
    }

    /**
     * Get the underlying chess.js FEN (for UI display)
     * This returns the FEN with fallback pieces that chessboard.js can understand
     */
    chessFen() {
        return this.chess.fen();
    }

    /**
     * Generate FEN from current board state with custom pieces
     */
    generateCustomFen() {
        const board = this.board();
        let fen = '';
        
        console.log('🔍 generateCustomFen called');
        console.log('🔍 Board state:', board);
        console.log('🔍 Custom piece positions:', this.customPiecePositions);
        
        // Build board part of FEN
        for (let rank = 0; rank < 8; rank++) {
            let emptyCount = 0;
            
            for (let file = 0; file < 8; file++) {
                const piece = board[rank][file];
                const square = String.fromCharCode(97 + file) + (8 - rank);
                
                console.log(`🔍 Square ${square}: piece=${piece ? piece.type + piece.color : 'null'}`);
                
                if (piece === null) {
                    emptyCount++;
                } else {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }
                    
                    // Check if this is a custom piece
                    const customPiece = this.customPiecePositions?.get(square);
                    
                    if (customPiece) {
                        // Use custom piece symbol
                        const symbol = customPiece.color === 'w' ? customPiece.symbol : customPiece.symbol.toLowerCase();
                        fen += symbol;
                        console.log(`🎯 Using custom piece symbol ${symbol} for ${square}`);
                    } else {
                        // Use standard piece symbol
                        const symbol = piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
                        fen += symbol;
                        console.log(`📋 Using standard piece symbol ${symbol} for ${square}`);
                    }
                }
            }
            
            if (emptyCount > 0) {
                fen += emptyCount;
            }
            
            if (rank < 7) {
                fen += '/';
            }
        }
        
        // Add remaining FEN parts from chess engine, but force active color
        const chessFen = this.chess.fen();
        const fenParts = chessFen.split(' ');
        if (fenParts.length >= 6) {
            fen += ' ' + [this.activeColor, fenParts[2], fenParts[3], fenParts[4], fenParts[5]].join(' ');
        } else if (fenParts.length > 1) {
            fen += ' ' + [this.activeColor].concat(fenParts.slice(2)).join(' ');
        } else {
            fen += ' ' + this.activeColor + ' - - 0 1';
        }
        
        console.log('🎯 Generated FEN:', fen);
        return fen;
    }

    /**
     * Override move method to handle custom pieces
     */
    move(moveObj) {
        const fromSquare = moveObj.from;
        const toSquare = moveObj.to;
        const customInfo = this.customPiecePositions ? this.customPiecePositions.get(fromSquare) : null;
        
        if (customInfo) {
            return this.validateCustomMove(moveObj, customInfo);
        }
        
        // Ensure chess.js internal turn matches activeColor before standard move
        if (this.chess.turn() !== this.activeColor) {
            const parts = this.chess.fen().split(' ');
            if (parts.length > 1) {
                parts[1] = this.activeColor;
                this.chess.load(parts.join(' '));
            }
        }

        // Use standard chess.js move validation for regular pieces
        const result = this.chess.move(moveObj);
        if (result) {
            // If a custom piece was captured at destination, remove it from our map
            if (this.customPiecePositions && this.customPiecePositions.has(toSquare)) {
                this.customPiecePositions.delete(toSquare);
            }
            // Sync active color with chess.js after a successful standard move
            this.activeColor = this.chess.turn();
        }
        return result;
    }
    
    /**
     * Validate moves for custom pieces
     */
    validateCustomMove(moveObj, customInfo) {
        if (!this.isValidCustomMove(moveObj.from, moveObj.to, customInfo)) {
            return null;
        }
        
        // Execute the move
        return this.executeCustomMove(moveObj, customInfo);
    }
    
    /**
     * Check if a custom piece move is valid
     */
    isValidCustomMove(from, to, pieceInfo) {
        const customPiece = this.pieceManager.getPiece(pieceInfo.symbol);
        if (!customPiece) return false;
        
        const pattern = customPiece.movePattern;
        const fromIndex = this.squareToIndex(from);
        const toIndex = this.squareToIndex(to);
        
        if (pattern.type === 'offset') {
            return this.validateOffsetMove(from, to, pattern, pieceInfo.color);
        } else if (pattern.type === 'hybrid') {
            // Check each sub-pattern
            for (const subPattern of pattern.patterns) {
                if (this.validateOffsetMove(from, to, subPattern, pieceInfo.color)) {
                    return true;
                }
            }
            return false;
        }
        
        return false;
    }
    
    /**
     * Validate offset-based moves
     */
    validateOffsetMove(from, to, pattern, color) {
        const fromIndex = this.squareToIndex(from);
        const toIndex = this.squareToIndex(to);
        const offset = toIndex - fromIndex;
        
        // Check if this offset is in the pattern
        const direction = this.getDirectionFromOffset(offset, pattern.offsets);
        if (direction === null) return false;
        
        // Handle special rules
        if (pattern.requiresJump) {
            return this.validateJumpRequiredMove(from, to, direction);
        }
        
        if (pattern.canJump) {
            return this.validateJumpingMove(from, to, direction, color);
        }
        
        return this.validateStandardMove(from, to, direction, color);
    }
    
    /**
     * Get direction from offset
     */
    getDirectionFromOffset(offset, validOffsets) {
        for (const validOffset of validOffsets) {
            if (offset === validOffset) {
                return validOffset;
            }
            
            // Check if offset is a multiple of validOffset (for unlimited range)
            if (offset % validOffset === 0 && Math.sign(offset) === Math.sign(validOffset)) {
                return validOffset;
            }
        }
        return null;
    }
    
    /**
     * Validate moves that require jumping over a piece
     */
    validateJumpRequiredMove(from, to, direction) {
        const fromIndex = this.squareToIndex(from);
        const toIndex = this.squareToIndex(to);
        
        let currentSquare = fromIndex + direction;
        let pieceCount = 0;
        
        while (currentSquare !== toIndex) {
            const square = this.indexToSquare(currentSquare);
            if (this.get(square)) {
                pieceCount++;
            }
            currentSquare += direction;
        }
        
        // Must jump over exactly one piece
        return pieceCount === 1;
    }
    
    /**
     * Validate moves for jumping pieces
     */
    validateJumpingMove(from, to, direction, color) {
        const toSquare = this.get(to);
        
        // Check destination
        if (toSquare && toSquare.color === color) {
            return false; // Can't capture own piece
        }
        
        return true;
    }
    
    /**
     * Validate standard moves (with collision checking)
     */
    validateStandardMove(from, to, direction, color) {
        const fromIndex = this.squareToIndex(from);
        const toIndex = this.squareToIndex(to);
        
        // Check path for obstacles
        let currentSquare = fromIndex + direction;
        while (currentSquare !== toIndex) {
            const square = this.indexToSquare(currentSquare);
            if (this.get(square)) {
                return false; // Path is blocked
            }
            currentSquare += direction;
        }
        
        // Check destination
        const targetPiece = this.get(to);
        if (targetPiece && targetPiece.color === color) {
            return false; // Can't capture own piece
        }
        
        return true;
    }
    
    /**
     * Execute a custom piece move
     */
    executeCustomMove(moveObj, pieceInfo) {
        const from = moveObj.from;
        const to = moveObj.to;
        const symbol = pieceInfo.symbol;
        const color = pieceInfo.color;
        const fallback = this.pieceManager.getFallbackSymbol(symbol).toLowerCase();

        // Capture if destination occupied
        this.chess.remove(to);
        // Move piece by removing from source and putting fallback at destination
        this.chess.remove(from);
        this.chess.put({ type: fallback, color: color }, to);

        // Update custom piece map
        if (!this.customPiecePositions) this.customPiecePositions = new Map();
        this.customPiecePositions.delete(from);
        this.customPiecePositions.set(to, { symbol, color });

        // Flip turn for custom move
        this.activeColor = (color === 'w') ? 'b' : 'w';

        return { from, to, piece: symbol, color };
    }
    
    /**
     * Get all legal moves for a custom piece
     */
    getCustomPieceMoves(square) {
        const piece = this.get(square);
        if (!piece || !this.pieceManager.isCustomPiece(piece.type)) {
            return [];
        }
        
        const moves = [];
        const customPiece = this.pieceManager.getPiece(piece.type);
        
        // Generate all possible destination squares
        for (let rank = 1; rank <= 8; rank++) {
            for (let file = 'a'.charCodeAt(0); file <= 'h'.charCodeAt(0); file++) {
                const targetSquare = String.fromCharCode(file) + rank;
                if (this.isValidCustomMove(square, targetSquare, piece)) {
                    moves.push(targetSquare);
                }
            }
        }
        
        return moves;
    }
    
    /**
     * Helper methods for board calculations
     */
    squareToIndex(square) {
        const file = square.charCodeAt(0) - 97; // a=0, b=1, etc.
        const rank = 8 - parseInt(square[1]);   // 8=0, 7=1, etc.
        return rank * 16 + file;
    }
    
    indexToSquare(index) {
        const file = String.fromCharCode(97 + (index % 16));
        const rank = 8 - Math.floor(index / 16);
        return file + rank;
    }
    
    /**
     * Place a custom piece on the board
     */
    placeCustomPiece(square, symbol, color = 'w') {
        if (!this.pieceManager.isCustomPiece(symbol)) {
            console.error(`Custom piece '${symbol}' not found`);
            return false;
        }
        const fallback = this.pieceManager.getFallbackSymbol(symbol).toLowerCase();
        const ok = this.chess.put({ type: fallback, color: color }, square);
        if (ok) {
            if (!this.customPiecePositions) this.customPiecePositions = new Map();
            this.customPiecePositions.set(square, { symbol, color });
            return true;
        }
        return false;
    }

    /**
     * Return the active side to move (uses custom activeColor for custom moves)
     */
    customTurn() {
        return this.activeColor || this.chess.turn();
    }
    
    /**
     * Get custom piece info
     */
    getCustomPieceInfo(symbol) {
        return this.pieceManager.getPiece(symbol);
    }
    
    /**
     * Get all custom piece symbols
     */
    getCustomPieceSymbols() {
        return this.pieceManager.getAllSymbols();
    }
}

// Make CustomChessEnhanced available globally
if (typeof window !== 'undefined') {
    window.CustomChessEnhanced = CustomChessEnhanced;
}

// For Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomChessEnhanced;
}