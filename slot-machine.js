class SlotMachine {
    constructor() {
        this.canvas = document.getElementById('slotCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.coinCount = 1000;
        this.betAmount = 10;
        this.isSpinning = false;
        this.winRate = 50; // Win rate percentage (0-100)
        this.minWinLength = 3; // Minimum symbols needed for a win (configurable)
        this.wildRarity = 0.05; // Wild symbol rarity (5% default)
        this.isFullscreen = false; // Fullscreen mode toggle

        // New reel mechanics variables
        this.spinSpeed = 15; // Base spin speed (adjustable)
        this.randomizeReelOnSpin = false; // Set to true for random reels each spin, false for physical slot behavior
        this.reelStripLength = 100; // Length of each reel strip
        

        // Image support configuration
        this.useImages = false; // Set to true to use images instead of emojis
        this.imagesPath = 'images/'; // Path to images directory
        this.imageCache = {}; // Cache for loaded images

        /* TO ENABLE IMAGE MODE:
        // 1. Set useImages to true
        // 2. Uncomment the image symbols array below and comment out emoji symbols
        // 3. Add corresponding .png files to the images/ folder:
        //    - cherry.png, lemon.png, orange.png, grapes.png
        //    - bell.png, diamond.png, star.png, wild.png
        // 4. Images will be automatically scaled to fit reel cells
        */

        // Configurable slot dimensions
        this.config = {
            reels: 5,           // Number of columns (easily adjustable)
            rows: 3,            // Number of rows (easily adjustable)
            symbolHeight: 80,
            symbolWidth: 100,
            spacing: 2
        };

        // Calculate dimensions based on config
        this.reelWidth = (this.canvas.width - (this.config.reels - 1) * this.config.spacing) / this.config.reels;
        this.rowHeight = (this.canvas.height - (this.config.rows - 1) * this.config.spacing) / this.config.rows;        // Free spins configuration
        
        // Free spins configuration
        this.freeSpinsCount = 0;
        this.baseFreeSpins = 10; // Base number of free spins awarded
        this.scatterThreshold = 3; // Minimum scatters needed for free spins
        this.scatterSpawnRate = 0.03; // Base scatter spawn rate (3%)
        this.isInFreeSpins = false;
        this.freeSpinMultiplier = 1.25; // Can be increased for bonus rounds

        // Symbol configuration with image support (including scatter)
        this.symbols = [
            { id: 'cherry', name: '🍒', value: 5, probability: 0.3, color: '#ff6b6b' },
            { id: 'lemon', name: '🍋', value: 10, probability: 0.25, color: '#ffd93d' },
            { id: 'orange', name: '🍊', value: 15, probability: 0.2, color: '#ff8c42' },
            { id: 'grapes', name: '🍇', value: 25, probability: 0.15, color: '#a8e6cf' },
            { id: 'bell', name: '🔔', value: 50, probability: 0.07, color: '#88d8c0' },
            { id: 'diamond', name: '💎', value: 100, probability: 0.02, color: '#b4a7d6' },
            { id: 'star', name: '⭐', value: 200, probability: 0.01, color: '#ffd700' },
            { id: 'wild', name: '🃏', value: 0, probability: 0.05, color: '#ff1493', isWild: true },
            { id: 'scatter', name: '🌟', value: 0, probability: 0.03, color: '#ffd700', isScatter: true }
        ];

        /* IMAGE SYMBOLS VERSION - Uncomment to use images instead of emojis
        // To use images: 
        // 1. Set this.useImages = true in constructor
        // 2. Place image files in the images/ folder with matching filenames
        // 3. Comment out the emoji symbols above and uncomment this section
        
        this.symbols = [
            { id: 'cherry', name: 'Cherry', value: 5, probability: 0.3, color: '#ff6b6b' },        // needs cherry.png
            { id: 'lemon', name: 'Lemon', value: 10, probability: 0.25, color: '#ffd93d' },        // needs lemon.png
            { id: 'orange', name: 'Orange', value: 15, probability: 0.2, color: '#ff8c42' },       // needs orange.png
            { id: 'grapes', name: 'Grapes', value: 25, probability: 0.15, color: '#a8e6cf' },      // needs grapes.png
            { id: 'bell', name: 'Bell', value: 50, probability: 0.07, color: '#88d8c0' },          // needs bell.png
            { id: 'diamond', name: 'Diamond', value: 100, probability: 0.02, color: '#b4a7d6' },   // needs diamond.png
            { id: 'star', name: 'Star', value: 200, probability: 0.01, color: '#ffd700' },         // needs star.png
            { id: 'wild', name: 'Wild', value: 0, probability: 0.05, color: '#ff1493', isWild: true }, // needs wild.png
            { id: 'scatter', name: '🌟', value: 0, probability: 0.03, color: '#ffd700', isScatter: true } // needs scatter.png
        ];
        */
        // Define multiple paylines (easily configurable)
        this.paylines = this.generatePaylines();
        this.activePaylines = [];
        this.maxPaylines = this.paylines.length;
        this.currentPaylineCount = this.maxPaylines; // Default to maximum paylines

        // Grid to store current symbols (rows x reels)
        this.grid = [];

        // Reel state for animation - now pre-determined strips
        this.reelStrips = []; // Pre-determined reel strips
        this.reelPositions = []; // Current position in each reel strip
        this.reelSpeeds = [];
        this.reelOffsets = [];
        this.spinStartTimes = [];

        this.initializeReels();
        this.loadImages(); // Load symbol images if using image mode
        this.updateDisplay();
        this.draw();
        
        // Initialize mobile support
        this.initializeMobileSupport();
    }

    initializeReels() {
        // Generate pre-determined reel strips (like physical slot machines)
        this.generateReelStrips();
        
        // Initialize grid from current reel positions
        this.updateGridFromReels();

        // Initialize reel animation states
        for (let i = 0; i < this.config.reels; i++) {
            this.reelPositions[i] = Math.floor(Math.random() * this.reelStripLength);
            this.reelSpeeds[i] = 0;
            this.reelOffsets[i] = 0;
            this.spinStartTimes[i] = 0;
        }
    }

    generateReelStrips() {
        this.reelStrips = [];
        
        for (let reelIndex = 0; reelIndex < this.config.reels; reelIndex++) {
            const strip = [];
            
            if (this.randomizeReelOnSpin) {
                // Generate basic random strip (will be regenerated each spin)
                for (let i = 0; i < this.reelStripLength; i++) {
                    strip.push(this.getBasicRandomSymbol());
                }
            } else {
                // Generate fixed strip with intelligent win rate consideration
                for (let i = 0; i < this.reelStripLength; i++) {
                    if (i === 0 || this.currentPaylineCount === 0) {
                        // First symbol or no paylines - use basic probability
                        strip.push(this.getBasicRandomSymbol());
                    } else {
                        // Consider win rate for subsequent symbols
                        strip.push(this.getRandomSymbolForStrip(reelIndex, i, strip));
                    }
                }
            }
            
            this.reelStrips[reelIndex] = strip;
        }
    }

    getRandomSymbolForStrip(reelIndex, position, currentStrip) {
        // Only apply win rate logic if we have paylines and position > 0
        if (this.winRate > 0 && this.currentPaylineCount > 0 && position > 0) {
            // Look at the previous symbol in this strip position
            const prevSymbol = currentStrip[position - 1];
            
            // Skip if previous symbol is wild or scatter
            if (prevSymbol && !prevSymbol.isWild && !prevSymbol.isScatter) {
                const winRateNormalized = this.winRate / 100.0;
                const shouldMatch = Math.random() < winRateNormalized;
                
                if (shouldMatch) {
                    return prevSymbol;
                }
            }
        }
        
        return this.getBasicRandomSymbol();
    }

    updateGridFromReels() {
        this.grid = [];
        for (let row = 0; row < this.config.rows; row++) {
            this.grid[row] = [];
            for (let reel = 0; reel < this.config.reels; reel++) {
                const stripPosition = (this.reelPositions[reel] + row) % this.reelStripLength;
                const symbol = this.reelStrips[reel][stripPosition];
                
                // Safety check to ensure symbol exists
                if (!symbol) {
                    console.warn(`Missing symbol at reel ${reel}, position ${stripPosition}`);
                    this.grid[row][reel] = this.getBasicRandomSymbol();
                } else {
                    this.grid[row][reel] = symbol;
                }
            }
        }
    }

    // Load images for symbols if image mode is enabled
    async loadImages() {
        if (!this.useImages) return;

        for (const symbol of this.symbols) {
            try {
                const img = new Image();
                img.src = `${this.imagesPath}${symbol.id}.png`;

                // Wait for image to load
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = () => {
                        console.warn(`Failed to load image for ${symbol.id}, falling back to emoji`);
                        resolve(); // Continue even if image fails to load
                    };
                });

                this.imageCache[symbol.id] = img;
            } catch (error) {
                console.warn(`Error loading image for ${symbol.id}:`, error);
            }
        }

        // Redraw once all images are loaded
        this.draw();
    }

    // Toggle fullscreen mode
    toggleFullscreen() {
        this.isFullscreen = !this.isFullscreen;

        if (this.isFullscreen) {
            document.body.classList.add('fullscreen-mode');
            
            if (this.isMobile) {
                // Mobile fullscreen
                this.canvas.width = window.innerWidth - 10;
                this.canvas.height = window.innerHeight - 100;
                
                // Hide address bar on mobile
                setTimeout(() => {
                    window.scrollTo(0, 1);
                }, 100);
            } else {
                // Desktop fullscreen
                this.canvas.width = window.innerWidth - 40;
                this.canvas.height = window.innerHeight - 200;
            }
        } else {
            document.body.classList.remove('fullscreen-mode');
            
            if (this.isMobile) {
                this.adjustCanvasForMobile();
            } else {
                this.canvas.width = 600;
                this.canvas.height = 400;
            }
        }

        this.reelWidth = (this.canvas.width - (this.config.reels - 1) * this.config.spacing) / this.config.reels;
        this.rowHeight = (this.canvas.height - (this.config.rows - 1) * this.config.spacing) / this.config.rows;

        this.draw();
        this.updateFullscreenButton();
        this.updateMobileUI();
    }

    updateFullscreenButton() {
        const button = document.getElementById('fullscreenButton');
        if (button) {
            button.textContent = this.isFullscreen ? 'Exit Fullscreen' : 'Fullscreen';
        }
    }

    generatePaylines() {
        const lines = [];
        const { reels, rows } = this.config;

        // Horizontal lines - one for each row
        for (let row = 0; row < rows; row++) {
            const line = [];
            for (let reel = 0; reel < reels; reel++) {
                line.push({ reel, row });
            }
            lines.push({
                id: `horizontal_${row}`,
                name: `Line ${row + 1}`,
                positions: line,
                type: 'horizontal',
                color: this.getPaylineColor(lines.length)
            });
        }

        // Diagonal lines (if we have enough space)
        if (rows >= 3 && reels >= 3) {
            // Top-left to bottom-right diagonal
            const diag1 = [];
            for (let i = 0; i < Math.min(reels, rows); i++) {
                diag1.push({ reel: i, row: i });
            }
            if (diag1.length >= 3) {
                lines.push({
                    id: 'diagonal_tlbr',
                    name: 'Diagonal ↘',
                    positions: diag1,
                    type: 'diagonal',
                    color: this.getPaylineColor(lines.length)
                });
            }

            // Top-right to bottom-left diagonal
            const diag2 = [];
            for (let i = 0; i < Math.min(reels, rows); i++) {
                diag2.push({ reel: i, row: rows - 1 - i });
            }
            if (diag2.length >= 3) {
                lines.push({
                    id: 'diagonal_trbl',
                    name: 'Diagonal ↙',
                    positions: diag2,
                    type: 'diagonal',
                    color: this.getPaylineColor(lines.length)
                });
            }
        }

        // V-shaped lines and variations
        if (rows >= 3 && reels >= 5) {
            // Standard V-shape
            const vLine = [];
            const midReel = Math.floor(reels / 2);
            for (let i = 0; i <= midReel; i++) {
                const row = Math.min(i, rows - 1);
                vLine.push({ reel: i, row: row });
            }
            for (let i = midReel + 1; i < reels; i++) {
                const row = Math.max(0, rows - 1 - (i - midReel));
                vLine.push({ reel: i, row: row });
            }
            if (vLine.length >= 3) {
                lines.push({
                    id: 'v_shape',
                    name: 'V-Line',
                    positions: vLine,
                    type: 'v-shape',
                    color: this.getPaylineColor(lines.length)
                });
            }

            // Inverted V-shape
            const invVLine = [];
            for (let i = 0; i <= midReel; i++) {
                const row = Math.max(0, rows - 1 - i);
                invVLine.push({ reel: i, row: row });
            }
            for (let i = midReel + 1; i < reels; i++) {
                const row = Math.min(i - midReel, rows - 1);
                invVLine.push({ reel: i, row: row });
            }
            if (invVLine.length >= 3) {
                lines.push({
                    id: 'inv_v_shape',
                    name: 'Inv-V Line',
                    positions: invVLine,
                    type: 'inv-v-shape',
                    color: this.getPaylineColor(lines.length)
                });
            }
        }

        // Zigzag patterns
        if (rows >= 3 && reels >= 5) {
            // Standard zigzag
            const zigzag = [];
            const zigzagPattern = [0, rows - 1, 0, rows - 1, 0];
            for (let i = 0; i < Math.min(reels, zigzagPattern.length); i++) {
                const row = zigzagPattern[i];
                if (row >= 0 && row < rows) {
                    zigzag.push({ reel: i, row: row });
                }
            }
            if (zigzag.length >= 3) {
                lines.push({
                    id: 'zigzag',
                    name: 'Zigzag',
                    positions: zigzag,
                    type: 'zigzag',
                    color: this.getPaylineColor(lines.length)
                });
            }

            // Reverse zigzag
            const revZigzag = [];
            const revZigzagPattern = [rows - 1, 0, rows - 1, 0, rows - 1];
            for (let i = 0; i < Math.min(reels, revZigzagPattern.length); i++) {
                const row = revZigzagPattern[i];
                if (row >= 0 && row < rows) {
                    revZigzag.push({ reel: i, row: row });
                }
            }
            if (revZigzag.length >= 3) {
                lines.push({
                    id: 'rev_zigzag',
                    name: 'Rev-Zigzag',
                    positions: revZigzag,
                    type: 'rev-zigzag',
                    color: this.getPaylineColor(lines.length)
                });
            }
        }

        // Additional complex patterns for more paylines (ideal for 5x3 to reach ~25 lines)
        if (rows >= 3 && reels >= 5) {
            // M-shaped pattern (down-up-down-up)
            const mShape = [
                { reel: 0, row: 0 },
                { reel: 1, row: rows - 1 },
                { reel: 2, row: 0 },
                { reel: 3, row: rows - 1 },
                { reel: 4, row: 0 }
            ];
            lines.push({
                id: 'm_shape',
                name: 'M-Shape',
                positions: mShape,
                type: 'm-shape',
                color: this.getPaylineColor(lines.length)
            });

            // W-shaped pattern (up-down-up-down)
            const wShape = [
                { reel: 0, row: rows - 1 },
                { reel: 1, row: 0 },
                { reel: 2, row: rows - 1 },
                { reel: 3, row: 0 },
                { reel: 4, row: rows - 1 }
            ];
            lines.push({
                id: 'w_shape',
                name: 'W-Shape',
                positions: wShape,
                type: 'w-shape',
                color: this.getPaylineColor(lines.length)
            });

            // Arrow patterns
            const arrowUp = [
                { reel: 0, row: rows - 1 },
                { reel: 1, row: 1 },
                { reel: 2, row: 0 },
                { reel: 3, row: 1 },
                { reel: 4, row: rows - 1 }
            ];
            lines.push({
                id: 'arrow_up',
                name: 'Arrow ↑',
                positions: arrowUp,
                type: 'arrow-up',
                color: this.getPaylineColor(lines.length)
            });

            const arrowDown = [
                { reel: 0, row: 0 },
                { reel: 1, row: 1 },
                { reel: 2, row: rows - 1 },
                { reel: 3, row: 1 },
                { reel: 4, row: 0 }
            ];
            lines.push({
                id: 'arrow_down',
                name: 'Arrow ↓',
                positions: arrowDown,
                type: 'arrow-down',
                color: this.getPaylineColor(lines.length)
            });
        }

        // Step patterns for additional variety
        if (rows >= 3 && reels >= 5) {
            // Step up pattern
            const stepUp = [
                { reel: 0, row: rows - 1 },
                { reel: 1, row: rows - 1 },
                { reel: 2, row: 1 },
                { reel: 3, row: 0 },
                { reel: 4, row: 0 }
            ];
            lines.push({
                id: 'step_up',
                name: 'Step Up',
                positions: stepUp,
                type: 'step-up',
                color: this.getPaylineColor(lines.length)
            });

            // Step down pattern
            const stepDown = [
                { reel: 0, row: 0 },
                { reel: 1, row: 0 },
                { reel: 2, row: 1 },
                { reel: 3, row: rows - 1 },
                { reel: 4, row: rows - 1 }
            ];
            lines.push({
                id: 'step_down',
                name: 'Step Down',
                positions: stepDown,
                type: 'step-down',
                color: this.getPaylineColor(lines.length)
            });
        }

        // Crown patterns
        if (rows >= 3 && reels >= 5) {
            const crownUp = [
                { reel: 0, row: 1 },
                { reel: 1, row: 0 },
                { reel: 2, row: 1 },
                { reel: 3, row: 0 },
                { reel: 4, row: 1 }
            ];
            lines.push({
                id: 'crown_up',
                name: 'Crown ↑',
                positions: crownUp,
                type: 'crown-up',
                color: this.getPaylineColor(lines.length)
            });

            const crownDown = [
                { reel: 0, row: 1 },
                { reel: 1, row: rows - 1 },
                { reel: 2, row: 1 },
                { reel: 3, row: rows - 1 },
                { reel: 4, row: 1 }
            ];
            lines.push({
                id: 'crown_down',
                name: 'Crown ↓',
                positions: crownDown,
                type: 'crown-down',
                color: this.getPaylineColor(lines.length)
            });
        }

        // Wave patterns
        if (rows >= 3 && reels >= 5) {
            const waveSmooth = [
                { reel: 0, row: 1 },
                { reel: 1, row: 0 },
                { reel: 2, row: 1 },
                { reel: 3, row: rows - 1 },
                { reel: 4, row: 1 }
            ];
            lines.push({
                id: 'wave_smooth',
                name: 'Wave ~',
                positions: waveSmooth,
                type: 'wave',
                color: this.getPaylineColor(lines.length)
            });

            const waveReverse = [
                { reel: 0, row: 1 },
                { reel: 1, row: rows - 1 },
                { reel: 2, row: 1 },
                { reel: 3, row: 0 },
                { reel: 4, row: 1 }
            ];
            lines.push({
                id: 'wave_reverse',
                name: 'Wave Rev ~',
                positions: waveReverse,
                type: 'wave-reverse',
                color: this.getPaylineColor(lines.length)
            });
        }

        // L-shaped patterns
        if (rows >= 3 && reels >= 5) {
            const lShapeLeft = [
                { reel: 0, row: 0 },
                { reel: 1, row: 0 },
                { reel: 2, row: 0 },
                { reel: 3, row: 1 },
                { reel: 4, row: rows - 1 }
            ];
            lines.push({
                id: 'l_left',
                name: 'L-Left',
                positions: lShapeLeft,
                type: 'l-left',
                color: this.getPaylineColor(lines.length)
            });

            const lShapeRight = [
                { reel: 0, row: rows - 1 },
                { reel: 1, row: 1 },
                { reel: 2, row: rows - 1 },
                { reel: 3, row: rows - 1 },
                { reel: 4, row: rows - 1 }
            ];
            lines.push({
                id: 'l_right',
                name: 'L-Right',
                positions: lShapeRight,
                type: 'l-right',
                color: this.getPaylineColor(lines.length)
            });
        }

        return lines;
    }

    getPaylineColor(index) {
        const colors = [
            '#ff4757', '#3742fa', '#2ed573', '#ffa502',
            '#ff6b81', '#5352ed', '#7bed9f', '#ff9ff3',
            '#70a1ff', '#dda0dd', '#98d8c8', '#f7b731'
        ];
        return colors[index % colors.length];
    }

    generateReelStrip() {
        const strip = [];
        // Create a longer strip for smooth scrolling
        for (let i = 0; i < 50; i++) {
            strip.push(this.getBasicRandomSymbol());
        }
        return strip;
    }
    
    // Generate a random symbol with intelligent win rate consideration
    getRandomSymbol(reelIndex = -1, rowIndex = -1) {
        // This method is now only used for initial generation
        // Win rate logic is handled in generateReelStrips instead
        return this.getBasicRandomSymbol();
    }

    // Analyze what symbols would create wins at this position
    analyzeWinPotential(reelIndex, rowIndex) {
        // This method is no longer needed with the simplified approach
        return { winningSymbols: [] };
    }

    // Check if placing a symbol at position would create a win
    wouldCreateWin(reelIndex, rowIndex, testSymbol) {
        // No longer needed with simplified approach
        return false;
    }

    // Get basic random symbol using probabilities
    getBasicRandomSymbol() {
        const rand = Math.random();
        let cumulative = 0;

        // Use original probabilities without win rate adjustments
        for (const symbol of this.symbols) {
            cumulative += symbol.probability;
            if (rand <= cumulative) {
                // Return a copy of the symbol to avoid reference issues
                return { ...symbol };
            }
        }

        // Fallback - return a copy of the first symbol
        return { ...this.symbols[0] };
    }

    // Get weighted random symbol from a subset
    getWeightedRandomSymbol(symbolSubset) {
        const rand = Math.random();
        let cumulative = 0;
        const totalWeight = symbolSubset.reduce((sum, symbol) => sum + symbol.probability, 0);

        for (const symbol of symbolSubset) {
            cumulative += symbol.probability / totalWeight;
            if (rand <= cumulative) {
                return symbol;
            }
        }

        return symbolSubset[0]; // Fallback
    } 
    
    adjustSymbolProbabilities() {
        // Simply return symbols with their original probabilities
        // Win rate is now handled in getRandomSymbol instead
        return this.symbols.map(symbol => ({
            ...symbol,
            adjustedProbability: symbol.probability
        }));
    }
    
    spin() {
        if (this.isSpinning) return;

        const totalBet = this.betAmount * this.currentPaylineCount;
        if (this.coinCount < totalBet) {
            this.showToast("💰 Not enough coins for this bet!", 'error', 3000);
            return;
        }

        // Regenerate reel strips if randomize is enabled
        if (this.randomizeReelOnSpin) {
            this.generateReelStrips();
        }

        this.coinCount -= totalBet;
        this.updateDisplay();
        this.isSpinning = true;
        this.activePaylines = [];

        document.getElementById('spinButton').disabled = true;
        this.showToast("🎰 Spinning reels...", 'info', 2000);

        const currentTime = Date.now();

        // Set different spin durations for each reel (staggered stopping)
        for (let i = 0; i < this.config.reels; i++) {
            this.reelSpeeds[i] = this.spinSpeed + Math.random() * 5; // Use configurable spin speed
            this.spinStartTimes[i] = currentTime;

            // Each reel stops at different times
            const stopDelay = 2000 + (i * 400) + Math.random() * 200;

            setTimeout(() => {
                this.stopReel(i);
            }, stopDelay);
        }

        // Check for win after all reels stop
        setTimeout(() => {
            this.checkWin();
            this.isSpinning = false;
            document.getElementById('spinButton').disabled = false;
        }, 2000 + (this.config.reels * 400) + 500);

        this.animate();
    }

    stopReel(reelIndex) {
        this.reelSpeeds[reelIndex] = 0;
        this.reelOffsets[reelIndex] = 0;

        // Set new position in the reel strip
        const minSpin = 20; // Minimum symbols to spin through
        const maxSpin = 50; // Maximum symbols to spin through
        const spinDistance = minSpin + Math.random() * (maxSpin - minSpin);
        this.reelPositions[reelIndex] = (this.reelPositions[reelIndex] + Math.floor(spinDistance)) % this.reelStripLength;

        // Update grid only when reel stops (not during animation)
        this.updateGridFromReels();
    }

    // Generate reel strip with intelligent symbol placement
    generateIntelligentReelStrip(reelIndex) {
        const strip = [];

        // For the visible area, use intelligent placement
        for (let i = 0; i < this.config.rows; i++) {
            strip.push(this.getRandomSymbol(reelIndex, i));
        }

        // Fill the rest with basic random symbols for animation
        for (let i = this.config.rows; i < 50; i++) {
            strip.push(this.getBasicRandomSymbol());
        }

        return strip;
    }


    animate() {
        if (!this.isSpinning) return;

        for (let i = 0; i < this.config.reels; i++) {
            if (this.reelSpeeds[i] > 0) {
                // Spin downward - only update visual offset, not the actual positions during animation
                this.reelOffsets[i] += this.reelSpeeds[i];

                // Keep offset within bounds
                if (this.reelOffsets[i] >= this.rowHeight) {
                    this.reelOffsets[i] -= this.rowHeight;
                    // Don't update reelPositions during animation - only for visual effect
                }
            }
        }

        this.draw();

        if (this.isSpinning) {
            requestAnimationFrame(() => this.animate());
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw paylines (behind symbols)
        this.drawPaylines();

        // Draw reels
        for (let reel = 0; reel < this.config.reels; reel++) {
            this.drawReel(reel);
        }

        // Draw grid lines
        this.drawGrid();

        // Draw winning paylines (on top)
        this.drawWinningPaylines();
    }

    drawPaylines() {
        if (this.isSpinning) return;

        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.3;

        // Draw active paylines
        for (let i = 0; i < this.currentPaylineCount && i < this.paylines.length; i++) {
            const payline = this.paylines[i];
            this.ctx.strokeStyle = payline.color;
            this.drawPayline(payline.positions);
        }

        this.ctx.globalAlpha = 1;
    }

    drawWinningPaylines() {
        if (this.activePaylines.length === 0) return;

        this.ctx.lineWidth = 4;
        this.ctx.globalAlpha = 0.8;

        for (const payline of this.activePaylines) {
            this.ctx.strokeStyle = payline.color;
            this.drawPayline(payline.positions);
        }

        this.ctx.globalAlpha = 1;
    }

    drawPayline(positions) {
        if (positions.length < 2) return;

        this.ctx.beginPath();

        const firstPos = positions[0];
        const startX = firstPos.reel * this.reelWidth + this.reelWidth / 2;
        const startY = firstPos.row * this.rowHeight + this.rowHeight / 2;
        this.ctx.moveTo(startX, startY);

        for (let i = 1; i < positions.length; i++) {
            const pos = positions[i];
            const x = pos.reel * this.reelWidth + this.reelWidth / 2;
            const y = pos.row * this.rowHeight + this.rowHeight / 2;
            this.ctx.lineTo(x, y);
        }

        this.ctx.stroke();
    }

    drawReel(reelIndex) {
        const reelX = reelIndex * this.reelWidth;
        const symbolsToShow = this.config.rows + 2; // Show extra symbols for smooth scrolling

        for (let i = -1; i < symbolsToShow; i++) {
            // Calculate visual position for smooth scrolling
            const visualOffset = Math.floor(this.reelOffsets[reelIndex] / this.rowHeight);
            const stripPosition = (this.reelPositions[reelIndex] + i + visualOffset) % this.reelStripLength;
            const symbol = this.reelStrips[reelIndex][stripPosition];

            const y = (i * this.rowHeight) + (this.reelOffsets[reelIndex] % this.rowHeight);

            // Only draw symbols that are visible and exist
            if (y > -this.rowHeight && y < this.canvas.height + this.rowHeight && symbol) {
                this.drawSymbol(symbol, reelX, y, this.reelWidth, this.rowHeight);
            }
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = '#f39c12';
        this.ctx.lineWidth = 2;

        // Draw vertical separators (between reels)
        for (let i = 1; i < this.config.reels; i++) {
            const x = i * this.reelWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Draw horizontal separators (between rows)
        for (let i = 1; i < this.config.rows; i++) {
            const y = i * this.rowHeight;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    } 
    
    drawSymbol(symbol, x, y, width, height) {
        // Safety check for undefined symbol
        if (!symbol || !symbol.name) {
            console.warn('Attempting to draw undefined symbol');
            return;
        }

        // Special effects for wild symbols
        if (symbol.isWild) {
            this.drawWildSymbol(symbol, x, y, width, height);
            return;
        }

        // Special effects for scatter symbols
        if (symbol.isScatter) {
            this.drawScatterSymbol(symbol, x, y, width, height);
            return;
        }

        // Background with symbol color
        const gradient = this.ctx.createRadialGradient(
            x + width / 2, y + height / 2, 0,
            x + width / 2, y + height / 2, width / 2
        );
        gradient.addColorStop(0, (symbol.color || '#ff6b6b') + '40');
        gradient.addColorStop(1, '#2c3e50');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x + 3, y + 3, width - 6, height - 6);

        // Draw image if available and image mode is enabled
        if (this.useImages && this.imageCache[symbol.id]) {
            const img = this.imageCache[symbol.id];

            // Calculate scaling to fit the cell while maintaining aspect ratio
            const scale = Math.min((width - 12) / img.width, (height - 12) / img.height);
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;

            // Center the image in the cell
            const imgX = x + (width - scaledWidth) / 2;
            const imgY = y + (height - scaledHeight) / 2;

            // Apply shadow effect
            this.ctx.save();
            this.ctx.shadowColor = symbol.color || '#ff6b6b';
            this.ctx.shadowBlur = 10;

            this.ctx.drawImage(img, imgX, imgY, scaledWidth, scaledHeight);

            this.ctx.restore();
        } else {
            // Fallback to emoji/text rendering
            this.ctx.font = Math.min(width, height) * 0.6 + 'px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.shadowColor = symbol.color || '#ff6b6b';
            this.ctx.shadowBlur = 10;

            this.ctx.fillText(
                symbol.name || '?',
                x + width / 2,
                y + height / 2
            );

            this.ctx.shadowBlur = 0;
        }

        // Subtle border
        this.ctx.strokeStyle = symbol.color || '#ff6b6b';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x + 3, y + 3, width - 6, height - 6);
    }

    drawWildSymbol(symbol, x, y, width, height) {
        // Pulsing animation effect
        const time = Date.now() / 1000;
        const pulse = Math.abs(Math.sin(time * 3)) * 0.3 + 0.7; // Pulse between 0.7 and 1.0

        // Animated rainbow gradient background
        const gradient = this.ctx.createRadialGradient(
            x + width / 2, y + height / 2, 0,
            x + width / 2, y + height / 2, width / 2
        );

        // Create shifting rainbow colors
        const hue1 = (time * 60) % 360;
        const hue2 = (time * 60 + 120) % 360;
        const hue3 = (time * 60 + 240) % 360;

        gradient.addColorStop(0, `hsl(${hue1}, 70%, 60%)`);
        gradient.addColorStop(0.5, `hsl(${hue2}, 70%, 40%)`);
        gradient.addColorStop(1, `hsl(${hue3}, 70%, 30%)`);

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x + 3, y + 3, width - 6, height - 6);

        // Pulsing outer glow
        this.ctx.shadowColor = symbol.color;
        this.ctx.shadowBlur = 20 * pulse;
        this.ctx.strokeStyle = symbol.color;
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
        this.ctx.shadowBlur = 0;

        // Wild symbol with enhanced effects
        this.ctx.font = Math.min(width, height) * 0.7 + 'px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Multi-colored text effect
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = '#ff1493';
        this.ctx.shadowBlur = 15 * pulse;

        // Scale the wild symbol slightly with the pulse
        this.ctx.save();
        this.ctx.translate(x + width / 2, y + height / 2);
        this.ctx.scale(pulse, pulse);

        this.ctx.fillText(symbol.name, 0, 0);

        this.ctx.restore();
        this.ctx.shadowBlur = 0;

        // Special "WILD" text overlay
        this.ctx.font = Math.min(width, height) * 0.15 + 'px Arial';
        this.ctx.fillStyle = '#ffff00';
        this.ctx.shadowColor = '#ff0000';
        this.ctx.shadowBlur = 5;
        this.ctx.fillText('WILD', x + width / 2, y + height - 10);
        this.ctx.shadowBlur = 0;
    }

    drawScatterSymbol(symbol, x, y, width, height) {
        // Sparkling animation effect
        const time = Date.now() / 1000;
        const sparkle = Math.abs(Math.sin(time * 4)) * 0.5 + 0.5; // Sparkle between 0.5 and 1.0

        // Animated golden gradient background
        const gradient = this.ctx.createRadialGradient(
            x + width / 2, y + height / 2, 0,
            x + width / 2, y + height / 2, width / 2
        );

        // Create shifting golden colors
        const hue1 = 45 + Math.sin(time * 2) * 15; // Golden yellow variations
        const hue2 = 60 + Math.sin(time * 2 + 1) * 15;

        gradient.addColorStop(0, `hsl(${hue1}, 90%, 70%)`);
        gradient.addColorStop(0.5, `hsl(${hue2}, 80%, 50%)`);
        gradient.addColorStop(1, `hsl(30, 70%, 30%)`);

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x + 3, y + 3, width - 6, height - 6);

        // Sparkling outer glow
        this.ctx.shadowColor = '#ffd700';
        this.ctx.shadowBlur = 25 * sparkle;
        this.ctx.strokeStyle = '#ffd700';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x + 2, y + 2, width - 4, height - 4);
        this.ctx.shadowBlur = 0;

        // Scatter symbol with enhanced effects
        this.ctx.font = Math.min(width, height) * 0.7 + 'px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Multi-colored text effect
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = '#ffd700';
        this.ctx.shadowBlur = 20 * sparkle;

        // Scale the scatter symbol slightly with the sparkle
        this.ctx.save();
        this.ctx.translate(x + width / 2, y + height / 2);
        this.ctx.scale(0.8 + sparkle * 0.4, 0.8 + sparkle * 0.4);

        this.ctx.fillText(symbol.name, 0, 0);

        this.ctx.restore();
        this.ctx.shadowBlur = 0;

        // Special "SCATTER" text overlay
        this.ctx.font = Math.min(width, height) * 0.12 + 'px Arial';
        this.ctx.fillStyle = '#ff6600';
        this.ctx.shadowColor = '#ffd700';
        this.ctx.shadowBlur = 3;
        this.ctx.fillText('SCATTER', x + width / 2, y + height - 8);
        this.ctx.shadowBlur = 0;

        // Add sparkling particles effect
        const numParticles = 3;
        for (let i = 0; i < numParticles; i++) {
            const angle = (time * 2 + i * (Math.PI * 2 / numParticles)) % (Math.PI * 2);
            const radius = 15 + Math.sin(time * 3 + i) * 5;
            const particleX = x + width / 2 + Math.cos(angle) * radius;
            const particleY = y + height / 2 + Math.sin(angle) * radius;

            this.ctx.fillStyle = `hsl(${45 + i * 20}, 100%, ${50 + sparkle * 50}%)`;
            this.ctx.shadowColor = this.ctx.fillStyle;
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(particleX - 1, particleY - 1, 2, 2);
        }
        this.ctx.shadowBlur = 0;
    } 

    countScatterSymbols() {
            let scatterCount = 0;
            
            // Count scatter symbols across the entire grid
            for (let row = 0; row < this.config.rows; row++) {
                for (let reel = 0; reel < this.config.reels; reel++) {
                    if (this.grid[row] && this.grid[row][reel] && this.grid[row][reel].isScatter) {
                        scatterCount++;
                    }
                }
            }
            
            return scatterCount;
        }
    
    checkWin() {
        let totalWin = 0;
        let totalWildsUsed = 0;
        this.activePaylines = [];

        // ONLY check for wins if we have active paylines
        if (this.currentPaylineCount === 0) {
            // No paylines = no wins possible
            this.showToast("ℹ️ No paylines active - no wins possible", 'info', 2000);
            return;
        }

        // Check for scatter symbols first (free spins)
        const scatterCount = this.countScatterSymbols();
        let freeSpinsAwarded = 0;

        if (scatterCount >= this.scatterThreshold) {
            // Award free spins based on scatter count
            freeSpinsAwarded = this.baseFreeSpins;

            // Multiply free spins for more scatters
            if (scatterCount > this.scatterThreshold) {
                const extraScatters = scatterCount - this.scatterThreshold;
                freeSpinsAwarded += extraScatters * this.baseFreeSpins;
            }

            this.freeSpinsCount += freeSpinsAwarded;

            let scatterMessage = `🌟 <strong>SCATTER BONUS!</strong><br/>`;
            scatterMessage += `${scatterCount} Scatters = ${freeSpinsAwarded} Free Spins!<br/>`;
            scatterMessage += `Total Free Spins: ${this.freeSpinsCount}`;

            this.showToast(scatterMessage, 'warning', 6000);
        }

        // Check each active payline for regular wins
        for (let i = 0; i < this.currentPaylineCount && i < this.paylines.length; i++) {
            const payline = this.paylines[i];
            let lineResult = this.checkPayline(payline);

            if (lineResult.payout > 0) {
                // Apply free spin multiplier if in free spins mode
                if (this.isInFreeSpins) {
                    lineResult.payout *= this.freeSpinMultiplier;
                }

                totalWin += lineResult.payout;
                totalWildsUsed += lineResult.wildsUsed;
                this.activePaylines.push(payline);
            }
        }

        if (totalWin > 0) {
            this.coinCount += totalWin;

            // Enhanced win message with free spins information
            let message = `🎉 <strong>BIG WIN!</strong><br/>+${totalWin} coins on ${this.activePaylines.length} line(s)!`;
            if (totalWildsUsed > 0) {
                message += `<br/>🃏 ${totalWildsUsed} Wild${totalWildsUsed > 1 ? 's' : ''} helped!`;
            }
            if (this.isInFreeSpins) {
                message += `<br/>🆓 Free Spin Bonus! (${this.freeSpinsCount} left)`;
            }
            if (totalWin >= 100) {
                message += '<br/>💎 JACKPOT TERRITORY! 💎';
            }

            this.showToast(message, 'win', 5000);
            this.updateDisplay();

            // Animate winning paylines
            this.animateWin();
        } else if (freeSpinsAwarded === 0) {
            // Only show lose messages if no free spins were awarded
            if (this.isInFreeSpins) {
                this.showToast(`🆓 Free Spin - Keep going! (${this.freeSpinsCount} left)`, 'info', 3000);
            } else if (this.winRate < 20) {
                this.showToast("😞 Tough luck! Low win rate active.", 'error', 3000);
            } else if (this.winRate > 80) {
                this.showToast("🤔 Almost! High win rate - keep spinning!", 'warning', 3000);
            } else {
                const encouragingMessages = [
                    "🎲 Keep spinning!",
                    "🍀 Better luck next time!",
                    "⭐ Almost there!",
                    "🎰 Try again!"
                ];
                const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
                this.showToast(randomMessage, 'info', 2500);
            }
        }
    }

    changeSpinSpeed(value) {
        if (this.isSpinning) return;

        this.spinSpeed = parseInt(value);
        document.getElementById('spinSpeedValue').textContent = value;

        let speedDescription = "";
        if (value <= 10) speedDescription = "Slow";
        else if (value <= 20) speedDescription = "Normal";
        else if (value <= 30) speedDescription = "Fast";
        else speedDescription = "Very Fast";

        this.showToast(`🎰 Spin Speed: ${value} (${speedDescription})`, 'info', 2000);
    }

    toggleRandomizeReels() {
        if (this.isSpinning) return;

        this.randomizeReelOnSpin = !this.randomizeReelOnSpin;
        
        // Regenerate reels based on new setting
        this.generateReelStrips();
        this.updateGridFromReels();
        this.draw();

        const mode = this.randomizeReelOnSpin ? "Random" : "Physical";
        this.showToast(`🎰 Reel Mode: ${mode}`, 'info', 2000);

        // Update button text
        const button = document.getElementById('randomizeReelsButton');
        if (button) {
            button.textContent = this.randomizeReelOnSpin ? 'Physical Reels' : 'Random Reels';
        }
    }

    findBestMatchFromLeft(symbols) {
        let bestMatch = { count: 0, symbol: null, wildsUsed: 0 };

        // Filter out any undefined symbols first
        const validSymbols = symbols.filter(symbol => symbol && symbol.id);
        if (validSymbols.length === 0) {
            return bestMatch;
        }

        // Get the first symbol (leftmost reel) - this determines what we're matching
        const firstSymbol = validSymbols[0];
        
        // If first symbol is wild, we need to determine what it represents
        if (firstSymbol.isWild) {
            // Look ahead to find the first non-wild symbol to determine the match type
            let targetSymbol = null;
            for (let i = 1; i < validSymbols.length; i++) {
                if (!validSymbols[i].isWild && !validSymbols[i].isScatter) {
                    targetSymbol = validSymbols[i];
                    break;
                }
            }
            
            // If no non-wild symbol found, treat as highest value symbol match
            if (!targetSymbol) {
                targetSymbol = this.symbols
                    .filter(s => !s.isWild && !s.isScatter)
                    .reduce((max, symbol) => symbol.value > max.value ? symbol : max);
            }
            
            // Count consecutive matches from left with this target
            let count = 0;
            let wildsUsed = 0;
            
            for (let i = 0; i < validSymbols.length; i++) {
                if (validSymbols[i].id === targetSymbol.id) {
                    count++;
                } else if (validSymbols[i].isWild) {
                    count++;
                    wildsUsed++;
                } else {
                    // Stop at first non-matching symbol
                    break;
                }
            }
            
            bestMatch = { count, symbol: targetSymbol, wildsUsed };
        }
        // If first symbol is scatter, no regular wins (scatters don't form paylines)
        else if (firstSymbol.isScatter) {
            return bestMatch; // No win for scatter symbols on paylines
        }
        // First symbol is a regular symbol
        else {
            let count = 0;
            let wildsUsed = 0;
            
            // Count consecutive matches from left
            for (let i = 0; i < validSymbols.length; i++) {
                if (validSymbols[i].id === firstSymbol.id) {
                    count++;
                } else if (validSymbols[i].isWild) {
                    count++;
                    wildsUsed++;
                } else {
                    // Stop at first non-matching symbol
                    break;
                }
            }
            
            bestMatch = { count, symbol: firstSymbol, wildsUsed };
        }

        return bestMatch;
    }
    
    checkPayline(payline) {
        const symbols = [];

        // During initialization, grid may not be fully built yet
        if (!this.grid || this.grid.length === 0) {
            return { payout: 0, wildsUsed: 0 };
        }

        // Get symbols along the payline with bounds checking
        for (const pos of payline.positions) {
            // Add bounds checking to prevent grid access errors
            if (pos.row >= 0 && pos.row < this.config.rows &&
                pos.reel >= 0 && pos.reel < this.config.reels &&
                this.grid[pos.row] && this.grid[pos.row][pos.reel]) {
                symbols.push(this.grid[pos.row][pos.reel]);
            } else {
                // Invalid position or incomplete grid - payline goes out of bounds
                return { payout: 0, wildsUsed: 0 };
            }
        }

        if (symbols.length < this.minWinLength) return { payout: 0, wildsUsed: 0 };

        // Enhanced matching with wild substitution - MUST START FROM LEFT
        const bestMatch = this.findBestMatchFromLeft(symbols);

        // Only pay out if we have enough consecutive matching symbols starting from the leftmost reel
        if (bestMatch.count >= this.minWinLength && bestMatch.symbol && bestMatch.symbol.value > 0) {
            // Calculate payout with more generous multipliers
            let multiplier = 1;
            if (bestMatch.count === 4) multiplier = 3;
            else if (bestMatch.count === 5) multiplier = 5;
            else if (bestMatch.count === 6) multiplier = 8; // For 6-reel grids

            // Wild bonus: if wilds helped create the win, add 50% bonus
            if (bestMatch.wildsUsed > 0) {
                multiplier *= 1.5;
            }

            const payout = Math.floor(bestMatch.symbol.value * multiplier * this.betAmount);
            
            return { payout, wildsUsed: bestMatch.wildsUsed };
        }

        return { payout: 0, wildsUsed: 0 };
    }

    animateWin() {
        // Flash winning paylines
        let flashCount = 0;
        const maxFlashes = 6;

        const flash = () => {
            this.draw();
            flashCount++;

            if (flashCount < maxFlashes) {
                setTimeout(() => {
                    // Clear winning lines temporarily
                    const temp = this.activePaylines;
                    this.activePaylines = [];
                    this.draw();
                    this.activePaylines = temp;

                    setTimeout(flash, 200);
                }, 200);
            }
        };

        flash();
    } showMessage(text, duration = 3000) {
        document.getElementById('message').textContent = text;
        setTimeout(() => {
            document.getElementById('message').textContent = '';
        }, duration);
    }

    // Toast notification system for better user feedback
    showToast(message, type = 'info', duration = 4000) {
        const container = document.getElementById('toastContainer');
        if (!container) {
            this.showMessage(message, duration);
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        if (this.isMobile) {
            toast.className += ' mobile';
        }
        toast.innerHTML = message;

        container.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);

        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 400);
        }, duration);

        const toasts = container.querySelectorAll('.toast');
        if (toasts.length > (this.isMobile ? 2 : 4)) {
            const oldestToast = toasts[0];
            oldestToast.classList.add('hide');
            setTimeout(() => {
                if (container.contains(oldestToast)) {
                    container.removeChild(oldestToast);
                }
            }, 400);
        }
    } 
    
    updateDisplay() {
        document.getElementById('coinCount').textContent = this.coinCount;
        document.getElementById('betAmount').textContent = this.betAmount;
        document.getElementById('paylineCount').textContent = this.currentPaylineCount;
        document.getElementById('totalBet').textContent = this.betAmount * this.currentPaylineCount;
        document.getElementById('maxPaylines').textContent = this.maxPaylines;
        document.getElementById('winRateValue').textContent = this.winRate;
    }

    changeBet(delta) {
        if (this.isSpinning) return;

        const newBet = this.betAmount + (delta * 5);
        if (newBet >= 5 && newBet <= 100) {
            this.betAmount = newBet;
            this.updateDisplay();
        }
    }
    
    changePaylines(delta) {
        if (this.isSpinning) return;

        const newCount = this.currentPaylineCount + delta;
        if (newCount >= 1 && newCount <= this.maxPaylines) {
            this.currentPaylineCount = newCount;
            this.updateDisplay();
            this.draw(); // Redraw with new paylines
        }
    } 
    
    changeWinRate(value) {
        if (this.isSpinning) return;

        this.winRate = parseInt(value);
        this.updateDisplay();

        let message = `🎰 Win Rate: ${this.winRate}%`;
        let description = "";
        let toastType = 'info';

        if (this.winRate === 0) {
            description = " - Never match adjacent cells";
            toastType = 'error';
        } else if (this.winRate <= 20) {
            description = " - Rarely match adjacent cells";
            toastType = 'error';
        } else if (this.winRate <= 40) {
            description = " - Sometimes match adjacent cells";
            toastType = 'warning';
        } else if (this.winRate <= 60) {
            description = " - Balanced matching";
            toastType = 'info';
        } else if (this.winRate <= 80) {
            description = " - Often match adjacent cells";
            toastType = 'warning';
        } else if (this.winRate < 100) {
            description = " - Almost always match adjacent cells";
            toastType = 'win';
        } else {
            description = " - Always match adjacent cells";
            toastType = 'win';
        }

        message += description;
        this.showToast(message, toastType, 3000);
    }

    changeWildRarity(value) {
        if (this.isSpinning) return;

        this.wildRarity = parseFloat(value) / 100.0; // Convert percentage to decimal
        document.getElementById('wildRarityValue').textContent = value;

        // Update the wild symbol probability in the symbols array
        const wildSymbol = this.symbols.find(s => s.isWild);
        if (wildSymbol) {
            wildSymbol.probability = this.wildRarity;
        }

        let rarityDescription = "";
        let toastType = 'info';

        if (value == 0) {
            rarityDescription = "None";
            toastType = 'error';
        } else if (value <= 5) {
            rarityDescription = "Rare";
            toastType = 'info';
        } else if (value <= 10) {
            rarityDescription = "Normal";
            toastType = 'info';
        } else if (value <= 15) {
            rarityDescription = "Common";
            toastType = 'warning';
        } else {
            rarityDescription = "Frequent";
            toastType = 'win';
        }

        this.showToast(`🃏 Wild Rarity: ${value}% (${rarityDescription})`, toastType, 2500);
    } 
    
    changeMinWinLength(value) {
        if (this.isSpinning) return;

        this.minWinLength = parseInt(value);
        document.getElementById('minWinValue').textContent = value;

        let lengthDescription = "";
        let toastType = 'info';

        if (value == 2) {
            lengthDescription = "Very Easy";
            toastType = 'win';
        } else if (value == 3) {
            lengthDescription = "Standard";
            toastType = 'info';
        } else if (value == 4) {
            lengthDescription = "Hard";
            toastType = 'warning';
        } else if (value == 5) {
            lengthDescription = "Very Hard";
            toastType = 'error';
        } else {
            lengthDescription = "Extreme";
            toastType = 'error';
        }

        this.showToast(`🎯 Min Win Length: ${value} symbols (${lengthDescription})`, toastType, 2500);
    }

    resetCoins() {
        if (this.isSpinning) return;

        this.coinCount = 1000;
        this.betAmount = 10;
        this.currentPaylineCount = 1;
        this.winRate = 50;
        this.updateDisplay();
        // Update slider position
        const winRateSlider = document.getElementById('winRateSlider');
        if (winRateSlider) winRateSlider.value = 50;
        this.showMessage("Game reset!");
    }

    // Add mobile detection method
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }

    // Initialize mobile-specific features
    initializeMobileSupport() {
        if (this.isMobile) {
            // Adjust canvas size for mobile
            this.adjustCanvasForMobile();
            
            // Add touch event listeners
            this.addTouchListeners();
            
            // Prevent default touch behaviors
            this.preventDefaultTouchBehaviors();
        }

        // Add window resize listener for orientation changes
        window.addEventListener('resize', () => {
            setTimeout(() => {
                this.handleResize();
            }, 100);
        });

        // Add orientation change listener
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleResize();
            }, 500);
        });
    }

    // Adjust canvas size for mobile devices
    adjustCanvasForMobile() {
        const canvas = this.canvas;
        const container = canvas.parentElement;
        
        if (this.isMobile && !this.isFullscreen) {
            // Mobile portrait mode
            if (window.innerHeight > window.innerWidth) {
                canvas.width = Math.min(window.innerWidth - 20, 380);
                canvas.height = Math.min(window.innerHeight * 0.4, 300);
            } 
            // Mobile landscape mode
            else {
                canvas.width = Math.min(window.innerWidth - 40, 500);
                canvas.height = Math.min(window.innerHeight - 180, 250);
            }
        }

        // Recalculate dimensions
        this.reelWidth = (canvas.width - (this.config.reels - 1) * this.config.spacing) / this.config.reels;
        this.rowHeight = (canvas.height - (this.config.rows - 1) * this.config.spacing) / this.config.rows;
        
        this.draw();
    }

    // Add touch event listeners
    addTouchListeners() {
        // Touch events for spin
        const spinButton = document.getElementById('spinButton');
        if (spinButton) {
            spinButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleTouchStart();
            });
            
            spinButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (!this.isSpinning) {
                    this.spin();
                }
            });
        }

        // Touch events for canvas (swipe to spin)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchStartY = e.touches[0].clientY;
            this.isTouch = true;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.isTouch) {
                const touchEndY = e.changedTouches[0].clientY;
                const deltaY = this.touchStartY - touchEndY;
                
                // Swipe down to spin
                if (deltaY > 50 && !this.isSpinning) {
                    this.spin();
                    this.showToast("📱 Swiped to spin!", 'info', 1500);
                }
            }
            this.isTouch = false;
        });

        // Touch events for bet controls
        this.addTouchControlListeners();
    }

    // Add touch listeners for control buttons
    addTouchControlListeners() {
        const controls = [
            { id: 'decreaseBet', action: () => this.changeBet(-1) },
            { id: 'increaseBet', action: () => this.changeBet(1) },
            { id: 'decreasePaylines', action: () => this.changePaylines(-1) },
            { id: 'increasePaylines', action: () => this.changePaylines(1) },
            { id: 'resetButton', action: () => this.resetCoins() },
            { id: 'fullscreenButton', action: () => this.toggleFullscreen() }
        ];

        controls.forEach(control => {
            const element = document.getElementById(control.id);
            if (element) {
                element.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    element.classList.add('active');
                });
                
                element.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    element.classList.remove('active');
                    control.action();
                });
                
                element.addEventListener('touchcancel', (e) => {
                    e.preventDefault();
                    element.classList.remove('active');
                });
            }
        });
    }

    // Prevent default touch behaviors
    preventDefaultTouchBehaviors() {
        // Prevent zoom on double tap
        document.addEventListener('touchstart', function(e) {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        });

        // Prevent zoom on double tap with timeout
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(e) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Prevent pull-to-refresh
        document.body.addEventListener('touchstart', e => {
            if (e.touches.length === 1 && window.pageYOffset === 0) {
                e.preventDefault();
            }
        });

        document.body.addEventListener('touchmove', e => {
            if (e.touches.length === 1 && window.pageYOffset === 0) {
                e.preventDefault();
            }
        });
    }

    // Handle touch start with haptic feedback
    handleTouchStart() {
        // Haptic feedback for supported devices
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    // Handle window resize and orientation changes
    handleResize() {
        this.isMobile = this.detectMobile();
        
        if (!this.isFullscreen) {
            this.adjustCanvasForMobile();
        } else {
            // Adjust fullscreen for mobile
            this.canvas.width = window.innerWidth - 20;
            this.canvas.height = window.innerHeight - 120;
            
            this.reelWidth = (this.canvas.width - (this.config.reels - 1) * this.config.spacing) / this.config.reels;
            this.rowHeight = (this.canvas.height - (this.config.rows - 1) * this.config.spacing) / this.config.rows;
        }
        
        this.draw();
        this.updateMobileUI();
    }

    // Update UI elements for mobile
    updateMobileUI() {
        const gameContainer = document.querySelector('.game-container');
        const controls = document.querySelector('.controls');
        
        if (this.isMobile) {
            if (gameContainer) gameContainer.classList.add('mobile');
            if (controls) controls.classList.add('mobile');
            
            // Adjust button sizes for mobile
            this.adjustButtonSizes();
        } else {
            if (gameContainer) gameContainer.classList.remove('mobile');
            if (controls) controls.classList.remove('mobile');
        }
    }

    // Adjust button sizes for mobile
    adjustButtonSizes() {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            if (this.isMobile) {
                button.style.minHeight = '44px';
                button.style.fontSize = '16px';
                button.style.padding = '12px 16px';
            }
        });
    }

    // Method to easily change grid size (for customization)
    reconfigure(reels, rows) {
        if (this.isSpinning) return;

        this.config.reels = reels;
        this.config.rows = rows;

        // Recalculate dimensions
        this.reelWidth = (this.canvas.width - (this.config.reels - 1) * this.config.spacing) / this.config.reels;
        this.rowHeight = (this.canvas.height - (this.config.rows - 1) * this.config.spacing) / this.config.rows;

        // Regenerate paylines
        this.paylines = this.generatePaylines();
        this.maxPaylines = this.paylines.length;
        this.currentPaylineCount = 1;

        // Reinitialize
        this.initializeReels();
        this.updateDisplay();
        this.draw();

        this.showMessage(`📐 Grid: ${reels}x${rows} (${this.maxPaylines} lines)`, 2000);
    }
}

