// custom-chess-enhanced.js - Enhanced Custom Chess Engine
class CustomChessEnhanced {
    constructor(pieceManager) {
        // Create a Chess instance
        this.chess = new Chess();
        
        // Copy all methods and properties from Chess to this instance
        Object.assign(this, this.chess);
        
        // Store piece manager reference
        this.pieceManager = pieceManager || new PieceManager();
        
        // Initialize custom pieces if CUSTOM_PIECES is available
        if (typeof CUSTOM_PIECES !== 'undefined') {
            this.pieceManager.loadPieces(CUSTOM_PIECES);
        }
        
        console.log('✨ CustomChessEnhanced initialized with', this.pieceManager.pieces.size, 'custom pieces');
    }
    
    /**
     * Override load method to handle custom piece symbols in FEN
     */
    load(fen) {
        // Parse custom FEN and convert custom symbols to standard ones
        const parsedFen = this.parseCustomFen(fen);
        
        // Store custom piece positions for later reference
        this.customPiecePositions = this.extractCustomPiecePositions(fen);
        
        // Load the parsed FEN into the standard chess engine
        const result = this.chess.load(parsedFen);
        
        // Restore custom pieces by replacing standard pieces with custom ones
        this.restoreCustomPieces();
        
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
        
        if (!fen) return positions;
        
        const boardPart = fen.split(' ')[0];
        const ranks = boardPart.split('/');
        
        ranks.forEach((rank, rankIndex) => {
            let fileIndex = 0;
            
            for (let char of rank) {
                if (isNaN(char)) {
                    // It's a piece
                    const square = String.fromCharCode(97 + fileIndex) + (8 - rankIndex);
                    
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
        if (!this.customPiecePositions) return;
        
        this.customPiecePositions.forEach((pieceInfo, square) => {
            // Remove the standard piece that was placed there
            this.remove(square);
            
            // Place the custom piece
            this.put({ type: pieceInfo.symbol, color: pieceInfo.color }, square);
            
            console.log(`🔄 Restored custom piece ${pieceInfo.symbol} at ${square}`);
        });
    }
    
    /**
     * Override move method to handle custom pieces
     */
    move(moveObj) {
        const piece = this.get(moveObj.from);
        
        if (piece && this.pieceManager.isCustomPiece(piece.type)) {
            return this.validateCustomMove(moveObj);
        }
        
        // Use standard chess.js move validation for regular pieces
        return this.chess.move(moveObj);
    }
    
    /**
     * Validate moves for custom pieces
     */
    validateCustomMove(moveObj) {
        const piece = this.get(moveObj.from);
        const customPiece = this.pieceManager.getPiece(piece.type);
        
        if (!this.isValidCustomMove(moveObj.from, moveObj.to, piece)) {
            return null;
        }
        
        // Execute the move
        return this.executeCustomMove(moveObj, piece);
    }
    
    /**
     * Check if a custom piece move is valid
     */
    isValidCustomMove(from, to, piece) {
        const customPiece = this.pieceManager.getPiece(piece.type);
        if (!customPiece) return false;
        
        const pattern = customPiece.movePattern;
        const fromIndex = this.squareToIndex(from);
        const toIndex = this.squareToIndex(to);
        
        if (pattern.type === 'offset') {
            return this.validateOffsetMove(from, to, pattern, piece.color);
        } else if (pattern.type === 'hybrid') {
            // Check each sub-pattern
            for (const subPattern of pattern.patterns) {
                if (this.validateOffsetMove(from, to, subPattern, piece.color)) {
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
    executeCustomMove(moveObj, piece) {
        // Remove piece from source
        this.remove(moveObj.from);
        
        // Place piece on destination
        this.put({ type: piece.type, color: piece.color }, moveObj.to);
        
        // Toggle turn
        const currentTurn = this.turn();
        // Force turn change
        
        return {
            from: moveObj.from,
            to: moveObj.to,
            piece: piece.type,
            color: piece.color,
            captured: this.get(moveObj.to)
        };
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
        
        this.put({ type: symbol, color: color }, square);
        return true;
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