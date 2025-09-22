// Test script to demonstrate the versatile game engine

const GamemodeFactory = require('./gamemodes/GamemodeFactory');
const PieceFactory = require('./engine/pieces/PieceFactory');
const BoardFactory = require('./engine/boards/BoardFactory');

console.log('🎮 VERSATILE CHESS GAME ENGINE DEMO 🎮\n');

// Test 1: Show available gamemodes
console.log('📋 Available Gamemodes:');
const gamemodes = GamemodeFactory.getAvailableGamemodes();
gamemodes.forEach(gamemode => {
  console.log(`  • ${gamemode.name} (${gamemode.id})`);
  console.log(`    ${gamemode.description}`);
  console.log(`    Features: ${gamemode.features?.join(', ') || 'Standard'}`);
  console.log('');
});

// Test 2: Create a Dumb Chess game
console.log('🎲 Creating Dumb Chess Game:');
try {
  const dumbGame = GamemodeFactory.createGame('dumb-chess', 'test-1', 'player1', 'Alice');
  console.log(`  ✓ Game created: ${dumbGame.id}`);
  console.log(`  ✓ Board type: ${dumbGame.config.boardShape}`);
  console.log(`  ✓ Win conditions: ${dumbGame.config.winConditions.join(', ')}`);
  console.log('');
} catch (error) {
  console.log(`  ✗ Error: ${error.message}\n`);
}

// Test 3: Create a Dragon Chess game
console.log('🐉 Creating Dragon Chess Game:');
try {
  const dragonGame = GamemodeFactory.createGame('dragon-chess', 'test-2', 'player2', 'Bob');
  console.log(`  ✓ Game created: ${dragonGame.id}`);
  console.log(`  ✓ Board type: ${dragonGame.config.boardShape}`);
  console.log(`  ✓ Custom pieces: ${dragonGame.config.customPieces.join(', ')}`);
  console.log(`  ✓ Special rules: ${dragonGame.config.specialRules.join(', ')}`);
  console.log('');
} catch (error) {
  console.log(`  ✗ Error: ${error.message}\n`);
}

// Test 4: Show available pieces
console.log('♟️ Available Pieces:');
const pieces = PieceFactory.getAvailablePieces();
const standardPieces = PieceFactory.getStandardPieces();
const fantasyPieces = PieceFactory.getFantasyPieces();

console.log(`  Standard: ${standardPieces.join(', ')}`);
console.log(`  Fantasy: ${fantasyPieces.join(', ')}`);
console.log(`  Total: ${pieces.length} piece types\n`);

// Test 5: Show board types
console.log('🏁 Available Board Types:');
const boardTypes = BoardFactory.getAvailableBoardTypes();
boardTypes.forEach(type => {
  try {
    const info = BoardFactory.getBoardInfo(type);
    console.log(`  • ${info.name}: ${info.description}`);
  } catch (error) {
    console.log(`  • ${type}: Custom board type`);
  }
});
console.log('');

// Test 6: Create and test pieces
console.log('⚔️ Testing Piece Creation:');
try {
  const dragon = PieceFactory.createPiece('dragon', 'white', 'e4');
  console.log(`  ✓ Created ${dragon.type}: ${dragon.getSymbol()} (value: ${dragon.getValue()})`);
  
  const wizard = PieceFactory.createPiece('wizard', 'black', 'd5');
  console.log(`  ✓ Created ${wizard.type}: ${wizard.getSymbol()} (spells: ${wizard.properties.spellsRemaining})`);
  
  const phoenix = PieceFactory.createPiece('phoenix', 'white', 'f3');
  console.log(`  ✓ Created ${phoenix.type}: ${phoenix.getSymbol()} (resurrections: ${phoenix.properties.resurrectionsLeft})`);
  console.log('');
} catch (error) {
  console.log(`  ✗ Error creating pieces: ${error.message}\n`);
}

// Test 7: Test board creation
console.log('🏗️ Testing Board Creation:');
try {
  const standardBoard = BoardFactory.createBoard('standard');
  console.log(`  ✓ Standard board: ${standardBoard.getValidSquares().length} squares`);
  
  const hexBoard = BoardFactory.createBoard('hexagonal', { radius: 3 });
  console.log(`  ✓ Hexagonal board: ${hexBoard.getValidSquares().length} squares`);
  console.log('');
} catch (error) {
  console.log(`  ✗ Error creating boards: ${error.message}\n`);
}

// Test 8: Show gamemode statistics
console.log('📊 Gamemode Statistics:');
try {
  const stats = GamemodeFactory.getGamemodeStats();
  console.log(`  Total gamemodes: ${stats.total}`);
  console.log(`  Categories: ${Object.keys(stats.categories).join(', ')}`);
  console.log(`  Board types: ${Object.keys(stats.boardTypes).join(', ')}`);
  console.log(`  Popular features: ${Object.entries(stats.features).slice(0, 3).map(([f, c]) => `${f} (${c})`).join(', ')}`);
  console.log('');
} catch (error) {
  console.log(`  ✗ Error getting stats: ${error.message}\n`);
}

console.log('🎉 Engine demo complete! The system is ready for unlimited chess variants!\n');

console.log('🚀 To use the new server:');
console.log('  1. Run: node server-new.js');
console.log('  2. Visit: http://localhost:3000');
console.log('  3. API endpoints:');
console.log('     • GET /api/gamemodes - List all gamemodes');
console.log('     • GET /api/gamemodes/:id - Get gamemode details');
console.log('     • GET /api/stats - Get system statistics');
console.log('     • GET /health - Health check');