// Global functions for HTML buttons
let slotMachine;

function spin() {
    slotMachine.spin();
}

function changeBet(delta) {
    slotMachine.changeBet(delta);
}

function changePaylines(delta) {
    slotMachine.changePaylines(delta);
}

function changeWinRate(value) {
    slotMachine.changeWinRate(value);
}

function changeWildRarity(value) {
    slotMachine.changeWildRarity(value);
}

function changeMinWinLength(value) {
    slotMachine.changeMinWinLength(value);
}

function resetCoins() {
    slotMachine.resetCoins();
}

function reconfigure(reels, rows) {
    slotMachine.reconfigure(reels, rows);
}

function toggleFullscreen() {
    slotMachine.toggleFullscreen();
}

function toggleImages() {
    slotMachine.useImages = !slotMachine.useImages;
    if (slotMachine.useImages) {
        slotMachine.loadImages();
    } else {
        slotMachine.draw();
    }

    const button = document.getElementById('imageToggleButton');
    if (button) {
        button.textContent = slotMachine.useImages ? 'Use Emojis' : 'Use Images';
    }
}

function addCoins(amount) {
    slotMachine.coinCount += amount;
    slotMachine.updateDisplay();
    slotMachine.showMessage(`+${amount} coins added!`, 2000);
}

function changeSpinSpeed(value) {
    slotMachine.changeSpinSpeed(value);
}

function toggleRandomizeReels() {
    slotMachine.toggleRandomizeReels();
}

window.addEventListener('load', () => {
    slotMachine = new SlotMachine();
    
    // Add mobile-specific styles
    if (slotMachine.isMobile) {
        document.body.classList.add('mobile-device');
        
        // Add viewport meta tag if not present
        if (!document.querySelector('meta[name="viewport"]')) {
            const viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            document.head.appendChild(viewport);
        }
    }
});