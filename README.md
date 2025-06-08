# 🎰 Advanced JavaScript Slot Machine

A beautiful, feature-rich slot machine game with multiple paylines, configurable grid sizes, and smooth animations built with HTML5 Canvas and JavaScript.

Wanted to create a slot machine with adjustable win rates etc, so I can gain better understanding of how they may work. Next step is adding a checker that calculates how much spent vs how much won, and adjust the win rate based on those variables.

https://horrelltech.github.io/slots-js/

## 🚀 New Features

### Multiple Paylines
- **Horizontal Lines**: Traditional left-to-right paylines
- **Diagonal Lines**: Top-left to bottom-right and top-right to bottom-left
- **V-Lines**: V-shaped and inverted V-shaped patterns
- **Zigzag Lines**: Sawtooth and reverse sawtooth patterns
- **Adjustable**: Choose how many paylines to play (1 to max available)

### Configurable Grid System
- **Easy Grid Resizing**: Supports 3x3, 5x3, 5x4, 6x4, and custom sizes
- **Dynamic Paylines**: Paylines adjust automatically based on grid size
- **Independent Cells**: Each cell can hold its own symbol/image
- **Responsive Layout**: Canvas adjusts to accommodate different grid sizes

### Enhanced Gameplay
- **Multi-line Betting**: Bet per line × number of active lines
- **Visual Paylines**: See active paylines and winning combinations
- **Win Animation**: Flashing effects for winning paylines
- **Staggered Reels**: Each reel stops independently for realistic feel

## 🎮 How to Play

1. **Set Your Bet**: Use +/- buttons to adjust bet per line (5-100 coins)
2. **Choose Paylines**: Select how many paylines to play (affects total bet)
3. **Spin**: Click "SPIN!" to play (costs: bet × paylines)
4. **Win**: Match 3+ symbols on any active payline from left to right
5. **Collect**: Winning combinations flash and add coins to your balance

## 🛠️ Easy Customization

### Grid Configuration
```javascript
// Quick reconfiguration
slotMachine.reconfigure(6, 4); // 6 reels, 4 rows

// Or modify in constructor
this.config = {
    reels: 5,           // Number of columns
    rows: 3,            // Number of rows
    symbolHeight: 80,   // Height of each symbol
    symbolWidth: 100,   // Width of each symbol
    spacing: 2          // Spacing between cells
};
```

### Symbol Customization
```javascript
this.symbols = [
    { 
        id: 'cherry',           // Unique identifier
        name: '🍒',            // Display symbol (emoji or text)
        value: 5,              // Base payout value
        probability: 0.3,      // Appearance probability
        color: '#ff6b6b'       // Symbol color theme
    },
    // Add more symbols...
];
```

### Adding Custom Paylines
```javascript
// Add to generatePaylines() method
const customLine = [
    { reel: 0, row: 0 },   // Position on grid
    { reel: 1, row: 1 },   // reel = column, row = row
    { reel: 2, row: 2 },   // Define any pattern you want
    // ... more positions
];

lines.push({ 
    id: 'custom_pattern', 
    name: 'Custom Line', 
    positions: customLine, 
    type: 'custom',
    color: '#ff0000'
});
```

### Image Support
To use images instead of emojis, modify the `drawSymbol()` method:
```javascript
// Replace emoji drawing with image drawing
const img = new Image();
img.src = `images/${symbol.id}.png`;
this.ctx.drawImage(img, x, y, width, height);
```

## 📊 Payline Types

| Type | Description | Pattern | Min Grid |
|------|-------------|---------|----------|
| Horizontal | Left to right straight lines | — — — — — | Any |
| Diagonal | Corner to corner lines | ╲ or ╱ | 3x3+ |
| V-Shape | Down then up pattern | ∨ | 5x3+ |
| Inv-V | Up then down pattern | ∧ | 5x3+ |
| Zigzag | Sawtooth patterns | ∿ | 5x3+ |

## 🎯 Win Conditions

- **3 Matches**: 1x symbol value × bet per line
- **4 Matches**: 3x symbol value × bet per line  
- **5 Matches**: 5x symbol value × bet per line
- **Multiple Lines**: Can win on multiple paylines simultaneously

## 📁 File Structure

- `index.html`: Main game interface with controls
- `slot-machine.js`: Complete game engine with payline system
- `README.md`: Documentation and customization guide

## 🔧 Configuration Examples

```javascript
// Small grid for quick games
slotMachine.reconfigure(3, 3);  // 3 paylines max

// Classic slot machine
slotMachine.reconfigure(5, 3);  // 9 paylines max

// Modern video slot
slotMachine.reconfigure(5, 4);  // 15+ paylines

// Mega slot machine
slotMachine.reconfigure(6, 4);  // 20+ paylines
```

## 🎨 Visual Features

- **Gradient Backgrounds**: Modern visual design
- **Colored Paylines**: Each payline has a unique color
- **Symbol Glows**: Symbols have colored glows matching their theme
- **Win Animations**: Flashing effects for winning combinations
- **Smooth Scrolling**: Realistic reel spinning with staggered stops

## 🌐 Browser Compatibility

Works in all modern browsers supporting HTML5 Canvas and ES6 classes.

## 📝 License

MIT License - Free to use and modify for your projects!
Simple slot machine written in javascript using a javascript canvas
