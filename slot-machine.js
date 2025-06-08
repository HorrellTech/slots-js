class SlotMachine {
    constructor() {
        this.canvas = document.getElementById('slotCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.balance = 100.00; // Changed from coinCount to balance in dollars
        this.betAmount = 0.02; // Bet amount in dollars
        this.minBet = 0.02; // Minimum bet in dollars
        this.maxBet = 5.00; // Maximum bet in dollars
        this.betIncrement = 0.02; // Bet increment in dollars
        this.isSpinning = false;
        this.winRate = 50; // Win rate percentage (0-100)
        this.minWinLength = 3; // Minimum symbols needed for a win (configurable)
        this.wildRarity = 0.05; // Wild symbol rarity (5% default)
        this.scatterRarity = 0.03; // Scatter symbol rarity (3% default)
        this.isFullscreen = false; // Fullscreen mode toggle

        // Audio properties
        this.sounds = {};
        this.bgMusicVolume = 0.3; // Default BG music volume (0 to 1)
        this.sfxVolume = 0.6;   // Default SFX volume (0 to 1)
        this.audioLoaded = false;
        this.hasInteracted = false; // For handling audio autoplay restrictions
        this.activeReelSpinSound = null; // To manage the looping reel spin sound
        this.scatterSoundCount = 0; // Track scatter sounds for pitch shifting

        // Mobile detection
        this.isMobile = this.detectMobile();

        // Canvas base dimensions for aspect ratio scaling in fullscreen
        this.baseCanvasWidth = 600;
        this.baseCanvasHeight = 400;

        // Approximate space for UI elements in fullscreen (top, bottom, left, right)
        this.fullscreenPadding = { top: 70, bottom: 80, left: 10, right: 10 };

        // Set initial canvas drawing buffer size
        this.canvas.width = this.baseCanvasWidth;
        this.canvas.height = this.baseCanvasHeight;

        // New reel mechanics variables
        this.spinSpeed = 16; // Base spin speed (adjustable)
        this.randomizeReelOnSpin = false; // Set to true for random reels each spin, false for physical slot behavior
        this.reelStripLength = 32; // Length of each reel strip

        // Enhanced reel animation variables
        this.reelAnimationState = []; // Track animation state for each reel
        this.reelTargetPositions = []; // Target positions for smooth stopping
        this.reelEasingFactors = []; // Easing factors for each reel

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
        this.freeSpinsCount = 0; // Remaining free spins
        this.totalFreeSpinsAwarded = 0; // Total spins awarded in current feature round (for display)
        this.currentFreeSpinNumber = 0; // Current spin number in the feature (for display)
        this.baseFreeSpins = 10; // Base number of free spins awarded
        this.scatterThreshold = 3; // Minimum scatters needed for free spins
        this.isInFreeSpins = false;
        this.freeSpinMultiplier = 1.25; // Can be increased for bonus rounds

        // Game themes configuration
        this.gameThemes = {
            'classic': {
                name: 'Classic Fruits',
                symbols: [
                    { id: 'cherry', name: '🍒', value: 5, probability: 0.3, color: '#ff6b6b' },
                    { id: 'lemon', name: '🍋', value: 10, probability: 0.25, color: '#ffd93d' },
                    { id: 'orange', name: '🍊', value: 15, probability: 0.2, color: '#ff8c42' },
                    { id: 'grapes', name: '🍇', value: 25, probability: 0.15, color: '#a8e6cf' },
                    { id: 'bell', name: '🔔', value: 50, probability: 0.07, color: '#88d8c0' },
                    { id: 'diamond', name: '💎', value: 100, probability: 0.02, color: '#b4a7d6' },
                    { id: 'star', name: '⭐', value: 200, probability: 0.01, color: '#ffd700' },
                    { id: 'wild', name: '🃏', value: 0, probability: this.wildRarity, color: '#ff1493', isWild: true },
                    { id: 'scatter', name: '🌟', value: 0, probability: this.scatterRarity, color: '#ffd700', isScatter: true }
                ]
            },
            'ocean': {
                name: 'Ocean Adventure',
                symbols: [
                    { id: 'fish', name: '🐠', value: 5, probability: 0.3, color: '#00bcd4' },
                    { id: 'octopus', name: '🐙', value: 10, probability: 0.25, color: '#9c27b0' },
                    { id: 'whale', name: '🐋', value: 15, probability: 0.2, color: '#2196f3' },
                    { id: 'shark', name: '🦈', value: 25, probability: 0.15, color: '#607d8b' },
                    { id: 'dolphin', name: '🐬', value: 50, probability: 0.07, color: '#03a9f4' },
                    { id: 'treasure', name: '💰', value: 100, probability: 0.02, color: '#ffc107' },
                    { id: 'pearl', name: '🔮', value: 200, probability: 0.01, color: '#e1bee7' },
                    { id: 'wild', name: '🌊', value: 0, probability: this.wildRarity, color: '#00acc1', isWild: true },
                    { id: 'scatter', name: '⚓', value: 0, probability: this.scatterRarity, color: '#795548', isScatter: true }
                ]
            },
            'space': {
                name: 'Space Explorer',
                symbols: [
                    { id: 'alien', name: '👽', value: 5, probability: 0.3, color: '#4caf50' },
                    { id: 'rocket', name: '🚀', value: 10, probability: 0.25, color: '#f44336' },
                    { id: 'planet', name: '🪐', value: 15, probability: 0.2, color: '#ff9800' },
                    { id: 'ufo', name: '🛸', value: 25, probability: 0.15, color: '#9c27b0' },
                    { id: 'astronaut', name: '👨‍🚀', value: 50, probability: 0.07, color: '#2196f3' },
                    { id: 'galaxy', name: '🌌', value: 100, probability: 0.02, color: '#673ab7' },
                    { id: 'star', name: '✨', value: 200, probability: 0.01, color: '#ffc107' },
                    { id: 'wild', name: '🌟', value: 0, probability: this.wildRarity, color: '#ffeb3b', isWild: true },
                    { id: 'scatter', name: '🌍', value: 0, probability: this.scatterRarity, color: '#4caf50', isScatter: true }
                ]
            },
            'animals': {
                name: 'Wild Animals',
                symbols: [
                    { id: 'monkey', name: '🐵', value: 5, probability: 0.3, color: '#8d6e63' },
                    { id: 'tiger', name: '🐅', value: 10, probability: 0.25, color: '#ff9800' },
                    { id: 'elephant', name: '🐘', value: 15, probability: 0.2, color: '#607d8b' },
                    { id: 'lion', name: '🦁', value: 25, probability: 0.15, color: '#ffc107' },
                    { id: 'panda', name: '🐼', value: 50, probability: 0.07, color: '#9e9e9e' },
                    { id: 'unicorn', name: '🦄', value: 100, probability: 0.02, color: '#e91e63' },
                    { id: 'dragon', name: '🐉', value: 200, probability: 0.01, color: '#f44336' },
                    { id: 'wild', name: '🦊', value: 0, probability: this.wildRarity, color: '#ff5722', isWild: true },
                    { id: 'scatter', name: '🌿', value: 0, probability: this.scatterRarity, color: '#4caf50', isScatter: true }
                ]
            },
            'food': {
                name: 'Delicious Treats',
                symbols: [
                    { id: 'pizza', name: '🍕', value: 5, probability: 0.3, color: '#ff6b35' },
                    { id: 'burger', name: '🍔', value: 10, probability: 0.25, color: '#8d6e63' },
                    { id: 'donut', name: '🍩', value: 15, probability: 0.2, color: '#ff69b4' },
                    { id: 'cake', name: '🎂', value: 25, probability: 0.15, color: '#ffc107' },
                    { id: 'icecream', name: '🍦', value: 50, probability: 0.07, color: '#81c784' },
                    { id: 'candy', name: '🍭', value: 100, probability: 0.02, color: '#e91e63' },
                    { id: 'cookie', name: '🍪', value: 200, probability: 0.01, color: '#8d6e63' },
                    { id: 'wild', name: '🍰', value: 0, probability: this.wildRarity, color: '#f06292', isWild: true },
                    { id: 'scatter', name: '🎉', value: 0, probability: this.scatterRarity, color: '#ff9800', isScatter: true }
                ]
            },
            'gems': {
                name: 'Precious Gems',
                symbols: [
                    { id: 'ruby', name: '❤️', value: 5, probability: 0.3, color: '#f44336' },
                    { id: 'emerald', name: '💚', value: 10, probability: 0.25, color: '#4caf50' },
                    { id: 'sapphire', name: '💙', value: 15, probability: 0.2, color: '#2196f3' },
                    { id: 'amethyst', name: '💜', value: 25, probability: 0.15, color: '#9c27b0' },
                    { id: 'topaz', name: '💛', value: 50, probability: 0.07, color: '#ffc107' },
                    { id: 'diamond', name: '💎', value: 100, probability: 0.02, color: '#e1f5fe' },
                    { id: 'crown', name: '👑', value: 200, probability: 0.01, color: '#ffd700' },
                    { id: 'wild', name: '✨', value: 0, probability: this.wildRarity, color: '#ffffff', isWild: true },
                    { id: 'scatter', name: '💍', value: 0, probability: this.scatterRarity, color: '#ff69b4', isScatter: true }
                ]
            },
            'cards': {
                name: 'Card Royale',
                symbols: [
                    { id: 'clubs', name: '♣️', value: 5, probability: 0.3, color: '#2c3e50' },
                    { id: 'diamonds', name: '♦️', value: 10, probability: 0.25, color: '#e74c3c' },
                    { id: 'hearts', name: '♥️', value: 15, probability: 0.2, color: '#e74c3c' },
                    { id: 'spades', name: '♠️', value: 25, probability: 0.15, color: '#2c3e50' },
                    { id: 'jack', name: '🎭', value: 50, probability: 0.07, color: '#9b59b6' },
                    { id: 'queen', name: '👸', value: 100, probability: 0.02, color: '#8e44ad' },
                    { id: 'king', name: '👑', value: 200, probability: 0.01, color: '#f1c40f' },
                    { id: 'wild', name: '🃏', value: 0, probability: this.wildRarity, color: '#3498db', isWild: true },
                    { id: 'scatter', name: '🎴', value: 0, probability: this.scatterRarity, color: '#e67e22', isScatter: true }
                ]
            },
            'chess': {
                name: 'Chess Masters',
                symbols: [
                    { id: 'pawn', name: '♟️', value: 5, probability: 0.3, color: '#7f8c8d' },
                    { id: 'knight', name: '♞', value: 10, probability: 0.25, color: '#95a5a6' },
                    { id: 'bishop', name: '♝', value: 15, probability: 0.2, color: '#bdc3c7' },
                    { id: 'rook', name: '♜', value: 25, probability: 0.15, color: '#34495e' },
                    { id: 'queen', name: '♛', value: 50, probability: 0.07, color: '#9b59b6' },
                    { id: 'king', name: '♚', value: 100, probability: 0.02, color: '#f1c40f' },
                    { id: 'checkmate', name: '⚔️', value: 200, probability: 0.01, color: '#c0392b' },
                    { id: 'wild', name: '🏆', value: 0, probability: this.wildRarity, color: '#d4af37', isWild: true },
                    { id: 'scatter', name: '♟︎', value: 0, probability: this.scatterRarity, color: '#2980b9', isScatter: true }
                ]
            },
            'monsters': {
                name: 'Monster Mayhem',
                symbols: [
                    { id: 'ghost', name: '👻', value: 5, probability: 0.3, color: '#ecf0f1' },
                    { id: 'alien', name: '👾', value: 10, probability: 0.25, color: '#9b59b6' },
                    { id: 'goblin', name: '👺', value: 15, probability: 0.2, color: '#e74c3c' },
                    { id: 'ogre', name: '👹', value: 25, probability: 0.15, color: '#c0392b' },
                    { id: 'zombie', name: '🧟', value: 50, probability: 0.07, color: '#27ae60' },
                    { id: 'vampire', name: '🧛', value: 100, probability: 0.02, color: '#8e44ad' },
                    { id: 'dragon', name: '🐲', value: 200, probability: 0.01, color: '#d35400' },
                    { id: 'wild', name: '🔮', value: 0, probability: this.wildRarity, color: '#9b59b6', isWild: true },
                    { id: 'scatter', name: '⚡', value: 0, probability: this.scatterRarity, color: '#f39c12', isScatter: true }
                ]
            },
            'wolves': {
                name: 'Wolf Pack',
                symbols: [
                    { id: 'paw', name: '🐾', value: 5, probability: 0.3, color: '#95a5a6' },
                    { id: 'moon', name: '🌙', value: 10, probability: 0.25, color: '#f1c40f' },
                    { id: 'forest', name: '🌲', value: 15, probability: 0.2, color: '#27ae60' },
                    { id: 'howl', name: '🐺', value: 25, probability: 0.15, color: '#7f8c8d' },
                    { id: 'alpha', name: '🐺‍⬛', value: 50, probability: 0.07, color: '#34495e' },
                    { id: 'hunter', name: '🏹', value: 100, probability: 0.02, color: '#c0392b' },
                    { id: 'fullmoon', name: '🌕', value: 200, probability: 0.01, color: '#f39c12' },
                    { id: 'wild', name: '🔥', value: 0, probability: this.wildRarity, color: '#e74c3c', isWild: true },
                    { id: 'scatter', name: '🌟', value: 0, probability: this.scatterRarity, color: '#f1c40f', isScatter: true }
                ]
            },
            'egypt': {
                name: 'Ancient Egypt',
                symbols: [
                    { id: 'ankh', name: '☥', value: 5, probability: 0.3, color: '#f39c12' },
                    { id: 'eye', name: '👁️', value: 10, probability: 0.25, color: '#3498db' },
                    { id: 'cat', name: '😺', value: 15, probability: 0.2, color: '#f1c40f' },
                    { id: 'scarab', name: '🪲', value: 25, probability: 0.15, color: '#27ae60' },
                    { id: 'mummy', name: '🧟', value: 50, probability: 0.07, color: '#ecf0f1' },
                    { id: 'sphinx', name: '🦁', value: 100, probability: 0.02, color: '#d35400' },
                    { id: 'pyramid', name: '🏯', value: 200, probability: 0.01, color: '#f39c12' },
                    { id: 'wild', name: '🧞', value: 0, probability: this.wildRarity, color: '#3498db', isWild: true },
                    { id: 'scatter', name: '📜', value: 0, probability: this.scatterRarity, color: '#7f8c8d', isScatter: true }
                ]
            },
            'music': {
                name: 'Music Beats',
                symbols: [
                    { id: 'note', name: '🎵', value: 5, probability: 0.3, color: '#3498db' },
                    { id: 'clef', name: '🎼', value: 10, probability: 0.25, color: '#9b59b6' },
                    { id: 'guitar', name: '🎸', value: 15, probability: 0.2, color: '#e74c3c' },
                    { id: 'piano', name: '🎹', value: 25, probability: 0.15, color: '#2c3e50' },
                    { id: 'microphone', name: '🎤', value: 50, probability: 0.07, color: '#d35400' },
                    { id: 'headphones', name: '🎧', value: 100, probability: 0.02, color: '#2980b9' },
                    { id: 'disc', name: '💿', value: 200, probability: 0.01, color: '#7f8c8d' },
                    { id: 'wild', name: '🔊', value: 0, probability: this.wildRarity, color: '#16a085', isWild: true },
                    { id: 'scatter', name: '🎵', value: 0, probability: this.scatterRarity, color: '#f39c12', isScatter: true }
                ]
            },
            'fantasy': {
                name: 'Fantasy Realm',
                symbols: [
                    { id: 'sword', name: '⚔️', value: 5, probability: 0.3, color: '#95a5a6' },
                    { id: 'shield', name: '🛡️', value: 10, probability: 0.25, color: '#7f8c8d' },
                    { id: 'bow', name: '🏹', value: 15, probability: 0.2, color: '#8e44ad' },
                    { id: 'potion', name: '⚗️', value: 25, probability: 0.15, color: '#16a085' },
                    { id: 'wizard', name: '🧙', value: 50, probability: 0.07, color: '#3498db' },
                    { id: 'princess', name: '👸', value: 100, probability: 0.02, color: '#f39c12' },
                    { id: 'unicorn', name: '🦄', value: 200, probability: 0.01, color: '#9b59b6' },
                    { id: 'wild', name: '✨', value: 0, probability: this.wildRarity, color: '#f1c40f', isWild: true },
                    { id: 'scatter', name: '🏰', value: 0, probability: this.scatterRarity, color: '#34495e', isScatter: true }
                ]
            },
            'astrology': {
                name: 'Astrology Signs',
                symbols: [
                    { id: 'aries', name: '♈', value: 5, probability: 0.3, color: '#ff5722' },
                    { id: 'taurus', name: '♉', value: 10, probability: 0.25, color: '#8bc34a' },
                    { id: 'gemini', name: '♊', value: 15, probability: 0.2, color: '#ffeb3b' },
                    { id: 'cancer', name: '♋', value: 25, probability: 0.15, color: '#03a9f4' },
                    { id: 'leo', name: '♌', value: 50, probability: 0.07, color: '#ff9800' },
                    { id: 'virgo', name: '♍', value: 100, probability: 0.02, color: '#9c27b0' },
                    { id: 'libra', name: '♎', value: 200, probability: 0.01, color: '#2196f3' },
                    { id: 'wild', name: '✨', value: 0, probability: this.wildRarity, color: '#e91e63', isWild: true },
                    { id: 'scatter', name: '🔮', value: 0, probability: this.scatterRarity, color: '#9c27b0', isScatter: true }
                ]
            },
            'weather': {
                name: 'Weather Forecast',
                symbols: [
                    { id: 'sunny', name: '☀️', value: 5, probability: 0.3, color: '#ffeb3b' },
                    { id: 'cloudy', name: '☁️', value: 10, probability: 0.25, color: '#b0bec5' },
                    { id: 'rain', name: '🌧️', value: 15, probability: 0.2, color: '#2196f3' },
                    { id: 'storm', name: '⚡', value: 25, probability: 0.15, color: '#ffc107' },
                    { id: 'snow', name: '❄️', value: 50, probability: 0.07, color: '#e1f5fe' },
                    { id: 'rainbow', name: '🌈', value: 100, probability: 0.02, color: '#9c27b0' },
                    { id: 'tornado', name: '🌪️', value: 200, probability: 0.01, color: '#607d8b' },
                    { id: 'wild', name: '🌞', value: 0, probability: this.wildRarity, color: '#ff9800', isWild: true },
                    { id: 'scatter', name: '🌍', value: 0, probability: this.scatterRarity, color: '#4caf50', isScatter: true }
                ]
            },
            'planets': {
                name: 'Solar System',
                symbols: [
                    { id: 'mercury', name: '☿', value: 5, probability: 0.3, color: '#9e9e9e' },
                    { id: 'venus', name: '♀', value: 10, probability: 0.25, color: '#ffeb3b' },
                    { id: 'earth', name: '🌍', value: 15, probability: 0.2, color: '#2196f3' },
                    { id: 'mars', name: '♂', value: 25, probability: 0.15, color: '#f44336' },
                    { id: 'jupiter', name: '♃', value: 50, probability: 0.07, color: '#ff9800' },
                    { id: 'saturn', name: '♄', value: 100, probability: 0.02, color: '#ffd54f' },
                    { id: 'uranus', name: '♅', value: 200, probability: 0.01, color: '#80deea' },
                    { id: 'wild', name: '☀️', value: 0, probability: this.wildRarity, color: '#ffeb3b', isWild: true },
                    { id: 'scatter', name: '⭐', value: 0, probability: this.scatterRarity, color: '#e1f5fe', isScatter: true }
                ]
            },
            'emoticons': {
                name: 'Emoji Faces',
                symbols: [
                    { id: 'smile', name: '😊', value: 5, probability: 0.3, color: '#ffeb3b' },
                    { id: 'laugh', name: '😂', value: 10, probability: 0.25, color: '#2196f3' },
                    { id: 'wink', name: '😉', value: 15, probability: 0.2, color: '#ff9800' },
                    { id: 'love', name: '😍', value: 25, probability: 0.15, color: '#f44336' },
                    { id: 'cool', name: '😎', value: 50, probability: 0.07, color: '#009688' },
                    { id: 'surprised', name: '😮', value: 100, probability: 0.02, color: '#9c27b0' },
                    { id: 'crazy', name: '🤪', value: 200, probability: 0.01, color: '#673ab7' },
                    { id: 'wild', name: '🥳', value: 0, probability: this.wildRarity, color: '#e91e63', isWild: true },
                    { id: 'scatter', name: '🎭', value: 0, probability: this.scatterRarity, color: '#3f51b5', isScatter: true }
                ]
            },
            'sports': {
                name: 'Sports Arena',
                symbols: [
                    { id: 'soccer', name: '⚽', value: 5, probability: 0.3, color: '#212121' },
                    { id: 'basketball', name: '🏀', value: 10, probability: 0.25, color: '#ff5722' },
                    { id: 'football', name: '🏈', value: 15, probability: 0.2, color: '#795548' },
                    { id: 'tennis', name: '🎾', value: 25, probability: 0.15, color: '#cddc39' },
                    { id: 'baseball', name: '⚾', value: 50, probability: 0.07, color: '#607d8b' },
                    { id: 'bowling', name: '🎳', value: 100, probability: 0.02, color: '#f44336' },
                    { id: 'trophy', name: '🏆', value: 200, probability: 0.01, color: '#ffd700' },
                    { id: 'wild', name: '🏅', value: 0, probability: this.wildRarity, color: '#ffc107', isWild: true },
                    { id: 'scatter', name: '🎯', value: 0, probability: this.scatterRarity, color: '#4caf50', isScatter: true }
                ]
            },
            'tech': {
                name: 'Tech Gadgets',
                symbols: [
                    { id: 'phone', name: '📱', value: 5, probability: 0.3, color: '#9e9e9e' },
                    { id: 'laptop', name: '💻', value: 10, probability: 0.25, color: '#3f51b5' },
                    { id: 'camera', name: '📷', value: 15, probability: 0.2, color: '#212121' },
                    { id: 'game', name: '🎮', value: 25, probability: 0.15, color: '#009688' },
                    { id: 'tv', name: '📺', value: 50, probability: 0.07, color: '#607d8b' },
                    { id: 'watch', name: '⌚', value: 100, probability: 0.02, color: '#795548' },
                    { id: 'robot', name: '🤖', value: 200, probability: 0.01, color: '#9c27b0' },
                    { id: 'wild', name: '⚡', value: 0, probability: this.wildRarity, color: '#ff9800', isWild: true },
                    { id: 'scatter', name: '🔌', value: 0, probability: this.scatterRarity, color: '#4caf50', isScatter: true }
                ]
            },
            'camping': {
                name: 'Wilderness Camp',
                symbols: [
                    { id: 'tent', name: '⛺', value: 5, probability: 0.3, color: '#ff9800' },
                    { id: 'tree', name: '🌲', value: 10, probability: 0.25, color: '#4caf50' },
                    { id: 'mountain', name: '⛰️', value: 15, probability: 0.2, color: '#795548' },
                    { id: 'fire', name: '🔥', value: 25, probability: 0.15, color: '#f44336' },
                    { id: 'fish', name: '🐟', value: 50, probability: 0.07, color: '#03a9f4' },
                    { id: 'compass', name: '🧭', value: 100, probability: 0.02, color: '#795548' },
                    { id: 'backpack', name: '🎒', value: 200, probability: 0.01, color: '#f44336' },
                    { id: 'wild', name: '🏕️', value: 0, probability: this.wildRarity, color: '#8d6e63', isWild: true },
                    { id: 'scatter', name: '🌟', value: 0, probability: this.scatterRarity, color: '#ffeb3b', isScatter: true }
                ]
            }
        };

        this.currentTheme = 'classic';
        this.symbols = this.gameThemes[this.currentTheme].symbols;

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

        this.loadAudio(); // Load audio files
        this.initializeReels();
        this.loadImages(); // Load symbol images if using image mode
        this.updateDisplay();
        this.draw();

        // Initialize mobile support
        this.initializeMobileSupport();
    }

    initializeReels() {
        // Initialize reel animation states FIRST
        this.reelPositions = [];
        this.reelSpeeds = [];
        this.reelOffsets = [];
        this.spinStartTimes = [];

        for (let i = 0; i < this.config.reels; i++) {
            this.reelPositions[i] = Math.floor(Math.random() * this.reelStripLength);
            this.reelSpeeds[i] = 0;
            this.reelOffsets[i] = 0;
            this.spinStartTimes[i] = 0;
        }

        // Initialize enhanced animation states
        this.reelAnimationState = [];
        this.reelTargetPositions = [];
        this.reelEasingFactors = [];

        for (let i = 0; i < this.config.reels; i++) {
            this.reelPositions[i] = Math.floor(Math.random() * this.reelStripLength);
            this.reelSpeeds[i] = 0;
            this.reelOffsets[i] = 0;
            this.spinStartTimes[i] = 0;

            // Enhanced animation states
            this.reelAnimationState[i] = 'stopped'; // 'spinning', 'easing', 'settling', 'stopped'
            this.reelTargetPositions[i] = this.reelPositions[i];
            this.reelEasingFactors[i] = 1.0;
        }

        // Generate pre-determined reel strips (like physical slot machines)
        this.generateReelStrips();

        // Initialize grid from current reel positions
        this.updateGridFromReels();
    }

    generateReelStrips() {
        // Normalize probabilities first
        this.normalizeSymbolProbabilities();

        this.reelStrips = [];

        // Make reel strips longer for more realistic spinning
        const extendedStripLength = Math.max(this.reelStripLength, 32); // At least 32 symbols per strip

        for (let reelIndex = 0; reelIndex < this.config.reels; reelIndex++) {
            const strip = [];

            if (this.randomizeReelOnSpin) {
                // Generate basic random strip (will be regenerated each spin)
                for (let i = 0; i < extendedStripLength; i++) {
                    strip.push(this.getBasicRandomSymbol());
                }
            } else {
                // Generate strip - first reel is always random, others can be influenced by win rate
                for (let i = 0; i < extendedStripLength; i++) {
                    if (reelIndex === 0) {
                        // First reel is always random
                        strip.push(this.getBasicRandomSymbol());
                    } else {
                        // Subsequent reels can be influenced by win rate for horizontal matching
                        strip.push(this.getSymbolWithHorizontalInfluence(reelIndex, i));
                    }
                }
            }

            this.reelStrips[reelIndex] = strip;
        }

        // Update the actual strip length to the extended length
        this.reelStripLength = extendedStripLength;
    }

    normalizeSymbolProbabilities() {
        // Update wild and scatter probabilities from their rarity settings
        const wildSymbol = this.symbols.find(s => s.isWild);
        const scatterSymbol = this.symbols.find(s => s.isScatter);

        if (wildSymbol) wildSymbol.probability = this.wildRarity;
        if (scatterSymbol) scatterSymbol.probability = this.scatterRarity;

        let totalProbability = this.symbols.reduce((sum, symbol) => sum + (symbol.probability || 0), 0); // Ensure probability is a number

        if (totalProbability <= 0) {
            console.warn("Total symbol probability is zero or negative. Attempting to re-distribute probabilities.");
            let targetSymbolsForEqualProb = this.symbols.filter(s => s && !s.isWild && !s.isScatter && s.value > 0);
            if (targetSymbolsForEqualProb.length === 0) {
                targetSymbolsForEqualProb = this.symbols.filter(s => s && !s.isWild && !s.isScatter);
            }
            if (targetSymbolsForEqualProb.length === 0) {
                targetSymbolsForEqualProb = this.symbols.filter(s => s && s.value > 0);
            }
            if (targetSymbolsForEqualProb.length === 0 && this.symbols.length > 0) {
                targetSymbolsForEqualProb = this.symbols.filter(s => s); // Filter out any null/undefined symbols
            }

            if (targetSymbolsForEqualProb.length > 0) {
                const equalProb = 1.0 / targetSymbolsForEqualProb.length;
                this.symbols.forEach(s => {
                    if (s && targetSymbolsForEqualProb.includes(s)) {
                        s.probability = equalProb;
                    } else if (s) {
                        s.probability = 0;
                    }
                });
                totalProbability = targetSymbolsForEqualProb.length > 0 ? 1.0 : 0; // Should be 1.0 if targetSymbolsForEqualProb found
            } else if (this.symbols.length > 0) {
                console.error("Could not assign probabilities. All symbols might be invalid or list empty after filtering.");
                // Last resort: if this.symbols has entries but all were filtered out (e.g. all null)
                // This path indicates a deeper issue with this.symbols content.
                // For now, to prevent NaN, if this.symbols has length, distribute.
                const validSymbols = this.symbols.filter(s => s);
                if (validSymbols.length > 0) {
                    validSymbols.forEach(s => s.probability = 1.0 / validSymbols.length);
                    totalProbability = 1.0;
                } else {
                    totalProbability = 0; // No valid symbols
                }
            } else {
                console.error("No symbols to normalize probabilities for.");
                return;
            }
        }

        if (totalProbability > 0 && totalProbability !== 1.0) {
            this.symbols.forEach(symbol => {
                if (symbol) { // Ensure symbol exists
                    symbol.probability = (symbol.probability || 0) / totalProbability;
                }
            });
        } else if (totalProbability === 0 && this.symbols.length > 0) {
            // This case should ideally be caught by the redistribution logic above.
            // If it's reached, it means redistribution failed to establish a positive totalProbability.
            console.error("Normalization failed: total probability is still zero after attempting redistribution.");
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
                    return { ...prevSymbol }; // Return a copy
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
                // Ensure reelPositions[reel] is a valid number and integer
                if (typeof this.reelPositions[reel] !== 'number' || isNaN(this.reelPositions[reel])) {
                    console.warn(`Invalid reel position for reel ${reel}, resetting to 0`);
                    this.reelPositions[reel] = 0;
                }

                // Ensure position is an integer for consistent indexing
                this.reelPositions[reel] = Math.floor(this.reelPositions[reel]);

                // Calculate strip position with proper bounds checking
                // This MUST match exactly what drawReel uses for stopped reels
                const stripPosition = (Math.floor(this.reelPositions[reel]) + row) % this.reelStripLength;

                // Ensure stripPosition is a valid integer
                const safeStripPosition = Math.max(0, Math.floor(stripPosition));

                // Get symbol with bounds checking
                let symbol = null;
                if (this.reelStrips[reel] && this.reelStrips[reel][safeStripPosition]) {
                    symbol = this.reelStrips[reel][safeStripPosition];
                }

                // Safety check to ensure symbol exists
                if (!symbol || !symbol.id) {
                    console.warn(`Missing symbol at reel ${reel}, position ${safeStripPosition}, generating new symbol for grid display`);
                    symbol = this.getBasicRandomSymbol();

                    // Store the new symbol in the strip to maintain consistency
                    if (this.reelStrips[reel]) {
                        this.reelStrips[reel][safeStripPosition] = symbol;
                    }
                }

                // Ensure we have a valid symbol before assigning
                this.grid[row][reel] = symbol;
            }
        }

        // Only log grid occasionally for debugging (comment out for production)
        // if (Math.random() < 0.1) { // Only log 10% of the time
        //     console.log('Grid updated from reels:');
        //     for (let row = 0; row < this.config.rows; row++) {
        //         const rowSymbols = [];
        //         for (let reel = 0; reel < this.config.reels; reel++) {
        //             const symbol = this.grid[row][reel];
        //             rowSymbols.push(symbol.name || symbol.id || 'undefined');
        //         }
        //         console.log(`Row ${row}:`, rowSymbols);
        //     }
        // }
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

    loadAudio() {
        const soundFiles = {
            bgMusic: 'audio/slotsBG.mp3',
            spinStart: 'audio/slotPull.mp3',
            reelSpin: 'audio/reelSpin.mp3',
            reelStop: 'audio/reelStop.mp3',
            winSmall: 'audio/winSmall.wav',
            winBig: 'audio/slotWin.mp3',
            coin: 'audio/coinHandling.wav',
            slotFeature: 'audio/slotFeature.mp3',
            scatterHit: 'audio/scatterHit.mp3'
        };

        let soundsToLoad = Object.keys(soundFiles).length;
        let soundsLoadedCount = 0;

        for (const key in soundFiles) {
            const audio = new Audio(soundFiles[key]);
            audio.oncanplaythrough = () => {
                soundsLoadedCount++;
                if (soundsLoadedCount === soundsToLoad) {
                    this.audioLoaded = true;
                    console.log("All audio files loaded.");
                    if (this.hasInteracted) { // If user interacted before sounds loaded
                        this.playBgMusic();
                    }
                }
            };
            audio.onerror = () => {
                console.warn(`Failed to load audio: ${soundFiles[key]}`);
                soundsLoadedCount++; // Count as "loaded" to not block indefinitely
                if (soundsLoadedCount === soundsToLoad) {
                    this.audioLoaded = true; // Still mark as loaded to allow game to proceed
                    console.warn("Some audio files failed to load, but proceeding.");
                }
            };
            this.sounds[key] = audio;
        }

        if (this.sounds.bgMusic) {
            this.sounds.bgMusic.loop = true;
            this.sounds.bgMusic.volume = this.bgMusicVolume;
        }
        if (this.sounds.reelSpin) {
            this.sounds.reelSpin.loop = true;
        }
    }

    // Toggle fullscreen mode
    toggleFullscreen() {
        this.handleFirstInteraction();
        this.isFullscreen = !this.isFullscreen;

        const gameContainer = document.querySelector('.game-container');

        if (this.isFullscreen) {
            document.body.classList.add('fullscreen-mode');
            if (gameContainer) gameContainer.classList.add('fullscreen-active');

            // Set canvas drawing buffer to base size
            this.canvas.width = this.baseCanvasWidth;
            this.canvas.height = this.baseCanvasHeight;
            this.resizeCanvasForFullscreen(); // This will now set style width/height

            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.warn(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                    // Fallback to CSS-only fullscreen if API fails
                    this.resizeCanvasForFullscreen(); // Ensure styles are applied
                });
            } else if (document.documentElement.mozRequestFullScreen) { /* Firefox */
                document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
                document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) { /* IE/Edge */
                document.documentElement.msRequestFullscreen();
            } else {
                this.resizeCanvasForFullscreen(); // Fallback for browsers that don't support Fullscreen API
            }
            document.addEventListener('fullscreenchange', this.handleFullscreenChange);
            document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange);
            document.addEventListener('mozfullscreenchange', this.handleFullscreenChange);
            document.addEventListener('MSFullscreenChange', this.handleFullscreenChange);

        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(err => {
                    console.warn(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`);
                });
            } else if (document.mozCancelFullScreen) { /* Firefox */
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { /* IE/Edge */
                document.msExitFullscreen();
            }
            // Ensure CSS classes and styles are removed/reset even if API exit fails or isn't used
            document.body.classList.remove('fullscreen-mode');
            if (gameContainer) gameContainer.classList.remove('fullscreen-active');

            this.canvas.style.width = ''; // Reset style
            this.canvas.style.height = ''; // Reset style

            if (this.isMobile) {
                this.adjustCanvasForMobile(); // This sets canvas.width/height
            } else {
                this.canvas.width = this.baseCanvasWidth;
                this.canvas.height = this.baseCanvasHeight;
            }

            document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', this.handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', this.handleFullscreenChange);

            this.recalculateReelDimensions();
            this.draw();
        }
        this.updateFullscreenButton();
        this.updateMobileUI();
    }

    resizeCanvasForFullscreen() {
        // Keep the actual drawing buffer at base resolution for performance
        this.canvas.width = this.baseCanvasWidth;
        this.canvas.height = this.baseCanvasHeight;

        let availableWidth = window.innerWidth - this.fullscreenPadding.left - this.fullscreenPadding.right;
        let availableHeight = window.innerHeight - this.fullscreenPadding.top - this.fullscreenPadding.bottom;

        if (this.isMobile && window.innerWidth > window.innerHeight) {
            availableHeight = window.innerHeight - this.fullscreenPadding.top - (this.fullscreenPadding.bottom * 0.8);
        }

        const aspectRatio = this.baseCanvasWidth / this.baseCanvasHeight;

        let scaledWidth = availableWidth;
        let scaledHeight = scaledWidth / aspectRatio;

        if (scaledHeight > availableHeight) {
            scaledHeight = availableHeight;
            scaledWidth = scaledHeight * aspectRatio;
        }

        // Scale the canvas element using CSS
        this.canvas.style.width = Math.max(50, scaledWidth) + 'px';
        this.canvas.style.height = Math.max(50, scaledHeight) + 'px';

        this.recalculateReelDimensions(); // Dimensions are based on canvas.width/height (base resolution)
        this.draw();
    }

    recalculateReelDimensions() {
        // These calculations should use the canvas's actual drawing buffer dimensions
        this.reelWidth = (this.canvas.width - (this.config.reels - 1) * this.config.spacing) / this.config.reels;
        this.rowHeight = (this.canvas.height - (this.config.rows - 1) * this.config.spacing) / this.config.rows;
    }

    handleFullscreenChange = () => {
        const isBrowserFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);

        if (isBrowserFullscreen) {
            this.isFullscreen = true;
            document.body.classList.add('fullscreen-mode');
            // Set canvas drawing buffer to base size
            this.canvas.width = this.baseCanvasWidth;
            this.canvas.height = this.baseCanvasHeight;
            this.resizeCanvasForFullscreen(); // Applies CSS scaling
        } else {
            // Exited browser fullscreen
            this.isFullscreen = false;
            document.body.classList.remove('fullscreen-mode');

            this.canvas.style.width = ''; // Reset style
            this.canvas.style.height = ''; // Reset style

            if (this.isMobile) {
                this.adjustCanvasForMobile(); // Sets canvas.width/height
            } else {
                this.canvas.width = this.baseCanvasWidth;
                this.canvas.height = this.baseCanvasHeight;
            }
            this.recalculateReelDimensions();
            this.draw();
        }
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
                const row = Math.max(0, (rows - 1) - (i - (midReel + 1)) - 1); // Adjusted for 0-indexed rows
                vLine.push({ reel: i, row: Math.min(rows - 1, Math.max(0, row)) });
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
                const row = Math.max(0, (rows - 1) - i);
                invVLine.push({ reel: i, row: row });
            }
            for (let i = midReel + 1; i < reels; i++) {
                const row = Math.min(rows - 1, (i - (midReel + 1)) + 1); // Adjusted for 0-indexed rows
                invVLine.push({ reel: i, row: Math.min(rows - 1, Math.max(0, row)) });
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
            const zigzagPattern = [0, rows - 1, 0, rows - 1, 0]; // Top, Bottom, Top, Bottom, Top
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
            const revZigzagPattern = [rows - 1, 0, rows - 1, 0, rows - 1]; // Bottom, Top, Bottom, Top, Bottom
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
            const midRow = Math.floor(rows / 2); // For patterns using the middle row

            // M-shaped pattern (down-up-down-up)
            const mShape = [
                { reel: 0, row: 0 },
                { reel: 1, row: rows - 1 },
                { reel: 2, row: 0 },
                { reel: 3, row: rows - 1 },
                { reel: 4, row: 0 }
            ].filter(p => p.row < rows); // Ensure row is valid
            if (mShape.length >= Math.min(3, reels)) {
                lines.push({
                    id: 'm_shape',
                    name: 'M-Shape',
                    positions: mShape.slice(0, reels),
                    type: 'm-shape',
                    color: this.getPaylineColor(lines.length)
                });
            }

            // W-shaped pattern (up-down-up-down)
            const wShape = [
                { reel: 0, row: rows - 1 },
                { reel: 1, row: 0 },
                { reel: 2, row: rows - 1 },
                { reel: 3, row: 0 },
                { reel: 4, row: rows - 1 }
            ].filter(p => p.row < rows);
            if (wShape.length >= Math.min(3, reels)) {
                lines.push({
                    id: 'w_shape',
                    name: 'W-Shape',
                    positions: wShape.slice(0, reels),
                    type: 'w-shape',
                    color: this.getPaylineColor(lines.length)
                });
            }

            // Arrow patterns
            const arrowUp = [
                { reel: 0, row: rows - 1 },
                { reel: 1, row: midRow },
                { reel: 2, row: 0 },
                { reel: 3, row: midRow },
                { reel: 4, row: rows - 1 }
            ].filter(p => p.row < rows);
            if (arrowUp.length >= Math.min(3, reels)) {
                lines.push({
                    id: 'arrow_up',
                    name: 'Arrow ↑',
                    positions: arrowUp.slice(0, reels),
                    type: 'arrow-up',
                    color: this.getPaylineColor(lines.length)
                });
            }

            const arrowDown = [
                { reel: 0, row: 0 },
                { reel: 1, row: midRow },
                { reel: 2, row: rows - 1 },
                { reel: 3, row: midRow },
                { reel: 4, row: 0 }
            ].filter(p => p.row < rows);
            if (arrowDown.length >= Math.min(3, reels)) {
                lines.push({
                    id: 'arrow_down',
                    name: 'Arrow ↓',
                    positions: arrowDown.slice(0, reels),
                    type: 'arrow-down',
                    color: this.getPaylineColor(lines.length)
                });
            }
        }

        if (rows >= 3 && reels >= 5) {
            // M-shaped pattern with middle on second row (for a 5x3 grid: bottom-top-middle-top-bottom)
            const mShapeMidRow = [
                { reel: 0, row: rows - 1 }, // Bottom row
                { reel: 1, row: 0 },        // Top row
                { reel: 2, row: 1 },        // Middle row (second row, not midRow)
                { reel: 3, row: 0 },        // Top row
                { reel: 4, row: rows - 1 }  // Bottom row
            ].filter(p => p.row < rows);    // Ensure row is valid

            if (mShapeMidRow.length >= Math.min(3, reels)) {
                lines.push({
                    id: 'm_shape_mid',
                    name: 'M-Shape Mid',
                    positions: mShapeMidRow.slice(0, reels),
                    type: 'm-shape-mid',
                    color: this.getPaylineColor(lines.length)
                });
            }
        }

        if (rows >= 2 && reels >= 3) {
            // Simple zigzag between row 0 and row 1
            const squareWave = [];
            for (let i = 0; i < reels; i++) {
                squareWave.push({ reel: i, row: i % 2 });
            }

            if (squareWave.length >= Math.min(3, reels)) {
                lines.push({
                    id: 'square_wave',
                    name: 'Square Wave',
                    positions: squareWave,
                    type: 'square-wave',
                    color: this.getPaylineColor(lines.length)
                });
            }

            // Inverted square wave (starting with row 1)
            const invSquareWave = [];
            for (let i = 0; i < reels; i++) {
                invSquareWave.push({ reel: i, row: (i + 1) % 2 });
            }

            if (invSquareWave.length >= Math.min(3, reels)) {
                lines.push({
                    id: 'inv_square_wave',
                    name: 'Inv Square Wave',
                    positions: invSquareWave,
                    type: 'inv-square-wave',
                    color: this.getPaylineColor(lines.length)
                });
            }
        }

        // Step patterns for additional variety
        if (rows >= 3 && reels >= 5) {
            const midRow = Math.floor(rows / 2);
            // Step up pattern
            const stepUp = [
                { reel: 0, row: rows - 1 },
                { reel: 1, row: rows - 1 },
                { reel: 2, row: midRow },
                { reel: 3, row: 0 },
                { reel: 4, row: 0 }
            ].filter(p => p.row < rows);
            if (stepUp.length >= Math.min(3, reels)) {
                lines.push({
                    id: 'step_up',
                    name: 'Step Up',
                    positions: stepUp.slice(0, reels),
                    type: 'step-up',
                    color: this.getPaylineColor(lines.length)
                });
            }

            // Step down pattern
            const stepDown = [
                { reel: 0, row: 0 },
                { reel: 1, row: 0 },
                { reel: 2, row: midRow },
                { reel: 3, row: rows - 1 },
                { reel: 4, row: rows - 1 }
            ].filter(p => p.row < rows);
            if (stepDown.length >= Math.min(3, reels)) {
                lines.push({
                    id: 'step_down',
                    name: 'Step Down',
                    positions: stepDown.slice(0, reels),
                    type: 'step-down',
                    color: this.getPaylineColor(lines.length)
                });
            }
        }

        // Crown patterns
        if (rows >= 3 && reels >= 5) {
            const midRow = Math.floor(rows / 2);
            const crownUp = [
                { reel: 0, row: midRow },
                { reel: 1, row: 0 },
                { reel: 2, row: midRow },
                { reel: 3, row: 0 },
                { reel: 4, row: midRow }
            ].filter(p => p.row < rows);
            if (crownUp.length >= Math.min(3, reels)) {
                lines.push({
                    id: 'crown_up',
                    name: 'Crown ↑',
                    positions: crownUp.slice(0, reels),
                    type: 'crown-up',
                    color: this.getPaylineColor(lines.length)
                });
            }

            const crownDown = [
                { reel: 0, row: midRow },
                { reel: 1, row: rows - 1 },
                { reel: 2, row: midRow },
                { reel: 3, row: rows - 1 },
                { reel: 4, row: midRow }
            ].filter(p => p.row < rows);
            if (crownDown.length >= Math.min(3, reels)) {
                lines.push({
                    id: 'crown_down',
                    name: 'Crown ↓',
                    positions: crownDown.slice(0, reels),
                    type: 'crown-down',
                    color: this.getPaylineColor(lines.length)
                });
            }
        }

        // Wave patterns
        if (rows >= 3 && reels >= 5) {
            const midRow = Math.floor(rows / 2);
            const waveSmooth = [
                { reel: 0, row: midRow },
                { reel: 1, row: 0 },
                { reel: 2, row: midRow },
                { reel: 3, row: rows - 1 },
                { reel: 4, row: midRow }
            ].filter(p => p.row < rows);
            if (waveSmooth.length >= Math.min(3, reels)) {
                lines.push({
                    id: 'wave_smooth',
                    name: 'Wave ~',
                    positions: waveSmooth.slice(0, reels),
                    type: 'wave',
                    color: this.getPaylineColor(lines.length)
                });
            }

            const waveReverse = [
                { reel: 0, row: midRow },
                { reel: 1, row: rows - 1 },
                { reel: 2, row: midRow },
                { reel: 3, row: 0 },
                { reel: 4, row: midRow }
            ].filter(p => p.row < rows);
            if (waveReverse.length >= Math.min(3, reels)) {
                lines.push({
                    id: 'wave_reverse',
                    name: 'Wave Rev ~',
                    positions: waveReverse.slice(0, reels),
                    type: 'wave-reverse',
                    color: this.getPaylineColor(lines.length)
                });
            }
        }

        // L-shaped patterns
        if (rows >= 3 && reels >= 5) {
            const midRow = Math.floor(rows / 2);
            const lShapeLeft = [
                { reel: 0, row: 0 },
                { reel: 1, row: 0 },
                { reel: 2, row: 0 },
                { reel: 3, row: midRow },
                { reel: 4, row: rows - 1 }
            ].filter(p => p.row < rows);
            if (lShapeLeft.length >= Math.min(3, reels)) {
                lines.push({
                    id: 'l_left',
                    name: 'L-Left',
                    positions: lShapeLeft.slice(0, reels),
                    type: 'l-left',
                    color: this.getPaylineColor(lines.length)
                });
            }

            const lShapeRight = [
                { reel: 0, row: rows - 1 },
                { reel: 1, row: midRow }, // Adjusted from fixed '1' to midRow
                { reel: 2, row: rows - 1 },
                { reel: 3, row: rows - 1 },
                { reel: 4, row: rows - 1 }
            ].filter(p => p.row < rows);
            if (lShapeRight.length >= Math.min(3, reels)) {
                lines.push({
                    id: 'l_right',
                    name: 'L-Right',
                    positions: lShapeRight.slice(0, reels),
                    type: 'l-right',
                    color: this.getPaylineColor(lines.length)
                });
            }
        }

        // Add 4 new patterns to reach ~25 for 5x3 grid
        if (rows >= 3 && reels >= 5) {
            const midRow = Math.floor(rows / 2);

            const bridge = [
                { reel: 0, row: 0 },
                { reel: 1, row: 0 },
                { reel: 2, row: midRow },
                { reel: 3, row: rows - 1 },
                { reel: 4, row: rows - 1 }
            ].filter(p => p.row < rows);
            if (bridge.length >= Math.min(3, reels)) {
                lines.push({
                    id: 'bridge',
                    name: 'Bridge',
                    positions: bridge.slice(0, reels),
                    type: 'bridge',
                    color: this.getPaylineColor(lines.length)
                });
            }

            const invBridge = [
                { reel: 0, row: rows - 1 },
                { reel: 1, row: rows - 1 },
                { reel: 2, row: midRow },
                { reel: 3, row: 0 },
                { reel: 4, row: 0 }
            ].filter(p => p.row < rows);
            if (invBridge.length >= Math.min(3, reels)) {
                lines.push({
                    id: 'inv_bridge',
                    name: 'Inv-Bridge',
                    positions: invBridge.slice(0, reels),
                    type: 'inv-bridge',
                    color: this.getPaylineColor(lines.length)
                });
            }

            const peak = [
                { reel: 0, row: midRow },
                { reel: 1, row: 0 },
                { reel: 2, row: 0 },
                { reel: 3, row: 0 },
                { reel: 4, row: midRow }
            ].filter(p => p.row < rows);
            if (peak.length >= Math.min(3, reels)) {
                lines.push({
                    id: 'peak',
                    name: 'Peak',
                    positions: peak.slice(0, reels),
                    type: 'peak',
                    color: this.getPaylineColor(lines.length)
                });
            }

            const valley = [
                { reel: 0, row: midRow },
                { reel: 1, row: rows - 1 },
                { reel: 2, row: rows - 1 },
                { reel: 3, row: rows - 1 },
                { reel: 4, row: midRow }
            ].filter(p => p.row < rows);
            if (valley.length >= Math.min(3, reels)) {
                lines.push({
                    id: 'valley',
                    name: 'Valley',
                    positions: valley.slice(0, reels),
                    type: 'valley',
                    color: this.getPaylineColor(lines.length)
                });
            }
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

    playSound(soundName, isLooping = false, pitchShift = 0) {
        if (!this.audioLoaded || !this.sounds[soundName]) {
            if (!this.sounds[soundName]) console.warn(`Sound not found: ${soundName}`);
            return null;
        }
        // For non-background music, require interaction
        if (soundName !== 'bgMusic' && !this.hasInteracted) {
            return null;
        }

        // Create a new Audio instance for pitch-shifted sounds to avoid conflicts
        let audio;
        if (pitchShift !== 0) {
            audio = new Audio(this.sounds[soundName].src);
            // Apply pitch shift using playbackRate (each octave up doubles the rate)
            audio.playbackRate = Math.pow(2, pitchShift);
        } else {
            audio = this.sounds[soundName];
            audio.playbackRate = 1.0; // Reset pitch for normal sounds
        }

        audio.volume = (soundName === 'bgMusic') ? this.bgMusicVolume : this.sfxVolume;
        audio.currentTime = 0;

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // console.warn(`Error playing sound ${soundName}:`, error);
            });
        }
        return audio;
    }

    stopSound(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName].pause();
            this.sounds[soundName].currentTime = 0;
        }
        // Specifically handle the activeReelSpinSound instance
        if (soundName === 'reelSpin' && this.activeReelSpinSound) {
            this.activeReelSpinSound.pause();
            this.activeReelSpinSound.currentTime = 0;
            this.activeReelSpinSound = null;
        }
    }

    playBgMusic() {
        if (this.audioLoaded && this.sounds.bgMusic && this.hasInteracted) {
            this.sounds.bgMusic.volume = this.bgMusicVolume;
            const playPromise = this.sounds.bgMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // console.warn("BG music autoplay was prevented.", error);
                });
            }
        }
    }

    setBgMusicVolume(volume) {
        this.bgMusicVolume = parseFloat(volume);
        if (this.sounds.bgMusic) {
            this.sounds.bgMusic.volume = this.bgMusicVolume;
        }
        // Update UI if element exists
        const bgVolumeValueEl = document.getElementById('bgVolumeValue');
        if (bgVolumeValueEl) bgVolumeValueEl.textContent = Math.round(this.bgMusicVolume * 100);
    }

    setSfxVolume(volume) {
        this.sfxVolume = parseFloat(volume);
        // Update UI if element exists
        const sfxVolumeValueEl = document.getElementById('sfxVolumeValue');
        if (sfxVolumeValueEl) sfxVolumeValueEl.textContent = Math.round(this.sfxVolume * 100);
    }

    handleFirstInteraction() {
        if (!this.hasInteracted) {
            this.hasInteracted = true;
            if (this.audioLoaded) {
                this.playBgMusic();
            }
        }
    }

    drawReel(reelIndex) {
        const reelX = reelIndex * this.reelWidth;
        const state = this.reelAnimationState[reelIndex];

        // During any animation state, show appropriate symbols
        if (state !== 'stopped') {
            // Calculate how many symbols we need to fill the visible area plus buffer
            const totalVisibleSymbols = this.config.rows + 4;

            // Calculate the current offset position in the strip
            const currentOffset = this.reelOffsets[reelIndex];
            const symbolHeight = this.rowHeight;

            // Draw symbols in a continuous strip
            for (let i = -2; i < totalVisibleSymbols; i++) {
                let stripIndex;
                let symbolY;

                if (state === 'settling') {
                    // During settling, use a more stable calculation
                    const basePosition = Math.floor(this.reelPositions[reelIndex]);
                    stripIndex = (basePosition + i + this.reelStripLength) % this.reelStripLength;
                    symbolY = (i * symbolHeight) - currentOffset;
                } else {
                    // During spinning/easing, use current position
                    const direction = this.reelSpeeds[reelIndex] > 0 ? 1 : -1;
                    const basePosition = Math.floor(this.reelPositions[reelIndex]);

                    if (direction > 0) {
                        stripIndex = (basePosition + Math.floor(currentOffset / symbolHeight) + i + this.reelStripLength) % this.reelStripLength;
                        symbolY = (i * symbolHeight) - (currentOffset % symbolHeight);
                    } else {
                        stripIndex = (basePosition - Math.floor(currentOffset / symbolHeight) - i + this.reelStripLength * 2) % this.reelStripLength;
                        symbolY = (i * symbolHeight) + (currentOffset % symbolHeight);
                    }
                }

                // Ensure stripIndex is valid and positive
                stripIndex = Math.max(0, Math.floor(stripIndex));

                // Get symbol with bounds checking
                const symbol = this.reelStrips[reelIndex] && this.reelStrips[reelIndex][stripIndex]
                    ? this.reelStrips[reelIndex][stripIndex]
                    : this.getBasicRandomSymbol();

                // Add subtle blur effect during fast spinning (but not during settling or in fullscreen)
                const applyBlur = state === 'spinning' && this.reelEasingFactors[reelIndex] > 0.8 && !this.isFullscreen;
                if (applyBlur) {
                    this.ctx.save();
                    this.ctx.filter = `blur(${Math.min(1.5, (1 - this.reelEasingFactors[reelIndex]) * 6)}px)`;
                }

                if (symbolY > -symbolHeight && symbolY < this.canvas.height + symbolHeight && symbol) {
                    this.drawSymbol(symbol, reelX, symbolY, this.reelWidth, symbolHeight);
                }

                if (applyBlur) {
                    this.ctx.restore();
                }
            }
        } else {
            // When completely stopped, show the static symbols using EXACT same calculation as updateGridFromReels
            for (let row = 0; row < this.config.rows; row++) {
                // This calculation MUST match exactly what updateGridFromReels uses
                const stripPosition = (Math.floor(this.reelPositions[reelIndex]) + row) % this.reelStripLength;
                const safeStripPosition = Math.max(0, Math.floor(stripPosition));

                let symbol = null;
                if (this.reelStrips[reelIndex] && this.reelStrips[reelIndex][safeStripPosition]) {
                    symbol = this.reelStrips[reelIndex][safeStripPosition];
                }

                // Safety check to ensure symbol exists - use same fallback as updateGridFromReels
                if (!symbol || !symbol.id) {
                    console.warn(`Missing symbol at reel ${reelIndex}, position ${safeStripPosition}, generating new symbol for display`);
                    symbol = this.getBasicRandomSymbol();

                    // Store the new symbol in the strip to maintain consistency
                    if (this.reelStrips[reelIndex]) {
                        this.reelStrips[reelIndex][safeStripPosition] = symbol;
                    }
                }

                const y = row * this.rowHeight;

                if (symbol) {
                    this.drawSymbol(symbol, reelX, y, this.reelWidth, this.rowHeight);
                }
            }
        }
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

    changeSpinSpeed(value) {
        if (this.isSpinning) return;

        this.spinSpeed = parseInt(value);
        document.getElementById('spinSpeedValue').textContent = value;

        let speedDescription = "";
        let direction = "";

        if (value < 0) {
            direction = "Upward ";
            if (Math.abs(value) <= 10) speedDescription = "Slow";
            else if (Math.abs(value) <= 20) speedDescription = "Normal";
            else if (Math.abs(value) <= 30) speedDescription = "Fast";
            else speedDescription = "Very Fast";
        } else if (value > 0) {
            direction = "Downward ";
            if (value <= 10) speedDescription = "Slow";
            else if (value <= 20) speedDescription = "Normal";
            else if (value <= 30) speedDescription = "Fast";
            else speedDescription = "Very Fast";
        } else {
            direction = "";
            speedDescription = "Stopped";
        }

        this.showToast(`🎰 Spin: ${direction}${speedDescription} (${value})`, 'info', 2000);
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

    // Get basic random symbol using probabilities
    getBasicRandomSymbol() {
        const winRateNormalized = this.winRate / 100.0;
        let adjustedSymbolsData = [];

        // Calculate adjusted probabilities
        for (const symbol of this.symbols) {
            let adjustedProbability = symbol.probability;

            if (symbol.isWild) {
                let wildMultiplier;
                if (winRateNormalized <= 0.005) { // 0% WR
                    wildMultiplier = 0.001; // Drastically reduce wild chance
                } else if (winRateNormalized >= 0.995) { // 100% WR
                    wildMultiplier = 3.0;  // Significantly increase wild chance
                } else {
                    // Scaled between ~0.05 (low WR) and ~2.5 (high WR)
                    wildMultiplier = 0.05 + (winRateNormalized * 2.45);
                }
                adjustedProbability = this.wildRarity * wildMultiplier;
            } else if (symbol.isScatter) {
                let scatterMultiplier;
                if (winRateNormalized <= 0.005) { // 0% WR
                    scatterMultiplier = 0.001; // Drastically reduce scatter chance
                } else if (winRateNormalized >= 0.995) { // 100% WR
                    scatterMultiplier = 3.5;  // Significantly increase scatter chance
                } else {
                    // Scaled between ~0.05 (low WR) and ~3.0 (high WR)
                    scatterMultiplier = 0.05 + (winRateNormalized * 2.95);
                }
                adjustedProbability = this.scatterRarity * scatterMultiplier;
            } else {
                // For regular symbols, slightly adjust their probability inversely to win rate
                // to make more room for specials at high win rates, or make them more common at low.
                if (winRateNormalized > 0.7) {
                    adjustedProbability *= (1.0 - (winRateNormalized - 0.7) * 0.5); // Reduce up to 15% at 100% WR
                } else if (winRateNormalized < 0.3) {
                    adjustedProbability *= (1.0 + (0.3 - winRateNormalized) * 0.5); // Increase up to 15% at 0% WR
                }
            }
            adjustedSymbolsData.push({ id: symbol.id, probability: Math.max(0.00001, adjustedProbability) }); // Ensure non-zero positive probability
        }

        // Normalize adjusted probabilities
        let totalAdjustedProbability = adjustedSymbolsData.reduce((sum, s) => sum + s.probability, 0);

        if (totalAdjustedProbability <= 0) {
            // Fallback: if all probabilities are zero (e.g. wild/scatter rarity is 0 and winrate is 0)
            // then pick a non-special symbol randomly with equal chance.
            const nonSpecialSymbols = this.symbols.filter(s => !s.isWild && !s.isScatter);
            if (nonSpecialSymbols.length > 0) {
                return { ...nonSpecialSymbols[Math.floor(Math.random() * nonSpecialSymbols.length)] };
            }
            return { ...this.symbols[0] }; // Absolute fallback
        }

        const rand = Math.random();
        let cumulative = 0;
        for (const adjSymbol of adjustedSymbolsData) {
            const normalizedProbability = adjSymbol.probability / totalAdjustedProbability;
            cumulative += normalizedProbability;
            if (rand <= cumulative) {
                const originalSymbol = this.symbols.find(s => s.id === adjSymbol.id);
                return { ...originalSymbol };
            }
        }

        // Final fallback (should rarely be reached if logic above is sound)
        const lastSymbolData = adjustedSymbolsData[adjustedSymbolsData.length - 1];
        const fallbackSymbol = lastSymbolData ? this.symbols.find(s => s.id === lastSymbolData.id) : this.symbols[0];
        return { ...fallbackSymbol };
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
        this.handleFirstInteraction();

        // Reset scatter sound pitch counter when starting a new spin
        this.scatterSoundCount = 0;

        if (this.isInFreeSpins && this.freeSpinsCount > 0) {
            this.currentFreeSpinNumber++;
            // No balance check or deduction for free spins
            this.showToast(`🆓 Free Spin ${this.currentFreeSpinNumber} of ${this.totalFreeSpinsAwarded}`, 'info', 2200);
        } else {
            // Regular spin logic
            const totalBet = this.betAmount * this.currentPaylineCount;
            if (this.balance < totalBet) {
                this.showToast("💰 Not enough balance for this bet!", 'error', 3000);
                return;
            }
            this.balance -= totalBet;
            this.playSound('coin');
        }

        this.updateDisplay();
        this.isSpinning = true;
        this.activePaylines = [];

        document.getElementById('spinButton').disabled = true;
        // Toast for spinning is now conditional or handled by free spin toast
        if (!(this.isInFreeSpins && this.freeSpinsCount >= 0)) { // Check >=0 as it's about to be decremented
            this.showToast("🎰 Spinning reels...", 'info', 1500);
        }

        const currentTime = Date.now();

        if (!this.reelSettlingSpeeds) {
            this.reelSettlingSpeeds = [];
        }

        // Decrement freeSpinsCount here, after confirming it's a free spin and before reels start
        if (this.isInFreeSpins && this.freeSpinsCount >= 0) {
            this.freeSpinsCount--;
        }
        this.updateDisplay(); // Update display with new free spin count if applicable

        for (let i = 0; i < this.config.reels; i++) {
            this.reelAnimationState[i] = 'spinning';
            this.reelEasingFactors[i] = 1.0;
            this.reelSpeeds[i] = this.spinSpeed + Math.random() * 5;
            this.spinStartTimes[i] = currentTime;
            this.reelSettlingSpeeds[i] = 0.06;

            const easeStartDelay = 1500 + (i * 300) + Math.random() * 200;

            setTimeout(() => {
                this.startReelEasing(i);
            }, easeStartDelay);
        }

        if (this.activeReelSpinSound) { // Stop previous if any (shouldn't happen if logic is correct)
            this.stopSound('reelSpin');
        }
        this.activeReelSpinSound = this.playSound('reelSpin');


        this.animate();
    }

    stopReel(reelIndex) {
        /*this.reelSpeeds[reelIndex] = 0;
        this.reelOffsets[reelIndex] = 0;

        // Apply win rate logic AFTER reel stops - affect horizontal neighbors (next reel)
        if (reelIndex < this.config.reels - 1) { // Not the last reel
            this.applyWinRateToNextReel(reelIndex);
        }

        // Update grid only when reel stops (not during animation)
        this.updateGridFromReels();
        
        // Visual effect: snap to clean position
        this.draw();*/
    }

    startReelEasing(reelIndex) {
        if (this.reelAnimationState[reelIndex] === 'spinning') {
            this.reelAnimationState[reelIndex] = 'easing';
        }
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
        let allReelsActuallyStopped = true;
        let spinningReelsCount = 0;

        for (let i = 0; i < this.config.reels; i++) {
            const state = this.reelAnimationState[i];

            if (state === 'spinning') {
                spinningReelsCount++;
                this.reelOffsets[i] += Math.abs(this.reelSpeeds[i]);

                while (this.reelOffsets[i] >= this.rowHeight) {
                    this.reelOffsets[i] -= this.rowHeight;
                    const spinDirection = Math.sign(this.reelSpeeds[i]) || Math.sign(this.spinSpeed) || 1;
                    if (spinDirection > 0) {
                        this.reelPositions[i] = (this.reelPositions[i] + 1) % this.reelStripLength;
                    } else {
                        this.reelPositions[i] = (this.reelPositions[i] - 1 + this.reelStripLength) % this.reelStripLength;
                    }
                }
                allReelsActuallyStopped = false;

            } else if (state === 'easing') {
                this.reelEasingFactors[i] *= 0.97;

                const currentSymbolIndexAtTop_easing = this.reelPositions[i];
                let currentSubPixelOffset_easing = this.reelOffsets[i] % this.rowHeight;
                if (currentSubPixelOffset_easing < 0) currentSubPixelOffset_easing += this.rowHeight;

                if (this.reelEasingFactors[i] < 0.15) {
                    this.reelAnimationState[i] = 'settling';

                    // Check for scatter symbols on this reel before playing stop sound
                    this.checkAndPlayReelStopSound(i);

                    const originalSpinDirection = Math.sign(this.reelSpeeds[i]) || Math.sign(this.spinSpeed) || 1;

                    let visualContinuousPosition_endEase;
                    if (originalSpinDirection > 0) {
                        visualContinuousPosition_endEase = currentSymbolIndexAtTop_easing + (currentSubPixelOffset_easing / this.rowHeight);
                    } else {
                        visualContinuousPosition_endEase = currentSymbolIndexAtTop_easing - (currentSubPixelOffset_easing / this.rowHeight);
                    }
                    visualContinuousPosition_endEase = (visualContinuousPosition_endEase % this.reelStripLength + this.reelStripLength) % this.reelStripLength;

                    let targetSymbolIndex;
                    if (originalSpinDirection > 0) {
                        targetSymbolIndex = Math.ceil(visualContinuousPosition_endEase);
                    } else {
                        targetSymbolIndex = Math.floor(visualContinuousPosition_endEase);
                    }
                    targetSymbolIndex = (targetSymbolIndex % this.reelStripLength + this.reelStripLength) % this.reelStripLength;

                    this.reelTargetPositions[i] = targetSymbolIndex;

                    let initialSettlingOffset = (visualContinuousPosition_endEase - targetSymbolIndex) * this.rowHeight;

                    const halfStripPixels = (this.reelStripLength / 2) * this.rowHeight;
                    if (initialSettlingOffset > halfStripPixels) {
                        initialSettlingOffset -= this.reelStripLength * this.rowHeight;
                    } else if (initialSettlingOffset < -halfStripPixels) {
                        initialSettlingOffset += this.reelStripLength * this.rowHeight;
                    }

                    this.reelOffsets[i] = initialSettlingOffset;
                    this.reelPositions[i] = targetSymbolIndex;

                } else {
                    const easedSpeed = Math.abs(this.reelSpeeds[i]) * this.reelEasingFactors[i];
                    this.reelOffsets[i] += easedSpeed;

                    const spinDirection = Math.sign(this.reelSpeeds[i]) || Math.sign(this.spinSpeed) || 1;
                    while (this.reelOffsets[i] >= this.rowHeight) {
                        this.reelOffsets[i] -= this.rowHeight;
                        if (spinDirection > 0) {
                            this.reelPositions[i] = (this.reelPositions[i] + 1) % this.reelStripLength;
                        } else {
                            this.reelPositions[i] = (this.reelPositions[i] - 1 + this.reelStripLength) % this.reelStripLength;
                        }
                    }
                    while (this.reelOffsets[i] < 0) {
                        this.reelOffsets[i] += this.rowHeight;
                        if (spinDirection < 0) {
                            this.reelPositions[i] = (this.reelPositions[i] - 1 + this.reelStripLength) % this.reelStripLength;
                        } else {
                            this.reelPositions[i] = (this.reelPositions[i] + 1) % this.reelStripLength;
                        }
                    }
                }
                allReelsActuallyStopped = false;

            } else if (state === 'settling') {
                const settleSpeedFactor = this.reelSettlingSpeeds[i] || 0.06;
                const snapThreshold = 0.5;

                if (Math.abs(this.reelOffsets[i]) < snapThreshold) {
                    this.reelOffsets[i] = 0;
                    this.reelAnimationState[i] = 'stopped';
                    this.reelPositions[i] = Math.floor(this.reelTargetPositions[i]);
                } else {
                    this.reelOffsets[i] *= (1 - settleSpeedFactor);
                }
                if (this.reelAnimationState[i] !== 'stopped') {
                    allReelsActuallyStopped = false;
                }

            } else if (state === 'stopped') {
                // Reel is stopped
            }
        }

        if (spinningReelsCount === 0 && this.activeReelSpinSound) {
            this.stopSound('reelSpin');
        }

        this.draw();

        if (!allReelsActuallyStopped) {
            requestAnimationFrame(() => this.animate());
        } else {
            if (this.activeReelSpinSound) {
                this.stopSound('reelSpin');
            }
            this.updateGridFromReels();
            this.checkWin();
            this.isSpinning = false;

            const spinButton = document.getElementById('spinButton');

            if (this.isInFreeSpins) {
                if (this.freeSpinsCount > 0) {
                    if (spinButton) spinButton.disabled = true;
                    this.showToast(`Next free spin starting... (${this.freeSpinsCount} remaining)`, 'info', 2000);
                    setTimeout(() => {
                        if (this.isInFreeSpins && this.freeSpinsCount > 0) {
                            this.spin();
                        } else {
                            this.isInFreeSpins = false;
                            if (spinButton) spinButton.disabled = false;
                            this.updateDisplay();
                        }
                    }, 2500);
                } else {
                    this.isInFreeSpins = false;
                    this.showToast("🎉 Free Spins Finished! 🎉 Return to normal play.", 'win', 4000);
                    if (spinButton) spinButton.disabled = false;
                }
            } else {
                if (spinButton) spinButton.disabled = false;
            }
            this.updateDisplay();
        }
    }

    checkAndPlayReelStopSound(reelIndex) {
        // Check if any scatter symbols are visible on this reel
        let hasScatter = false;

        for (let row = 0; row < this.config.rows; row++) {
            const stripPosition = (Math.floor(this.reelPositions[reelIndex]) + row) % this.reelStripLength;
            const safeStripPosition = Math.max(0, Math.floor(stripPosition));

            if (this.reelStrips[reelIndex] && this.reelStrips[reelIndex][safeStripPosition]) {
                const symbol = this.reelStrips[reelIndex][safeStripPosition];
                if (symbol && symbol.isScatter) {
                    hasScatter = true;
                    // Play scatter hit sound with pitch shift based on count
                    this.playSound('scatterHit', false, this.scatterSoundCount);
                    this.scatterSoundCount++; // Increment for next scatter
                    break; // Only play one scatter sound per reel
                }
            }
        }

        // If no scatter found, play normal reel stop sound
        if (!hasScatter) {
            this.playSound('reelStop');
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
        // Use simpler animation during wins to prevent lag
        const isWinning = this.activePaylines.length > 0;
        const time = Date.now() / 1000;

        let pulse, gradient;

        if (isWinning) {
            // Simplified animation during wins to prevent lag
            pulse = 0.9; // Static pulse during wins

            // Static gradient during wins
            gradient = this.ctx.createRadialGradient(
                x + width / 2, y + height / 2, 0,
                x + width / 2, y + height / 2, width / 2
            );
            gradient.addColorStop(0, '#ff1493');
            gradient.addColorStop(0.5, '#9400d3');
            gradient.addColorStop(1, '#4b0082');
        } else {
            // Full animation when not winning
            pulse = Math.abs(Math.sin(time * 3)) * 0.3 + 0.7; // Pulse between 0.7 and 1.0

            // Animated rainbow gradient background
            gradient = this.ctx.createRadialGradient(
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
        }

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x + 3, y + 3, width - 6, height - 6);

        // Optimized glow effect
        this.ctx.shadowColor = symbol.color;
        this.ctx.shadowBlur = isWinning ? 15 : 20 * pulse;
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
        this.ctx.shadowBlur = isWinning ? 10 : 15 * pulse;

        // Scale the wild symbol slightly with the pulse (simplified during wins)
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
        // Use simpler animation during wins to prevent lag
        const isWinning = this.activePaylines.length > 0;
        const time = Date.now() / 1000;

        let sparkle, gradient;

        if (isWinning) {
            // Simplified animation during wins
            sparkle = 0.8; // Static sparkle during wins

            // Static golden gradient
            gradient = this.ctx.createRadialGradient(
                x + width / 2, y + height / 2, 0,
                x + width / 2, y + height / 2, width / 2
            );
            gradient.addColorStop(0, '#ffd700');
            gradient.addColorStop(0.5, '#ffa500');
            gradient.addColorStop(1, '#ff8c00');
        } else {
            // Full animation when not winning
            sparkle = Math.abs(Math.sin(time * 4)) * 0.5 + 0.5; // Sparkle between 0.5 and 1.0

            // Animated golden gradient background
            gradient = this.ctx.createRadialGradient(
                x + width / 2, y + height / 2, 0,
                x + width / 2, y + height / 2, width / 2
            );

            // Create shifting golden colors
            const hue1 = 45 + Math.sin(time * 2) * 15; // Golden yellow variations
            const hue2 = 60 + Math.sin(time * 2 + 1) * 15;

            gradient.addColorStop(0, `hsl(${hue1}, 90%, 70%)`);
            gradient.addColorStop(0.5, `hsl(${hue2}, 80%, 50%)`);
            gradient.addColorStop(1, `hsl(30, 70%, 30%)`);
        }

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x + 3, y + 3, width - 6, height - 6);

        // Optimized sparkling glow
        this.ctx.shadowColor = '#ffd700';
        this.ctx.shadowBlur = isWinning ? 20 : 25 * sparkle;
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
        this.ctx.shadowBlur = isWinning ? 15 : 20 * sparkle;

        // Scale the scatter symbol slightly with the sparkle (simplified during wins)
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

        // Simplified particle effect (skip during wins to prevent lag)
        if (!isWinning) {
            const numParticles = 2; // Reduced particle count
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

    checkWins() {
        const wins = [];

        this.paylines.slice(0, this.activePaylines).forEach((payline, paylineIndex) => {
            const symbols = payline.positions.map(pos => this.grid[pos.row][pos.reel]);

            // Check for winning combinations starting from the left
            let consecutiveCount = 1;
            let currentSymbol = symbols[0];

            // Skip if first symbol is scatter (scatters don't form payline wins)
            if (currentSymbol.isScatter) return;

            // Count consecutive matching symbols (including wilds)
            for (let i = 1; i < symbols.length; i++) {
                const nextSymbol = symbols[i];

                // Check if symbols match (accounting for wilds)
                if (this.symbolsMatch(currentSymbol, nextSymbol)) {
                    consecutiveCount++;

                    // If current symbol is wild but next isn't, update current symbol
                    if (currentSymbol.isWild && !nextSymbol.isWild && !nextSymbol.isScatter) {
                        currentSymbol = nextSymbol;
                    }
                } else {
                    break;
                }
            }

            // Check if we have a winning combination
            if (consecutiveCount >= this.minWinLength) {
                // Determine the actual symbol for payout (not wild)
                let payoutSymbol = currentSymbol;
                if (currentSymbol.isWild) {
                    // If all symbols are wild, use the wild symbol itself
                    payoutSymbol = symbols.find(s => !s.isWild && !s.isScatter) || currentSymbol;
                }

                const baseWin = this.calculateWin(payoutSymbol, consecutiveCount);

                wins.push({
                    payline: paylineIndex,
                    symbol: payoutSymbol,
                    count: consecutiveCount,
                    positions: payline.positions.slice(0, consecutiveCount),
                    payout: baseWin
                });
            }
        });

        return wins;
    }

    calculateWin(symbol, count) {
        if (!symbol || symbol.value <= 0 || count < this.minWinLength) {
            return 0;
        }

        let multiplier = 1;
        if (count === 4) multiplier = 3;
        else if (count === 5) multiplier = 5;
        else if (count >= 6) multiplier = 8;

        // Calculate win with minimum payout to prevent 0 wins
        const baseWin = symbol.value * multiplier * this.betAmount;

        // Ensure minimum win of 1 cent if there's a valid winning combination
        return Math.max(0.01, Math.round(baseWin * 100) / 100);
    }

    checkWin() {
        let totalWin = 0;
        let totalWildsUsed = 0;
        this.activePaylines = [];
        let newFreeSpinsAwardedThisCheck = 0;
        let scatterPayout = 0;

        const totalBetStaked = this.betAmount * this.currentPaylineCount;

        // Scatter symbol check
        const scatterCount = this.countScatterSymbols();

        if (scatterCount >= 2) {
            scatterPayout = scatterCount * totalBetStaked;
            if (this.isInFreeSpins && scatterPayout > 0) { // Apply multiplier to scatter payout in free spins
                scatterPayout = Math.round(scatterPayout * this.freeSpinMultiplier);
            }
            // totalWin += scatterPayout; // Add to totalWin later to handle sound logic better
        }

        if (scatterCount >= this.scatterThreshold) {
            newFreeSpinsAwardedThisCheck = this.baseFreeSpins;
            if (scatterCount > this.scatterThreshold) {
                const extraScatters = scatterCount - this.scatterThreshold;
                newFreeSpinsAwardedThisCheck += extraScatters * (this.baseFreeSpins / 2); // More scatters, more spins (e.g., 5 extra per scatter over threshold)
            }

            if (!this.isInFreeSpins) {
                this.currentFreeSpinNumber = 0;
                this.totalFreeSpinsAwarded = 0;
            }

            this.isInFreeSpins = true;
            this.freeSpinsCount += newFreeSpinsAwardedThisCheck;
            this.totalFreeSpinsAwarded += newFreeSpinsAwardedThisCheck;

            this.playSound('slotFeature');

            let scatterFeatureMessage = `🌟 <strong>SCATTER BONUS!</strong><br/>`;
            if (scatterPayout > 0) {
                scatterFeatureMessage += `${scatterCount} Scatters pay ${this.formatCurrency(scatterPayout)}!<br/>`;
            }
            if (this.totalFreeSpinsAwarded > newFreeSpinsAwardedThisCheck && this.isInFreeSpins && newFreeSpinsAwardedThisCheck > 0) {
                scatterFeatureMessage += `RE-TRIGGER! +${newFreeSpinsAwardedThisCheck} Free Spins!<br/>`;
            } else if (newFreeSpinsAwardedThisCheck > 0) {
                scatterFeatureMessage += `${newFreeSpinsAwardedThisCheck} Free Spins Awarded!<br/>`;
            }
            scatterFeatureMessage += `Total Free Spins: ${this.freeSpinsCount}`;
            this.showToast(scatterFeatureMessage, 'warning', 6000);
        } else if (scatterPayout > 0) { // Payout for 2 scatters (or more, if threshold is >2 and not met for FS)
            this.showToast(`🌟 ${scatterCount} Scatters pay ${this.formatCurrency(scatterPayout)}!`, 'win', 4000);
        }

        if (scatterPayout > 0) {
            totalWin += scatterPayout;
        }

        // Check payline wins
        if (this.currentPaylineCount > 0 || (this.isInFreeSpins && totalBetStaked > 0)) {
            // Check each active payline for wins
            for (let i = 0; i < this.currentPaylineCount && i < this.paylines.length; i++) {
                const payline = this.paylines[i];
                const result = this.checkPayline(payline);

                if (result.payout > 0) {
                    let payoutOnLine = result.payout;
                    if (this.isInFreeSpins) {
                        payoutOnLine = Math.round(payoutOnLine * this.freeSpinMultiplier);
                    }
                    totalWin += payoutOnLine;
                    totalWildsUsed += result.wildsUsed;
                    this.activePaylines.push(payline);
                }
            }
        }

        if (totalWin > 0) {
            this.balance += totalWin; // Balance was already reduced by bet, or not if free spin
            this.playSound('coin');

            const winThreshold = totalBetStaked * 10;
            let playedWinSound = false;

            if (newFreeSpinsAwardedThisCheck > 0) {
                // slotFeature sound is primary for free spin triggers
                playedWinSound = true;
            }

            const lineWinAmount = totalWin - scatterPayout; // Calculate win from lines specifically

            if (totalWin >= winThreshold && !playedWinSound) { // Big overall win
                this.playSound('winBig');
                playedWinSound = true;
            } else if (totalWin > 0 && !playedWinSound) { // Any other win
                this.playSound('winSmall');
                playedWinSound = true;
            }


            let message = `🎉 <strong>WIN!</strong><br/>+${this.formatCurrency(totalWin)}`;
            let details = [];
            if (this.activePaylines.length > 0) {
                details.push(`on ${this.activePaylines.length} line(s)`);
            }
            if (scatterPayout > 0 && lineWinAmount > 0) { // Both line wins and scatter pay
                details.push(`(incl. ${this.formatCurrency(scatterPayout)} from scatters)`);
            } else if (scatterPayout > 0 && lineWinAmount <= 0) { // Only scatter pay
                details.push(`(from ${scatterCount} scatters)`);
            }
            if (details.length > 0) {
                message += " " + details.join(" ");
            }
            message += `!`;

            if (totalWildsUsed > 0) {
                message += `<br/>🃏 ${totalWildsUsed} Wild${totalWildsUsed > 1 ? 's' : ''} helped!`;
            }
            if (this.isInFreeSpins && (lineWinAmount > 0 || scatterPayout > 0)) { // Check if the win happened during FS
                message += `<br/>💰 x${this.freeSpinMultiplier} Free Spin Multiplier!`;
            }
            if (totalWin >= 100 && totalBetStaked > 0 && totalWin / totalBetStaked >= 50) {
                message += '<br/>💎 MEGA WIN! 💎';
            } else if (totalWin >= 50 && totalBetStaked > 0 && totalWin / totalBetStaked >= 25) {
                message += '<br/>💰 BIG WIN! 💰';
            }

            this.showToast(message, 'win', 5000);
            this.animateWin();
        } else if (newFreeSpinsAwardedThisCheck === 0) { // No regular win AND no new free spins awarded in this check
            if (this.isInFreeSpins) { // If it was a free spin that resulted in no win
                // Toast for this is handled by the spin() method or the "next free spin" toast
            } else if (this.winRate < 20) {
                this.showToast("😞 Tough luck! Low win rate active.", 'error', 3000);
            } else if (this.winRate > 80) {
                this.showToast("🤔 Almost! High win rate - keep spinning!", 'warning', 3000);
            } else {
                const encouragingMessages = [
                    "🎲 Keep spinning!",
                    "🍀 Better luck next time!",
                    "⭐ Almost there!",
                    "🎰 Try again!",
                    "💪 Don't give up!",
                    "✨ Luck is on your side!",
                    "🎉 Spin to win!",
                    "💫 Every spin counts!",
                    "🌟 You're doing great!",
                    "🎯 Stay positive!",
                    "🚀 Spin for the stars!",
                    "🌈 Good things come to those who spin!",
                    "💖 Keep the reels rolling!",
                    "🎊 Spin your way to victory!",
                    "🌻 Every spin is a chance!"
                ];
                const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
                this.showToast(randomMessage, 'info', 2500);
            }
        }
    }

    // Add this helper method to count wilds in winning positions
    countWildsInPositions(positions) {
        let wildCount = 0;
        for (const pos of positions) {
            if (this.grid[pos.row] && this.grid[pos.row][pos.reel] && this.grid[pos.row][pos.reel].isWild) {
                wildCount++;
            }
        }
        return wildCount;
    }

    // Add the symbolsMatch helper method that checkWins() uses
    symbolsMatch(symbol1, symbol2) {
        // If either symbol is wild, they match (unless the other is scatter)
        if (symbol1.isWild || symbol2.isWild) {
            return !symbol1.isScatter && !symbol2.isScatter;
        }

        // If neither is wild, they must be the same symbol
        return symbol1.id === symbol2.id;
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

    // Format currency display
    formatCurrency(amount) {
        return `$${amount.toFixed(2)}`;
    }

    findBestMatchFromLeft(symbols) {
        let bestMatch = { count: 0, symbol: null, wildsUsed: 0 };

        // Filter out any undefined symbols first
        const validSymbols = symbols.filter(symbol => symbol && symbol.id);
        if (validSymbols.length === 0) {
            return bestMatch;
        }

        const firstSymbol = validSymbols[0];

        if (firstSymbol.isScatter) {
            // Scatters don't form payline wins
            return bestMatch;
        }

        if (firstSymbol.isWild) {
            // If first symbol is wild, find the first non-wild symbol to use as target
            let targetSymbol = null;
            for (let i = 1; i < validSymbols.length; i++) {
                if (validSymbols[i] && !validSymbols[i].isWild && !validSymbols[i].isScatter) {
                    targetSymbol = validSymbols[i];
                    break;
                }
            }

            // If no target symbol found, use highest value regular symbol
            if (!targetSymbol) {
                const highestValueRegularSymbols = this.symbols
                    .filter(s => s && !s.isWild && !s.isScatter && s.value > 0)
                    .sort((a, b) => b.value - a.value);

                if (highestValueRegularSymbols.length > 0) {
                    targetSymbol = highestValueRegularSymbols[0];
                } else {
                    return bestMatch;
                }
            }

            let count = 0;
            let wildsUsedOnThisLine = 0;

            // Count consecutive matches from the left
            for (let i = 0; i < validSymbols.length; i++) {
                const currentSymbol = validSymbols[i];
                if (currentSymbol.id === targetSymbol.id) {
                    count++;
                } else if (currentSymbol.isWild) {
                    count++;
                    wildsUsedOnThisLine++;
                } else {
                    // Break on first non-matching symbol
                    break;
                }
            }
            bestMatch = { count, symbol: targetSymbol, wildsUsed: wildsUsedOnThisLine };

        } else {
            // Regular symbol - count consecutive matches from left
            let count = 0;
            let wildsUsedOnThisLine = 0;
            const targetSymbol = firstSymbol;

            // Count consecutive matching symbols from the left
            for (let i = 0; i < validSymbols.length; i++) {
                const currentSymbol = validSymbols[i];
                if (currentSymbol.id === targetSymbol.id) {
                    count++;
                } else if (currentSymbol.isWild) {
                    count++;
                    wildsUsedOnThisLine++;
                } else {
                    // Break on first non-matching, non-wild symbol
                    break;
                }
            }
            bestMatch = { count, symbol: targetSymbol, wildsUsed: wildsUsedOnThisLine };
        }

        return bestMatch;
    }

    checkPayline(payline) {
        const symbols = [];

        if (!this.grid || this.grid.length === 0) {
            return { payout: 0, wildsUsed: 0 };
        }

        // Collect symbols from payline positions
        for (const pos of payline.positions) {
            if (pos.row >= 0 && pos.row < this.config.rows &&
                pos.reel >= 0 && pos.reel < this.config.reels &&
                this.grid[pos.row] && this.grid[pos.row][pos.reel]) {
                symbols.push(this.grid[pos.row][pos.reel]);
            } else {
                console.warn(`Invalid position in payline: reel ${pos.reel}, row ${pos.row}`);
                return { payout: 0, wildsUsed: 0 };
            }
        }

        if (symbols.length < this.minWinLength) return { payout: 0, wildsUsed: 0 };

        // Only log for debugging when needed (remove these console.logs in production)
        if (symbols.length >= 3) {
            // Check if first 3+ symbols could be a win before logging
            const firstSymbol = symbols[0];
            let potentialWin = false;

            if (!firstSymbol.isScatter) {
                let consecutiveCount = 1;
                for (let i = 1; i < Math.min(symbols.length, 5); i++) {
                    const nextSymbol = symbols[i];
                    if ((firstSymbol.isWild || nextSymbol.isWild || firstSymbol.id === nextSymbol.id) &&
                        !nextSymbol.isScatter) {
                        consecutiveCount++;
                    } else {
                        break;
                    }
                }
                if (consecutiveCount >= this.minWinLength) {
                    potentialWin = true;
                }
            }

            // Only log if there's a potential win to reduce console spam
            if (potentialWin) {
                console.log(`Checking payline ${payline.id}:`);
                console.log('Symbols:', symbols.map((s, i) => `[${payline.positions[i].reel},${payline.positions[i].row}]: ${s.name || s.id}`));
            }
        }

        const bestMatch = this.findBestMatchFromLeft(symbols);

        // Check if we have a valid win
        if (bestMatch.symbol && bestMatch.symbol.value > 0 && bestMatch.count >= this.minWinLength) {
            let multiplier = 1;
            if (bestMatch.count === 4) multiplier = 3;
            else if (bestMatch.count === 5) multiplier = 5;
            else if (bestMatch.count >= 6) multiplier = 8;

            if (bestMatch.wildsUsed > 0) {
                multiplier *= 1.5;
            }

            // Use the same improved calculation as calculateWin method
            const baseWin = bestMatch.symbol.value * multiplier * this.betAmount;

            // Ensure minimum win of 1 cent if there's a valid winning combination
            const payout = Math.max(0.01, Math.round(baseWin * 100) / 100);

            console.log(`WIN! Payline ${payline.id}: ${bestMatch.count}x ${bestMatch.symbol.name} = ${payout}`);

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
    }

    showMessage(text, duration = 3000) {
        // Use toast instead since 'message' element doesn't exist
        this.showToast(text, 'info', duration);
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
        document.getElementById('coinCount').textContent = this.formatCurrency(this.balance);
        document.getElementById('betAmount').textContent = this.formatCurrency(this.betAmount);
        document.getElementById('paylineCount').textContent = this.currentPaylineCount;
        document.getElementById('totalBet').textContent = this.formatCurrency(this.betAmount * this.currentPaylineCount);
        document.getElementById('maxPaylines').textContent = this.maxPaylines;
        document.getElementById('winRateValue').textContent = this.winRate;

        const freeSpinsDisplayEl = document.getElementById('freeSpinsDisplay');
        const spinButton = document.getElementById('spinButton');

        if (this.isInFreeSpins && this.totalFreeSpinsAwarded > 0) {
            freeSpinsDisplayEl.innerHTML = `Free Spin: ${this.currentFreeSpinNumber} / ${this.totalFreeSpinsAwarded}<br/>(${this.freeSpinsCount} remaining)`;
            freeSpinsDisplayEl.style.display = 'block';
            if (spinButton) spinButton.disabled = true;
        } else {
            freeSpinsDisplayEl.style.display = 'none';
            if (spinButton && !this.isSpinning) {
                spinButton.disabled = false;
            }
        }

        // Ensure spin button is always disabled if isSpinning is true, regardless of free spins
        if (this.isSpinning && spinButton) {
            spinButton.disabled = true;
        }
    }

    changeBet(delta) {
        this.handleFirstInteraction();
        if (this.isSpinning) return;

        const oldBetAmount = this.betAmount;
        const newBet = this.betAmount + (delta * this.betIncrement);
        if (newBet >= this.minBet && newBet <= this.maxBet) {
            this.betAmount = Math.round(newBet * 100) / 100;
            if (this.betAmount !== oldBetAmount) {
                this.playSound('coin');
            }
            this.updateDisplay();
        }
    }

    changePaylines(delta) {
        this.handleFirstInteraction();
        if (this.isSpinning) return;

        const newCount = this.currentPaylineCount + delta;
        if (newCount >= 1 && newCount <= this.maxPaylines) {
            this.currentPaylineCount = newCount;
            this.updateDisplay();
            this.draw();
        }
    }

    applyWinRateToNextReel(currentReelIndex) {
        if (this.currentPaylineCount === 0) return;

        const nextReelIndex = currentReelIndex + 1;
        if (nextReelIndex >= this.config.reels) return;

        // Make win rate much more aggressive and consistent
        const winRateNormalized = this.winRate / 100.0;

        // More aggressive scaling: 0% = almost no wins, 100% = almost guaranteed wins
        let influenceChance;
        if (this.winRate === 0) {
            influenceChance = 0.02; // 2% chance at 0%
        } else if (this.winRate === 100) {
            influenceChance = 0.95; // 95% chance at 100%
        } else {
            // Exponential scaling for more dramatic differences
            influenceChance = Math.pow(winRateNormalized, 0.7) * 0.93 + 0.02;
        }

        // Get symbols from current reel that just stopped (visible symbols only)
        for (let row = 0; row < this.config.rows; row++) {
            const currentStripPosition = (this.reelPositions[currentReelIndex] + row) % this.reelStripLength;
            const currentSymbol = this.reelStrips[currentReelIndex][currentStripPosition];

            // Skip wild and scatter symbols - we want to create regular symbol matches
            if (!currentSymbol || currentSymbol.isWild || currentSymbol.isScatter) continue;

            // Check if we should influence the next reel based on aggressive win rate
            const shouldInfluence = Math.random() < influenceChance;

            if (shouldInfluence) {
                // Determine target positions in next reel (same row, row above, row below)
                const targetRows = [row]; // Always include same row
                if (row > 0) targetRows.push(row - 1); // Row above if exists
                if (row < this.config.rows - 1) targetRows.push(row + 1); // Row below if exists

                // Choose one of the target rows randomly
                const targetRow = targetRows[Math.floor(Math.random() * targetRows.length)];

                // Calculate the strip position for this target row in next reel
                const nextReelStripPosition = (this.reelPositions[nextReelIndex] + targetRow) % this.reelStripLength;

                // Replace the symbol at this position with a matching one (create horizontal match)
                this.reelStrips[nextReelIndex][nextReelStripPosition] = { ...currentSymbol };

                // At high win rates, also influence nearby positions for stronger effect
                if (this.winRate >= 80) {
                    const nearbyPositions = [
                        (nextReelStripPosition - 1 + this.reelStripLength) % this.reelStripLength,
                        (nextReelStripPosition + 1) % this.reelStripLength
                    ];

                    const nearbyInfluenceChance = (this.winRate - 80) / 100.0; // 0% at 80%, 20% at 100%
                    for (const pos of nearbyPositions) {
                        if (Math.random() < nearbyInfluenceChance) {
                            this.reelStrips[nextReelIndex][pos] = { ...currentSymbol };
                        }
                    }
                }
            }
        }
    }

    getSymbolWithHorizontalInfluence(reelIndex, stripPosition) {
        if (this.winRate > 0 && reelIndex > 0 && this.reelStrips[reelIndex - 1]) {
            const prevReelStrip = this.reelStrips[reelIndex - 1];
            // Ensure stripPosition is valid for prevReelStrip
            const safePrevStripPosition = stripPosition % prevReelStrip.length;
            const prevSymbol = prevReelStrip[safePrevStripPosition];

            if (prevSymbol && !prevSymbol.isWild && !prevSymbol.isScatter) {
                const winRateNormalized = this.winRate / 100.0;
                let matchChance;
                let forceWildAtHighRate = false;

                if (winRateNormalized <= 0.005) { // Effectively 0% win rate
                    matchChance = 0.0001; // Extremely low chance to match prevSymbol
                } else if (winRateNormalized >= 0.995) { // Effectively 100% win rate
                    matchChance = 0.9999; // Extremely high chance to match
                    // At 100% win rate, make it very likely to be a wild if a match occurs
                    if (Math.random() < (this.wildRarity + 0.1) * 2.5) { // Increased chance for wild
                        forceWildAtHighRate = true;
                    }
                } else {
                    // Power curve for intermediate rates
                    matchChance = Math.pow(winRateNormalized, 2.0) * 0.80 + (0.10 * winRateNormalized);
                    matchChance = Math.max(0.001, Math.min(0.98, matchChance)); // Clamp intermediate values
                }

                if (Math.random() < matchChance) {
                    if (forceWildAtHighRate) {
                        return { ...this.symbols.find(s => s.isWild) };
                    }
                    // For non-extreme win rates, calculate wild chance
                    // Only allow wilds to appear via this matching mechanism if winRate is not effectively zero
                    if (winRateNormalized > 0.01) {
                        // Wilds are more likely with higher win rates, less with lower.
                        // Multiplier ranges from ~0.1 (at low WR) to ~2.0 (at high WR before 100% override)
                        const wildMultiplier = 0.1 + winRateNormalized * 1.9;
                        if (Math.random() < this.wildRarity * wildMultiplier) {
                            return { ...this.symbols.find(s => s.isWild) };
                        }
                    }
                    return { ...prevSymbol }; // Return the matching symbol
                }
            }
        }
        return this.getBasicRandomSymbol(); // Fallback to basic random symbol
    }

    changeWinRate(value) {
        if (this.isSpinning) return;

        this.winRate = parseInt(value);
        this.updateDisplay();

        this.generateReelStrips();
        this.updateGridFromReels();
        this.draw();

        let qualitativeDescription = "";
        let toastType = 'info';

        if (this.winRate <= 10) {
            qualitativeDescription = "Very Low Win Chance";
            toastType = 'error';
        } else if (this.winRate <= 30) {
            qualitativeDescription = "Low Win Chance";
            toastType = 'warning';
        } else if (this.winRate <= 70) {
            qualitativeDescription = "Medium Win Chance";
            toastType = 'info';
        } else if (this.winRate <= 90) {
            qualitativeDescription = "High Win Chance";
            toastType = 'win';
        } else {
            qualitativeDescription = "Very High Win Chance";
            toastType = 'win';
        }

        this.showToast(`🎰 Win Rate: ${this.winRate}% (${qualitativeDescription})`, toastType, 3500);
    }

    changeWildRarity(value) {
        if (this.isSpinning) return;

        this.wildRarity = parseFloat(value) / 100.0;
        document.getElementById('wildRarityValue').textContent = value;

        // Update the wild symbol probability in the symbols array
        const wildSymbol = this.symbols.find(s => s.isWild);
        if (wildSymbol) {
            wildSymbol.probability = this.wildRarity;
        }

        // Regenerate reel strips to apply new wild rarity immediately
        this.generateReelStrips();
        this.updateGridFromReels();
        this.draw();

        // Calculate actual wild chance with current win rate
        const wildMultiplier = 0.5 + (this.winRate / 100.0);
        const actualWildChance = Math.round(this.wildRarity * wildMultiplier * 100);

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

        this.showToast(`🃏 Wild Base: ${value}% → Actual: ${actualWildChance}% (${rarityDescription}, scaled by win rate)`, toastType, 3500);
    }

    changeScatterRarity(value) {
        if (this.isSpinning) return;

        this.scatterRarity = parseFloat(value) / 100.0;  // Add this line
        document.getElementById('scatterRarityValue').textContent = value;

        // Update the scatter symbol probability in the symbols array
        const scatterSymbol = this.symbols.find(s => s.isScatter);
        if (scatterSymbol) {
            scatterSymbol.probability = this.scatterRarity;
        }

        // Regenerate reel strips to apply new scatter rarity immediately
        this.generateReelStrips();
        this.updateGridFromReels();
        this.draw();

        // Calculate actual scatter chance with current win rate
        const scatterMultiplier = 0.25 + (this.winRate / 100.0) * 1.5;
        const actualScatterChance = Math.round(scatterRarity * scatterMultiplier * 100);

        let rarityDescription = "";
        let toastType = 'info';

        if (value == 0) {
            rarityDescription = "None";
            toastType = 'error';
        } else if (value <= 3) {
            rarityDescription = "Rare";
            toastType = 'info';
        } else if (value <= 6) {
            rarityDescription = "Normal";
            toastType = 'info';
        } else if (value <= 10) {
            rarityDescription = "Common";
            toastType = 'warning';
        } else {
            rarityDescription = "Frequent";
            toastType = 'win';
        }

        this.showToast(`🌟 Scatter Base: ${value}% → Actual: ${actualScatterChance}% (${rarityDescription}, scaled by win rate)`, toastType, 3500);
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
        this.handleFirstInteraction();
        if (this.isSpinning) return;

        this.balance = 100.00;
        this.betAmount = 1.00;
        this.currentPaylineCount = this.maxPaylines;
        this.winRate = 50;

        this.isInFreeSpins = false;
        this.freeSpinsCount = 0;
        this.totalFreeSpinsAwarded = 0;
        this.currentFreeSpinNumber = 0;

        this.playSound('coin');
        this.updateDisplay();
        const winRateSlider = document.getElementById('winRateSlider');
        if (winRateSlider) winRateSlider.value = 50;
        this.showToast("🎰 Game reset! $100.00 starting balance", 'info', 2000);
    }

    // Add mobile detection method
    detectMobile() {
        // Prefer window.matchMedia for modern mobile detection if available
        if (window.matchMedia("(pointer: coarse)").matches && window.matchMedia("(hover: none)").matches) {
            return true;
        }
        // Fallback to User Agent sniffing
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            (window.innerWidth <= 800 && window.innerHeight <= 600); // Broader check for small screens
    }

    // Initialize mobile-specific features
    initializeMobileSupport() {
        if (this.isMobile) {
            this.adjustCanvasForMobile(); // Initial adjustment for non-fullscreen
            this.addTouchListeners();
            // preventDefaultTouchBehaviors can be aggressive, ensure it's needed or test thoroughly
            // this.preventDefaultTouchBehaviors(); 
        }

        window.addEventListener('resize', () => {
            // Debounce resize event
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 150);
        });

        window.addEventListener('orientationchange', () => {
            clearTimeout(this.resizeTimeout); // Also clear on orientation change
            this.resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 200); // Slightly longer delay for orientation to settle
        });
    }

    // Adjust canvas size for mobile devices
    adjustCanvasForMobile() { // For NON-FULLSCREEN mobile
        const canvas = this.canvas;
        if (this.isMobile && !this.isFullscreen) {
            // Reset any fullscreen scaling styles
            canvas.style.width = '';
            canvas.style.height = '';

            const aspectRatio = this.baseCanvasWidth / this.baseCanvasHeight;

            let availableWidth = window.innerWidth - 20; // Small padding
            let availableHeight = window.innerHeight * 0.45; // Max 45% of viewport height for canvas

            // Cap max dimensions for non-fullscreen mobile
            availableWidth = Math.min(availableWidth, 420);
            availableHeight = Math.min(availableHeight, 320);

            let newCanvasWidth = availableWidth;
            let newCanvasHeight = newCanvasWidth / aspectRatio;

            if (newCanvasHeight > availableHeight) {
                newCanvasHeight = availableHeight;
                newCanvasWidth = newCanvasHeight * aspectRatio;
            }

            canvas.width = Math.max(50, newCanvasWidth); // Set drawing buffer size
            canvas.height = Math.max(50, newCanvasHeight); // Set drawing buffer size

            this.recalculateReelDimensions();
            this.draw();
        }
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
        document.addEventListener('touchstart', function (e) {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        });

        // Prevent zoom on double tap with timeout
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function (e) {
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
        const wasMobile = this.isMobile;
        this.isMobile = this.detectMobile();

        if (wasMobile !== this.isMobile) {
            this.updateMobileUI();
        }

        if (this.isFullscreen) {
            // Ensure canvas drawing buffer is base size before scaling
            this.canvas.width = this.baseCanvasWidth;
            this.canvas.height = this.baseCanvasHeight;
            this.resizeCanvasForFullscreen();
        } else {
            // Reset styles that might have been applied by fullscreen
            this.canvas.style.width = '';
            this.canvas.style.height = '';
            if (this.isMobile) {
                this.adjustCanvasForMobile();
            } else {
                this.canvas.width = this.baseCanvasWidth;
                this.canvas.height = this.baseCanvasHeight;
                this.recalculateReelDimensions();
                this.draw();
            }
        }
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

    changeGameTheme(themeKey) {
        if (this.isSpinning) return;

        this.handleFirstInteraction();

        if (this.gameThemes[themeKey]) {
            this.currentTheme = themeKey;
            this.symbols = this.gameThemes[themeKey].symbols;

            // Update wild and scatter probabilities
            const wildSymbol = this.symbols.find(s => s.isWild);
            const scatterSymbol = this.symbols.find(s => s.isScatter);
            if (wildSymbol) wildSymbol.probability = this.wildRarity;
            if (scatterSymbol) scatterSymbol.probability = this.scatterRarity;

            // Regenerate everything with new theme
            this.generateReelStrips();
            this.updateGridFromReels();
            this.draw();

            const themeName = this.gameThemes[themeKey].name;
            this.showToast(`🎨 Theme changed to: ${themeName}`, 'info', 3000);
        }
    }

    toggleSettingsSidebar() {
        const sidebar = document.getElementById('settingsSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const isOpen = sidebar.classList.contains('open');

        if (isOpen) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        } else {
            sidebar.classList.add('open');
            overlay.classList.add('active');
        }
    }

    // Close settings sidebar
    closeSettingsSidebar() {
        const sidebar = document.getElementById('settingsSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    }

    // Initialize mobile detection
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            window.innerWidth <= 768;
    }

    // Method to easily change grid size (for customization)
    reconfigure(reels, rows) {
        this.handleFirstInteraction();
        if (this.isSpinning) return;

        this.config.reels = reels;
        this.config.rows = rows;

        this.reelWidth = (this.canvas.width - (this.config.reels - 1) * this.config.spacing) / this.config.reels;
        this.rowHeight = (this.canvas.height - (this.config.rows - 1) * this.config.spacing) / this.config.rows;

        this.paylines = this.generatePaylines();
        this.maxPaylines = this.paylines.length;
        this.currentPaylineCount = this.maxPaylines;

        this.initializeReels();
        this.updateDisplay();
        this.draw();

        this.showMessage(`📐 Grid: ${reels}x${rows} (${this.maxPaylines} lines)`, 2000);
        this.playSound('coin');
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

function changeGameTheme(themeKey) {
    slotMachine.changeGameTheme(themeKey);
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
    slotMachine.balance += amount;  // Changed from coinCount to balance
    slotMachine.updateDisplay();
    slotMachine.showToast(`💰 +${slotMachine.formatCurrency(amount)} added!`, 'win', 2000);
}

function changeScatterRarity(value) {
    slotMachine.changeScatterRarity(value);
}

function changeSpinSpeed(value) {
    slotMachine.changeSpinSpeed(value);
}

function toggleRandomizeReels() {
    slotMachine.toggleRandomizeReels();
}

function setBgMusicVolume(value) {
    if (slotMachine) {
        slotMachine.handleFirstInteraction();
        slotMachine.setBgMusicVolume(value);
    }
}

function updateBgVolumeValue(value) {
    const bgVolEl = document.getElementById('bgVolumeValue');
    if (bgVolEl) bgVolEl.textContent = Math.round(parseFloat(value) * 100);
}

function setSfxVolume(value) {
    if (slotMachine) {
        slotMachine.handleFirstInteraction();
        slotMachine.setSfxVolume(value);
    }
}

function updateSfxVolumeValue(value) {
    const sfxVolEl = document.getElementById('sfxVolumeValue');
    if (sfxVolEl) sfxVolEl.textContent = Math.round(parseFloat(value) * 100);
}

window.addEventListener('load', () => {
    slotMachine = new SlotMachine();

    // Initialize volume slider display values and slider positions
    const bgVolumeSlider = document.getElementById('bgVolumeSlider');
    const sfxVolumeSlider = document.getElementById('sfxVolumeSlider');

    if (bgVolumeSlider) {
        bgVolumeSlider.value = slotMachine.bgMusicVolume;
        updateBgVolumeValue(slotMachine.bgMusicVolume);
    }
    if (sfxVolumeSlider) {
        sfxVolumeSlider.value = slotMachine.sfxVolume;
        updateSfxVolumeValue(slotMachine.sfxVolume);
    }

    // Add mobile-specific styles
    if (slotMachine.isMobile) {
        document.body.classList.add('mobile-device');

        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    }
    // Initial canvas setup (non-fullscreen)
    if (slotMachine.isMobile) {
        slotMachine.adjustCanvasForMobile();
    } else {
        slotMachine.canvas.width = slotMachine.baseCanvasWidth;
        slotMachine.canvas.height = slotMachine.baseCanvasHeight;
        slotMachine.recalculateReelDimensions();
    }

    slotMachine.updateMobileUI(); // Initial UI setup
    // slotMachine.handleResize(); // handleResize is now more comprehensive, let initial setup be direct
    slotMachine.draw();
});