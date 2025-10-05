// piece-manager.js - Manages custom chess pieces
class PieceManager {
    constructor() {
        this.pieces = new Map();
        this.loadedImages = new Map();
    }
    
    /**
     * Load custom pieces from definition array
     * @param {Array} pieceDefinitions - Array of piece definitions
     */
    loadPieces(pieceDefinitions) {
        console.log(`🎯 Loading ${pieceDefinitions.length} custom pieces...`);
        
        for (const pieceDef of pieceDefinitions) {
            if (!this.validatePieceDefinition(pieceDef)) {
                console.warn(`❌ Invalid piece definition:`, pieceDef);
                continue;
            }
            
            this.pieces.set(pieceDef.symbol, pieceDef);
            this.preloadImages(pieceDef);
            
            console.log(`✅ Loaded piece: ${pieceDef.name} (${pieceDef.symbol})`);
        }
        
        console.log(`✨ Successfully loaded ${this.pieces.size} custom pieces`);
    }
    
    /**
     * Validate a piece definition
     */
    validatePieceDefinition(piece) {
        if (!piece.symbol || piece.symbol.length !== 1) {
            console.error('Piece symbol must be a single character');
            return false;
        }
        
        if (!piece.name) {
            console.error('Piece must have a name');
            return false;
        }
        
        if (!piece.movePattern) {
            console.error('Piece must have a movePattern');
            return false;
        }
        
        return true;
    }
    
    /**
     * Preload piece images
     */
    preloadImages(piece) {
        if (!piece.images) return;
        
        ['white', 'black'].forEach(color => {
            if (piece.images[color]) {
                const img = new Image();
                img.src = piece.images[color];
                img.onload = () => {
                    console.log(`📸 Loaded image for ${color} ${piece.name}`);
                };
                img.onerror = () => {
                    console.warn(`⚠️ Failed to load image: ${piece.images[color]}`);
                };
                this.loadedImages.set(`${piece.symbol}_${color}`, img);
            }
        });
    }
    
    /**
     * Get a piece definition by symbol
     */
    getPiece(symbol) {
        return this.pieces.get(symbol);
    }
    
    /**
     * Get all piece symbols
     */
    getAllSymbols() {
        return Array.from(this.pieces.keys());
    }
    
    /**
     * Get all pieces
     */
    getAllPieces() {
        return Array.from(this.pieces.values());
    }
    
    /**
     * Check if a symbol represents a custom piece
     */
    isCustomPiece(symbol) {
        return this.pieces.has(symbol.toUpperCase());
    }
    
    /**
     * Get image path for a piece
     */
    getImagePath(symbol, color) {
        const piece = this.getPiece(symbol.toUpperCase());
        if (!piece || !piece.images) return null;
        
        return piece.images[color];
    }
    
    /**
     * Get fallback symbol for display
     */
    getFallbackSymbol(symbol) {
        const piece = this.getPiece(symbol.toUpperCase());
        return piece ? piece.fallbackSymbol : 'Q';
    }
    
    /**
     * Calculate valid moves for a custom piece
     * @param {string} from - Starting square (e.g., 'e4')
     * @param {string} symbol - Piece symbol
     * @param {object} boardState - Current board state
     * @returns {Array} - Array of valid destination squares
     */
    calculateMoves(from, symbol, boardState) {
        const piece = this.getPiece(symbol.toUpperCase());
        if (!piece) return [];
        
        const moves = [];
        const pattern = piece.movePattern;
        
        if (pattern.type === 'offset') {
            moves.push(...this.calculateOffsetMoves(from, pattern, boardState));
        } else if (pattern.type === 'hybrid') {
            for (const subPattern of pattern.patterns) {
                moves.push(...this.calculateOffsetMoves(from, subPattern, boardState));
            }
        }
        
        return moves;
    }
    
    /**
     * Calculate moves based on offset pattern
     */
    calculateOffsetMoves(from, pattern, boardState) {
        const moves = [];
        const fromIndex = this.squareToIndex(from);
        
        for (const offset of pattern.offsets) {
            if (pattern.range === 'single') {
                const targetIndex = fromIndex + offset;
                if (this.isValidMove(fromIndex, targetIndex, pattern, boardState)) {
                    moves.push(this.indexToSquare(targetIndex));
                }
            } else if (pattern.range === 'unlimited') {
                let currentIndex = fromIndex + offset;
                while (this.isValidMove(fromIndex, currentIndex, pattern, boardState)) {
                    moves.push(this.indexToSquare(currentIndex));
                    
                    // Stop if we hit a piece (unless we can jump)
                    if (boardState[currentIndex] && !pattern.canJump) {
                        break;
                    }
                    
                    currentIndex += offset;
                }
            }
        }
        
        return moves;
    }
    
    /**
     * Check if a move is valid
     */
    isValidMove(fromIndex, toIndex, pattern, boardState) {
        // Check board boundaries
        const fromFile = fromIndex % 16;
        const toFile = toIndex % 16;
        const fromRank = Math.floor(fromIndex / 16);
        const toRank = Math.floor(toIndex / 16);
        
        if (toFile < 0 || toFile > 7 || toRank < 0 || toRank > 7) {
            return false;
        }
        
        // Check if destination has a piece
        const targetPiece = boardState[toIndex];
        if (targetPiece) {
            // Can't capture if pattern doesn't allow
            if (!pattern.canCapture) return false;
            
            // Can't capture own piece
            // (This check would need piece color information)
        }
        
        return true;
    }
    
    /**
     * Convert square notation to index
     */
    squareToIndex(square) {
        const file = square.charCodeAt(0) - 97; // a=0, b=1, etc.
        const rank = 8 - parseInt(square[1]);   // 8=0, 7=1, etc.
        return rank * 16 + file;
    }
    
    /**
     * Convert index to square notation
     */
    indexToSquare(index) {
        const file = String.fromCharCode(97 + (index % 16));
        const rank = 8 - Math.floor(index / 16);
        return file + rank;
    }
}

// Make PieceManager available globally
if (typeof window !== 'undefined') {
    window.PieceManager = PieceManager;
}

// For Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PieceManager;
}
