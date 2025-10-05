// custom-chess.js - Simple Custom Chess Engine
class CustomChess {
    constructor() {
        // Create a Chess instance
        this.chess = new Chess();
        
        // Copy all methods and properties from Chess to this instance
        Object.assign(this, this.chess);
        
        // Initialize custom properties
        this.customPieces = new Map();
        this.customPieceSymbols = new Set();
        this.initializeCustomPieces();
    }

    // Initialize default custom pieces (simplified for now)s
    initializeCustomPieces() {
        this.addCustomPiece('G', {
            name: 'hopper',
            moves: [-16, 1, 16, -1], // Rook directions
            value: 5,
            jumpOver: true, // Special property for jumping over pieces
            description: 'Moves like a rook but must jump over a piece',
            // Visual properties
            displaySymbol: 'G', // Symbol used in FEN
            boardSymbol: 'R',   // Symbol to use on chessboard (rook-like)
            imageFormat: 'png', // Image format (png, svg, etc.)
            imagePath: 'img/{piece}.png' // Path pattern for images
        });
    }

    // Add a new custom piece
    addCustomPiece(symbol, definition) {
        this.customPieces.set(symbol, definition);
        this.customPieceSymbols.add(symbol);
        console.log(`Added custom piece: ${definition.name} (${symbol})`);
    }

    // Override the move method to handle custom pieces
    move(moveObj) {
        const piece = this.get(moveObj.from);
        
        if (piece && this.customPieces.has(piece.type)) {
            return this.validateCustomMove(moveObj);
        }
        
        // Use standard chess.js move validation for regular pieces
        return this.chess.move(moveObj);
    }

    // Validate moves for custom pieces
    validateCustomMove(moveObj) {
        const piece = this.get(moveObj.from);
        const customPiece = this.customPieces.get(piece.type);
        
        if (!this.isValidCustomMove(moveObj.from, moveObj.to, piece.type)) {
            return null;
        }

        // Use chess.js to actually make the move
        return this.chess.move(moveObj);
    }

    // Check if a custom piece move is valid
    isValidCustomMove(from, to, pieceType) {
        const customPiece = this.customPieces.get(pieceType);
        const fromIndex = this.squareToIndex(from);
        const toIndex = this.squareToIndex(to);
        const offset = toIndex - fromIndex;

        // Check if the offset matches any of the piece's moves
        if (!customPiece.moves.includes(offset)) {
            return false;
        }

        // Handle special movement rules
        if (customPiece.jumpOver) {
            return this.validateJumpMove(from, to, pieceType);
        }

        // Standard collision checking
        return this.validateStandardMove(from, to, pieceType);
    }

    // Validate jump moves (like Grasshopper)
    validateJumpMove(from, to, pieceType) {
        const fromIndex = this.squareToIndex(from);
        const toIndex = this.squareToIndex(to);
        const direction = this.getDirection(fromIndex, toIndex);
        
        // Check if there's a piece to jump over
        let currentSquare = fromIndex + direction;
        let foundPiece = false;
        
        while (currentSquare !== toIndex) {
            if (this.board[currentSquare] !== null) {
                foundPiece = true;
                break;
            }
            currentSquare += direction;
        }
        
        return foundPiece;
    }

    // Validate standard moves (with collision checking)
    validateStandardMove(from, to, pieceType) {
        const fromIndex = this.squareToIndex(from);
        const toIndex = this.squareToIndex(to);
        const direction = this.getDirection(fromIndex, toIndex);
        
        // Check for pieces in the path
        let currentSquare = fromIndex + direction;
        while (currentSquare !== toIndex) {
            if (this.board[currentSquare] !== null) {
                return false; // Path is blocked
            }
            currentSquare += direction;
        }
        
        // Check destination square
        const targetPiece = this.board[toIndex];
        if (targetPiece && targetPiece.color === this.turn()) {
            return false; // Can't capture own piece
        }
        
        return true;
    }

    // Helper methods for board calculations
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

    getDirection(from, to) {
        const diff = to - from;
        if (diff === 0) return 0;
        
        const fileDiff = (to % 16) - (from % 16);
        const rankDiff = Math.floor(to / 16) - Math.floor(from / 16);
        
        if (fileDiff === 0) return rankDiff > 0 ? 16 : -16; // Vertical
        if (rankDiff === 0) return fileDiff > 0 ? 1 : -1;  // Horizontal
        
        // Diagonal
        const gcd = this.gcd(Math.abs(fileDiff), Math.abs(rankDiff));
        return (fileDiff / gcd) + (rankDiff / gcd) * 16;
    }

    gcd(a, b) {
        return b === 0 ? a : this.gcd(b, a % b);
    }

    // Place a custom piece on the board
    placeCustomPiece(square, symbol, color = 'w') {
        if (!this.customPieces.has(symbol)) {
            console.error(`Custom piece '${symbol}' not found`);
            return false;
        }
        
        this.put({ type: symbol, color: color }, square);
        return true;
    }

    // Get custom piece info
    getCustomPieceInfo(symbol) {
        return this.customPieces.get(symbol);
    }

    // Convert FEN for board display
    convertFenForBoard(fen) {
        let convertedFen = fen;
        
        // Replace custom pieces with their board equivalents
        for (const [symbol, pieceInfo] of this.customPieces) {
            const regex = new RegExp(symbol, 'g');
            convertedFen = convertedFen.replace(regex, pieceInfo.boardSymbol);
        }
        
        return convertedFen;
    }

    // Check if a piece is custom
    isCustomPiece(symbol) {
        return this.customPieces.has(symbol);
    }

    // Get all custom piece symbols
    getCustomPieceSymbols() {
        return Array.from(this.customPieces.keys());
    }

    // Get custom piece positions from FEN
    getCustomPiecePositions(fen) {
        const positions = new Map();
        const customSymbols = this.getCustomPieceSymbols();
        const boardArray = this.fenToBoardArray(fen);
        
        console.log('🔍 Analyzing FEN for custom pieces:', fen);
        console.log('🔍 Custom symbols to look for:', customSymbols);
        console.log('🔍 Board array:', boardArray);
        
        for (let i = 0; i < boardArray.length; i++) {
            const piece = boardArray[i];
            if (piece && customSymbols.includes(piece.toUpperCase())) {
                const color = piece === piece.toUpperCase() ? 'w' : 'b';
                const square = this.indexToSquare(i);
                const customPiece = this.getCustomPieceInfo(piece.toUpperCase());
                const boardPiece = color + customPiece.boardSymbol;
                
                console.log(`🎯 Found custom piece ${piece} at ${square}, will display as ${boardPiece}`);
                
                positions.set(square, {
                    customSymbol: piece.toUpperCase(),
                    color: color,
                    boardSymbol: customPiece.boardSymbol,
                    boardPiece: boardPiece
                });
            }
        }
        
        console.log('🎯 Final custom piece positions:', positions);
        return positions;
    }

    // Helper method to convert FEN to board array
    fenToBoardArray(fen) {
        const board = [];
        const parts = fen.split(' ')[0]; // Get just the board part
        const ranks = parts.split('/');
        
        for (const rank of ranks) {
            for (const char of rank) {
                if (isNaN(char)) {
                    board.push(char);
                } else {
                    // Add empty squares
                    for (let i = 0; i < parseInt(char); i++) {
                        board.push(null);
                    }
                }
            }
        }
        
        return board;
    }

    // Helper method to convert index to square notation
    indexToSquare(index) {
        const file = String.fromCharCode(97 + (index % 8)); // a-h
        const rank = 8 - Math.floor(index / 8); // 1-8
        return file + rank;
    }
}