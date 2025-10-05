// custom-pieces.js - Define Your Custom Chess Pieces Here
// This file contains all custom piece definitions for the chess game

/**
 * Custom Piece Definition Structure:
 * {
 *   symbol: 'X',                    // Single uppercase letter used in FEN notation
 *   name: 'Piece Name',             // Display name for the piece
 *   value: 5,                       // Material value (for AI evaluation)
 *   description: 'Movement description',
 *   
 *   // Movement definition
 *   movePattern: {
 *     type: 'offset',               // 'offset', 'function', or 'hybrid'
 *     offsets: [-16, -15, ...],     // Array of board offsets (8x8 = 64, with 16 for padding)
 *     range: 'unlimited',           // 'single', 'limited', or 'unlimited'
 *     canCapture: true,             // Can this piece capture?
 *     canJump: false,               // Can this piece jump over other pieces?
 *     requiresJump: false           // Must this piece jump over a piece to move?
 *   },
 *   
 *   // Visual properties
 *   images: {
 *     white: 'img/wX.png',          // Path to white piece image
 *     black: 'img/bX.png'           // Path to black piece image
 *   },
 *   
 *   // For display purposes when custom images aren't available
 *   fallbackSymbol: 'R'             // Standard piece to display as fallback
 * }
 */

const CUSTOM_PIECES = [
    // Example 1: Grasshopper - Jumps over pieces like a hopper
    {
        symbol: 'G',
        name: 'Grasshopper',
        value: 5,
        description: 'Moves 2 squares in any direction, can jump over pieces',
        
        movePattern: {
            type: 'offset',
            // Knight-like moves but 2 squares in any direction
            offsets: [
                -32, -30, -34, -2, 2, 30, 32, 34,  // 2 squares in all 8 directions
                -31, -33, -1, 1, 31, 33            // Additional knight-like offsets
            ],
            range: 1,  // Only move 1 step in these directions
            canCapture: true,
            canJump: true,  // Can jump over pieces
            requiresJump: false  // Don't require jumping
        },
        
        images: {
            white: 'img/wG.svg',
            black: 'img/bG.svg'
        },
        
        fallbackSymbol: 'Q'
    },
    
    // Example 2: Archbishop (Bishop + Knight)
    {
        symbol: 'A',
        name: 'Archbishop',
        value: 8,
        description: 'Combines bishop and knight moves',
        
        movePattern: {
            type: 'hybrid',
            patterns: [
                {
                    // Bishop moves
                    offsets: [-17, -15, 15, 17],
                    range: 'unlimited',
                    canJump: false
                },
                {
                    // Knight moves
                    offsets: [-33, -31, -18, -14, 14, 18, 31, 33],
                    range: 'single',
                    canJump: true
                }
            ],
            canCapture: true
        },
        
        images: {
            white: 'img/wA.svg',
            black: 'img/bA.svg'
        },
        
        fallbackSymbol: 'B'
    }
];

// Make the custom pieces available globally
if (typeof window !== 'undefined') {
    window.CUSTOM_PIECES = CUSTOM_PIECES;
}

// For Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CUSTOM_PIECES;
}
