// Random Fun Chess Positions Database
// This file contains wacky and fun chess positions in FEN format for entertaining gameplay

const RandomFens = {
    // All Knights positions
    allKnights: [
        // All pieces are knights except kings
        "nnnnknnn/pppppppp/8/8/8/8/PPPPPPPP/NNNNKNNN w - - 0 1",
        
        // Mixed knights and pawns
        "nnnnknnn/pppppppp/8/8/8/8/PPPPPPPP/NNNNKNNN w - - 0 1",
        
        // Knights everywhere
        "nnnnknnn/nnnnnnnn/8/8/8/8/NNNNNNNN/NNNNKNNN w - - 0 1",
        
        // Knights with some pawns
        "nnnnknnn/pppppppp/8/8/8/8/PPPPPPPP/NNNNKNNN w - - 0 1",
        
        // Knights in formation
        "nnnnknnn/nnnnnnnn/8/8/8/8/NNNNNNNN/NNNNKNNN w - - 0 1"
    ],
    
    // All Queens positions
    allQueens: [
        // All pieces are queens except kings
        "qqqqkqqq/pppppppp/8/8/8/8/PPPPPPPP/QQQQKQQQ w - - 0 1",
        
        // Queens everywhere
        "qqqqkqqq/qqqqqqqq/8/8/8/8/QQQQQQQQ/QQQQKQQQ w - - 0 1",
        
        // Mixed queens and pawns
        "qqqqkqqq/pppppppp/8/8/8/8/PPPPPPPP/QQQQKQQQ w - - 0 1",
        
        // Queens in formation
        "qqqqkqqq/qqqqqqqq/8/8/8/8/QQQQQQQQ/QQQQKQQQ w - - 0 1",
        
        // Queens with some pawns
        "qqqqkqqq/pppppppp/8/8/8/8/PPPPPPPP/QQQQKQQQ w - - 0 1"
    ],
    
    // All Bishops positions
    allBishops: [
        // All pieces are bishops except kings
        "bbbbkbbb/pppppppp/8/8/8/8/PPPPPPPP/BBBBKBBB w - - 0 1",
        
        // Bishops everywhere
        "bbbbkbbb/bbbbbbbb/8/8/8/8/BBBBBBBB/BBBBKBBB w - - 0 1",
        
        // Mixed bishops and pawns
        "bbbbkbbb/pppppppp/8/8/8/8/PPPPPPPP/BBBBKBBB w - - 0 1",
        
        // Bishops in formation
        "bbbbkbbb/bbbbbbbb/8/8/8/8/BBBBBBBB/BBBBKBBB w - - 0 1",
        
        // Bishops with some pawns
        "bbbbkbbb/pppppppp/8/8/8/8/PPPPPPPP/BBBBKBBB w - - 0 1"
    ],
    
    // All Rooks positions
    allRooks: [
        // All pieces are rooks except kings
        "rrrrkrrr/pppppppp/8/8/8/8/PPPPPPPP/RRRRKRRR w - - 0 1",
        
        // Rooks everywhere
        "rrrrkrrr/rrrrrrrr/8/8/8/8/RRRRRRRR/RRRRKRRR w - - 0 1",
        
        // Mixed rooks and pawns
        "rrrrkrrr/pppppppp/8/8/8/8/PPPPPPPP/RRRRKRRR w - - 0 1",
        
        // Rooks in formation
        "rrrrkrrr/rrrrrrrr/8/8/8/8/RRRRRRRR/RRRRKRRR w - - 0 1",
        
        // Rooks with some pawns
        "rrrrkrrr/pppppppp/8/8/8/8/PPPPPPPP/RRRRKRRR w - - 0 1"
    ],
    
    // All Grasshoppers positions
    allGrasshoppers: [
        // All pieces are grasshoppers except kings
        "ggggkggg/pppppppp/8/8/8/8/PPPPPPPP/GGGGKGGG w - - 0 1",
        
        // Grasshoppers everywhere
        "ggggkggg/gggggggg/8/8/8/8/GGGGGGGG/GGGGKGGG w - - 0 1",
        
        // Mixed grasshoppers and pawns
        "ggggkggg/pppppppp/8/8/8/8/PPPPPPPP/GGGGKGGG w - - 0 1",
        
        // Grasshoppers in formation
        "ggggkggg/gggggggg/8/8/8/8/GGGGGGGG/GGGGKGGG w - - 0 1",
        
        // Grasshoppers with some pawns
        "ggggkggg/pppppppp/8/8/8/8/PPPPPPPP/GGGGKGGG w - - 0 1"
    ],
    
    // All Archbishops positions
    allArchbishops: [
        // All pieces are archbishops except kings
        "aaaakaaa/pppppppp/8/8/8/8/PPPPPPPP/AAAAKAAA w - - 0 1",
        
        // Archbishops everywhere
        "aaaakaaa/aaaaaaaa/8/8/8/8/AAAAAAAA/AAAAKAAA w - - 0 1",
        
        // Mixed archbishops and pawns
        "aaaakaaa/pppppppp/8/8/8/8/PPPPPPPP/AAAAKAAA w - - 0 1",
        
        // Archbishops in formation
        "aaaakaaa/aaaaaaaa/8/8/8/8/AAAAAAAA/AAAAKAAA w - - 0 1",
        
        // Archbishops with some pawns
        "aaaakaaa/pppppppp/8/8/8/8/PPPPPPPP/AAAAKAAA w - - 0 1"
    ],
    
    // Crazy mixed positions
    crazyMixed: [
        // All different pieces mixed up
        "qrnbkrbn/pppppppp/8/8/8/8/PPPPPPPP/QRNBKRBN w - - 0 1",
        
        // Pieces in wrong positions
        "kqrnbrnq/pppppppp/8/8/8/8/PPPPPPPP/KQRNBRNQ w - - 0 1",
        
        // Random piece arrangement
        "bnrqkrbn/pppppppp/8/8/8/8/PPPPPPPP/BNRQKRBN w - - 0 1",
        
        // Mixed up back rank
        "qkbnrbnr/pppppppp/8/8/8/8/PPPPPPPP/QKBNRBNR w - - 0 1",
        
        // Crazy setup
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1"
    ],
    
    // Helper function to ensure white always moves first
    ensureWhiteToMove: function(fen) {
        // Split FEN into parts and ensure the turn indicator is 'w'
        const parts = fen.split(' ');
        if (parts.length >= 2) {
            parts[1] = 'w';  // Force white to move
        }
        return parts.join(' ');
    },

    // Get a random FEN from a specific category
    getRandomFen: function(category = 'all') {
        let fens = [];

        console.log('Getting random FEN from category:', category);
        
        if (category === 'all') {
            fens = [
                ...this.allKnights,
                ...this.allQueens,
                ...this.allBishops,
                ...this.allRooks,
                ...this.allGrasshoppers,
                ...this.allArchbishops,
                ...this.crazyMixed
            ];
        } else if (this[category]) {
            fens = this[category];
        } else {
            // Fallback to all knights position
            return 'nnnnknnn/pppppppp/8/8/8/8/PPPPPPPP/NNNNKNNN w - - 0 1';
        }
        
        const randomIndex = Math.floor(Math.random() * fens.length);
        return this.ensureWhiteToMove(fens[randomIndex]);
    },
    
    // Get a random FEN with weighted probability (more likely to get fun positions)
    getWeightedRandomFen: function() {
        const weights = {
            //allKnights: 0.2,       // 20% chance
            //allQueens: 0.2,        // 20% chance
            //allBishops: 0.15,      // 15% chance
            //allRooks: 0.15,        // 15% chance
            allGrasshoppers: 0.5, // 15% chance - NEW!
            allArchbishops: 0.5,   // 10% chance - NEW!
            //crazyMixed: 0.05       // 5% chance
        };
        
        const random = Math.random();
        console.log('🎲 Random number generated:', random);
        let cumulative = 0;
        
        for (const [category, weight] of Object.entries(weights)) {
            cumulative += weight;
            console.log(`📊 Category: ${category}, Weight: ${weight}, Cumulative: ${cumulative}, Random: ${random}, Selected: ${random <= cumulative}`);
            if (random <= cumulative) {
                console.log('✅ Getting random FEN from category:', category);
                return this.ensureWhiteToMove(this.getRandomFen(category));
            }
        }
        
        
        // Fallback to all knights if something goes wrong
        return this.ensureWhiteToMove(this.getRandomFen('allKnights'));
    },
    
    // Get a random FEN based on game phase (early, middle, late)
    getFenByPhase: function(phase) {
        switch (phase) {
            case 'early':
                return this.ensureWhiteToMove(this.getRandomFen('allKnights'));  // Start with knights for early fun
            case 'middle':
                return this.ensureWhiteToMove(this.getRandomFen('allQueens'));   // Queens for middle game chaos
            case 'late':
                return this.ensureWhiteToMove(this.getRandomFen('crazyMixed'));  // Mixed pieces for late game
            default:
                return this.getWeightedRandomFen();
        }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RandomFens;
} else if (typeof window !== 'undefined') {
    window.RandomFens = RandomFens;
}