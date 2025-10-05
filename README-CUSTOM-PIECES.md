# Custom Chess Pieces System

This system allows you to create and use custom chess pieces in your game. You can define pieces with unique movement patterns, add custom images, and seamlessly integrate them with the existing chess game.

## Quick Start

### 1. Define Your Piece

Open `custom-pieces.js` and add your piece definition to the `CUSTOM_PIECES` array:

```javascript
{
    symbol: 'X',                      // Single letter for FEN notation
    name: 'Custom Piece',             // Display name
    value: 5,                         // Material value (1-10)
    description: 'How it moves',
    
    movePattern: {
        type: 'offset',
        offsets: [-16, 16, -1, 1],   // Rook-like moves
        range: 'unlimited',           // or 'single'
        canCapture: true,
        canJump: false,
        requiresJump: false
    },
    
    images: {
        white: 'img/wX.png',
        black: 'img/bX.png'
    },
    
    fallbackSymbol: 'R'               // Displays as rook if image missing
}
```

### 2. Add Images

Create or add images for your piece:
- Place white piece image as `img/wX.png` (where X is your symbol)
- Place black piece image as `img/bX.png`
- Supported formats: PNG, SVG
- Recommended size: 128x128 pixels

### 3. Use in Game

Load the enhanced chess engine in your HTML:

```html
<script src="custom-pieces.js"></script>
<script src="piece-manager.js"></script>
<script src="custom-chess-enhanced.js"></script>

<script>
    // Initialize the enhanced chess engine
    const pieceManager = new PieceManager();
    const game = new CustomChessEnhanced(pieceManager);
    
    // Place a custom piece
    game.placeCustomPiece('e4', 'G', 'w');  // White Grasshopper on e4
</script>
```

## Movement Patterns

### Board Representation

The chess board uses a 16x16 mailbox representation internally:
- Files (a-h): 0-7
- Ranks (1-8): 0-7 (from top to bottom)
- Each row has 16 spaces (8 used + 8 padding)

### Common Offset Values

```
-17  -16  -15     ↖  ↑  ↗
 -1   X    1      ←  X  →
 15   16   17     ↙  ↓  ↘
```

**Orthogonal (Rook-like):**
- Up: -16
- Down: 16
- Left: -1
- Right: 1

**Diagonal (Bishop-like):**
- Up-Left: -17
- Up-Right: -15
- Down-Left: 15
- Down-Right: 17

**Knight moves:**
- [-33, -31, -18, -14, 14, 18, 31, 33]

**Camel moves (3-1 pattern):**
- [-49, -47, -34, -30, 30, 34, 47, 49]

### Pattern Types

#### 1. Offset Pattern (Simple)
For pieces with straightforward movement:

```javascript
movePattern: {
    type: 'offset',
    offsets: [-16, -1, 1, 16],  // Rook moves
    range: 'unlimited',          // Can slide multiple squares
    canCapture: true,
    canJump: false               // Can't jump over pieces
}
```

#### 2. Hybrid Pattern (Complex)
For pieces combining multiple movement types:

```javascript
movePattern: {
    type: 'hybrid',
    patterns: [
        {
            offsets: [-16, -1, 1, 16],  // Rook part
            range: 'unlimited',
            canJump: false
        },
        {
            offsets: [-33, -31, -18, -14, 14, 18, 31, 33],  // Knight part
            range: 'single',
            canJump: true
        }
    ],
    canCapture: true
}
```

### Special Properties

- **canJump**: Piece can jump over other pieces (like knight)
- **requiresJump**: Piece MUST jump over exactly one piece to move (like grasshopper)
- **range**: 
  - `'single'`: Moves only one square in pattern direction
  - `'unlimited'`: Can slide multiple squares until blocked

## Example Pieces

### Grasshopper
Moves like a queen but must jump over exactly one piece:
```javascript
movePattern: {
    type: 'offset',
    offsets: [-16, -15, -17, -1, 1, 15, 16, 17],
    range: 'unlimited',
    canCapture: true,
    requiresJump: true
}
```

### Archbishop (Bishop + Knight)
Combines bishop and knight moves:
```javascript
movePattern: {
    type: 'hybrid',
    patterns: [
        { offsets: [-17, -15, 15, 17], range: 'unlimited', canJump: false },
        { offsets: [-33, -31, -18, -14, 14, 18, 31, 33], range: 'single', canJump: true }
    ],
    canCapture: true
}
```

### Mann (King without royal status)
Moves like a king but can be captured:
```javascript
movePattern: {
    type: 'offset',
    offsets: [-17, -16, -15, -1, 1, 15, 16, 17],
    range: 'single',
    canCapture: true,
    canJump: false
}
```

## Image Guidelines

### Creating Piece Images

1. **Size**: 128x128 pixels (or larger, maintains aspect ratio)
2. **Format**: PNG with transparency or SVG
3. **Style**: Match existing piece style for consistency
4. **Naming**: `w[SYMBOL].png` for white, `b[SYMBOL].png` for black

### Image Placement

Place all piece images in the `img/` folder:
```
img/
  ├── wG.png  (White Grasshopper)
  ├── bG.png  (Black Grasshopper)
  ├── wA.png  (White Archbishop)
  ├── bA.png  (Black Archbishop)
  └── ...
```

## Integration with Game Modes

### Local Game (index.html)
```html
<script src="custom-pieces.js"></script>
<script src="piece-manager.js"></script>
<script src="custom-chess-enhanced.js"></script>
```

### Online Multiplayer (game-simple.html)
The custom pieces system works with multiplayer mode. Both players must have the same piece definitions loaded.

## Troubleshooting

**Piece doesn't move:**
- Check offset values match desired movement
- Verify `range` is set correctly
- Check `canJump` for pieces that should jump

**Image not showing:**
- Verify image path in `images` property
- Check file exists in `img/` folder
- Ensure file name matches pattern (case-sensitive)
- Check browser console for loading errors

**Move validation failing:**
- Use browser console to debug
- Check `isValidCustomMove` return value
- Verify pattern type matches definition

## Advanced: Custom Move Functions

For complex pieces with special rules, you can extend the `CustomChessEnhanced` class:

```javascript
class MyCustomChess extends CustomChessEnhanced {
    validateCustomMove(moveObj) {
        // Add your custom logic here
        return super.validateCustomMove(moveObj);
    }
}
```

## Material Values Guide

Use these as guidelines:
- Pawn: 1
- Knight/Bishop: 3
- Rook: 5
- Queen: 9
- Archbishop: 7-8
- Chancellor: 8-9
- Grasshopper: 4-5
- Mann: 3-4

## Support

For issues or questions:
1. Check this documentation
2. Review example pieces in `custom-pieces.js`
3. Check browser console for errors
4. Verify piece definition structure
