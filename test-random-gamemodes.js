// Test script for random gamemode system
const GamemodeFactory = require('./gamemodes/GamemodeFactory');

console.log('🎲 TESTING RANDOM GAMEMODE SYSTEM 🎲\n');

// Test 1: Show available gamemodes
console.log('📋 Available Gamemodes:');
const gamemodes = GamemodeFactory.getAvailableGamemodes();
gamemodes.forEach((gamemode, index) => {
  console.log(`  ${index + 1}. ${gamemode.name}`);
  console.log(`     ${gamemode.description}`);
  console.log(`     Time: ${gamemode.timeControl} | Board: ${gamemode.boardShape}`);
  console.log('');
});

// Test 2: Test random selection (simulate 20 games)
console.log('🎯 Testing Random Selection (20 simulated games):');
const selectionCounts = {};

for (let i = 0; i < 20; i++) {
  const randomGamemode = GamemodeFactory.getWeightedRandomGamemode();
  selectionCounts[randomGamemode] = (selectionCounts[randomGamemode] || 0) + 1;
}

console.log('Results:');
for (const [gamemode, count] of Object.entries(selectionCounts)) {
  const percentage = (count / 20 * 100).toFixed(1);
  const info = GamemodeFactory.getGamemodeInfo(gamemode);
  console.log(`  ${info.name}: ${count}/20 (${percentage}%)`);
}
console.log('');

// Test 3: Test random gamemode with info
console.log('🎮 Random Gamemode Selection Examples:');
for (let i = 0; i < 5; i++) {
  const random = GamemodeFactory.getRandomGamemodeWithInfo();
  console.log(`  ${i + 1}. ${random.name} (${random.id})`);
  console.log(`     ${random.description}`);
  console.log(`     Features: ${random.features?.slice(0, 2).join(', ') || 'Standard'}`);
  console.log('');
}

// Test 4: Today's featured gamemode
console.log('⭐ Today\'s Featured Gamemode:');
try {
  const featuredId = GamemodeFactory.getTodaysFeaturedGamemode();
  const featuredInfo = GamemodeFactory.getGamemodeInfo(featuredId);
  console.log(`  ${featuredInfo.name} (${featuredId})`);
  console.log(`  ${featuredInfo.description}`);
  console.log('');
} catch (error) {
  console.log(`  Error: ${error.message}\n`);
}

// Test 5: Test game creation with random gamemode
console.log('🏗️ Testing Game Creation:');
try {
  for (let i = 0; i < 3; i++) {
    const randomGamemode = GamemodeFactory.getWeightedRandomGamemode();
    const game = GamemodeFactory.createGame(randomGamemode, `test-${i}`, `player-${i}`, `TestPlayer${i}`);
    
    console.log(`  ✓ Created ${game.getGamemodeInfo().name} game`);
    console.log(`    Game ID: ${game.id}`);
    console.log(`    Max Players: ${game.config.maxPlayers}`);
    console.log(`    Time Control: ${game.config.timeControl.initial}+${game.config.timeControl.increment}`);
    console.log(`    Board: ${game.config.boardShape}`);
    console.log('');
  }
} catch (error) {
  console.log(`  ✗ Error creating games: ${error.message}\n`);
}

// Test 6: Weighted distribution analysis
console.log('📊 Weighted Distribution Analysis (100 selections):');
const largeSelectionCounts = {};

for (let i = 0; i < 100; i++) {
  const randomGamemode = GamemodeFactory.getWeightedRandomGamemode();
  largeSelectionCounts[randomGamemode] = (largeSelectionCounts[randomGamemode] || 0) + 1;
}

console.log('Expected vs Actual distribution:');
const expectedWeights = {
  'dumb-chess': 30,
  'blitz': 25,
  'king-of-hill': 20,
  'atomic': 15,
  'dragon-chess': 10
};

for (const [gamemode, expectedWeight] of Object.entries(expectedWeights)) {
  const actualCount = largeSelectionCounts[gamemode] || 0;
  const actualPercentage = actualCount;
  const expectedPercentage = expectedWeight;
  
  try {
    const info = GamemodeFactory.getGamemodeInfo(gamemode);
    console.log(`  ${info.name}:`);
    console.log(`    Expected: ${expectedPercentage}% | Actual: ${actualPercentage}%`);
  } catch (error) {
    console.log(`  ${gamemode}: Expected: ${expectedPercentage}% | Actual: ${actualPercentage}%`);
  }
}

console.log('\n🎉 Random gamemode system test complete!');
console.log('\n🚀 To use the new server with random gamemodes:');
console.log('  1. Run: node server-new.js');
console.log('  2. Players will get random gamemodes when they click "Play Online"');
console.log('  3. Each game is a surprise!');
console.log('\n🎯 API Testing:');
console.log('  • GET /api/random-gamemode - Get a random gamemode');
console.log('  • GET /api/featured - Get today\'s featured gamemode');
console.log('  • GET /api/stats - Get system statistics');
