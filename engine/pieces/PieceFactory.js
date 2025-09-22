const { King, Queen, Rook, Bishop, Knight, Pawn } = require('./StandardPieces');
const { Dragon, Wizard, Phoenix, Unicorn, Assassin } = require('./FantasyPieces');

// Piece Factory for creating different piece types
class PieceFactory {
  static pieces = new Map();

  // Initialize with standard and fantasy pieces
  static init() {
    // Register standard pieces
    this.registerPiece('king', King);
    this.registerPiece('queen', Queen);
    this.registerPiece('rook', Rook);
    this.registerPiece('bishop', Bishop);
    this.registerPiece('knight', Knight);
    this.registerPiece('pawn', Pawn);

    // Register fantasy pieces
    this.registerPiece('dragon', Dragon);
    this.registerPiece('wizard', Wizard);
    this.registerPiece('phoenix', Phoenix);
    this.registerPiece('unicorn', Unicorn);
    this.registerPiece('assassin', Assassin);
  }

  static registerPiece(name, PieceClass) {
    this.pieces.set(name, PieceClass);
  }

  static createPiece(type, color, position) {
    const PieceClass = this.pieces.get(type);
    if (!PieceClass) {
      throw new Error(`Unknown piece type: ${type}`);
    }
    return new PieceClass(color, position);
  }

  static getAvailablePieces() {
    return Array.from(this.pieces.keys());
  }

  static getPieceInfo(type) {
    const PieceClass = this.pieces.get(type);
    if (!PieceClass) {
      throw new Error(`Unknown piece type: ${type}`);
    }

    // Create temporary piece to get info
    const tempPiece = new PieceClass('white', 'a1');
    
    return {
      type: type,
      name: PieceClass.name,
      value: tempPiece.getValue(),
      symbol: tempPiece.getSymbol(),
      abilities: tempPiece.properties.abilities || [],
      description: this.getPieceDescription(type)
    };
  }

  static getPieceDescription(type) {
    const descriptions = {
      // Standard pieces
      'king': 'Moves one square in any direction. Must be protected.',
      'queen': 'Moves any distance in any direction.',
      'rook': 'Moves any distance horizontally or vertically.',
      'bishop': 'Moves any distance diagonally.',
      'knight': 'Moves in an L-shape: two squares in one direction, then one square perpendicular.',
      'pawn': 'Moves forward one square, captures diagonally.',
      
      // Fantasy pieces
      'dragon': 'Moves like a queen but can fly over pieces. Breathes fire after moving.',
      'wizard': 'Moves like a knight or can teleport short distances using magic.',
      'phoenix': 'Moves diagonally and can resurrect once when captured.',
      'unicorn': 'Moves like a bishop/knight hybrid and heals nearby allies.',
      'assassin': 'Moves like a king, can become invisible and backstab enemies.'
    };
    
    return descriptions[type] || 'Custom piece with unique abilities.';
  }

  static getStandardPieces() {
    return ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'];
  }

  static getFantasyPieces() {
    return ['dragon', 'wizard', 'phoenix', 'unicorn', 'assassin'];
  }

  static isPieceType(type) {
    return this.pieces.has(type);
  }

  static clonePiece(piece) {
    if (!piece) return null;
    
    const PieceClass = this.pieces.get(piece.type);
    if (!PieceClass) {
      throw new Error(`Cannot clone unknown piece type: ${piece.type}`);
    }
    
    return piece.clone();
  }

  // Create piece from JSON data
  static createPieceFromJSON(data) {
    const PieceClass = this.pieces.get(data.type);
    if (!PieceClass) {
      throw new Error(`Unknown piece type in JSON: ${data.type}`);
    }
    
    return PieceClass.fromJSON(data);
  }

  // Get pieces by category
  static getPiecesByCategory(category) {
    const categories = {
      'standard': this.getStandardPieces(),
      'fantasy': this.getFantasyPieces(),
      'all': this.getAvailablePieces()
    };
    
    return categories[category] || [];
  }

  // Validate piece setup for a gamemode
  static validatePieceSetup(pieces) {
    const errors = [];
    
    for (const [square, pieceData] of Object.entries(pieces)) {
      if (!this.isPieceType(pieceData.type)) {
        errors.push(`Unknown piece type '${pieceData.type}' at ${square}`);
      }
      
      if (!['white', 'black'].includes(pieceData.color)) {
        errors.push(`Invalid color '${pieceData.color}' for piece at ${square}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
}

// Initialize the factory
PieceFactory.init();

module.exports = PieceFactory;
