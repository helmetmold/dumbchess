const StandardBoard = require('./StandardBoard');
const HexagonalBoard = require('./HexagonalBoard');

// Board Factory for creating different board types
class BoardFactory {
  static boardTypes = {
    'standard': StandardBoard,
    'hexagonal': HexagonalBoard
  };

  static createBoard(type, config = {}) {
    const BoardClass = this.boardTypes[type];
    if (!BoardClass) {
      throw new Error(`Unknown board type: ${type}`);
    }
    return new BoardClass(config);
  }

  static registerBoardType(name, BoardClass) {
    this.boardTypes[name] = BoardClass;
  }

  static getAvailableBoardTypes() {
    return Object.keys(this.boardTypes);
  }

  static getBoardInfo(type) {
    const BoardClass = this.boardTypes[type];
    if (!BoardClass) {
      throw new Error(`Unknown board type: ${type}`);
    }

    // Create a temporary instance to get info
    const tempBoard = new BoardClass();
    
    return {
      type: type,
      name: BoardClass.name,
      description: this.getBoardDescription(type),
      validSquares: tempBoard.getValidSquares().length,
      geometry: this.getBoardGeometry(type)
    };
  }

  static getBoardDescription(type) {
    const descriptions = {
      'standard': 'Traditional 8x8 chess board',
      'hexagonal': 'Hexagonal board for fantasy variants',
      'circular': 'Circular board with radial movement',
      'triangular': 'Triangular board for three-player games'
    };
    return descriptions[type] || 'Custom board type';
  }

  static getBoardGeometry(type) {
    const geometries = {
      'standard': { shape: 'square', dimensions: '8x8' },
      'hexagonal': { shape: 'hexagon', dimensions: 'radius-based' },
      'circular': { shape: 'circle', dimensions: 'radius-based' },
      'triangular': { shape: 'triangle', dimensions: 'side-based' }
    };
    return geometries[type] || { shape: 'custom', dimensions: 'variable' };
  }
}

module.exports = BoardFactory;
