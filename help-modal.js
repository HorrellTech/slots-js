// Help Modal System - Shows game symbols, payouts and rules

class HelpModal {
    constructor(slotMachine) {
        this.slotMachine = slotMachine;
        this.isOpen = false;
        this.currentTab = 'symbols';
        this.storageKey = 'slotsMachineHelpOnStartup';
        
        this.createHelpButton();
        this.createModal();
        this.setupEventListeners();
        
        // Check if we should open on startup
        this.checkStartupPreference();
    }
    
    createHelpButton() {
        const helpButton = document.createElement('div');
        helpButton.id = 'helpButton';
        helpButton.innerHTML = '<span>?</span>';
        helpButton.title = 'Game Help';
        document.body.appendChild(helpButton);
    }
    
    createModal() {
        // Create modal container
        const modal = document.createElement('div');
        modal.id = 'helpModal';
        modal.classList.add('help-modal');
        
        // Check if setting exists in localStorage, default to checked if not found
        const showOnStartup = localStorage.getItem(this.storageKey) !== 'false';
        
        // Create modal content
        modal.innerHTML = `
            <div class="help-modal-content">
                <div class="help-modal-header">
                    <h2>Game Help</h2>
                    <div class="tabs">
                        <button class="tab-btn active" data-tab="symbols">Symbols</button>
                        <button class="tab-btn" data-tab="paylines">Paylines</button>
                        <button class="tab-btn" data-tab="rules">Rules</button>
                    </div>
                    <span class="close-btn">&times;</span>
                </div>
                <div class="help-modal-body">
                    <div id="symbols-tab" class="tab-content active"></div>
                    <div id="paylines-tab" class="tab-content"></div>
                    <div id="rules-tab" class="tab-content">
                        <h3>How to Play</h3>
                        <ul>
                            <li>Select your bet amount using the + and - buttons.</li>
                            <li>Select how many paylines you want to play.</li>
                            <li>Click SPIN to start the game.</li>
                            <li>Winning combinations pay from left to right.</li>
                            <li>Wild symbols substitute for any regular symbol to form winning combinations.</li>
                            <li>${this.slotMachine?.scatterThreshold || 3} or more Scatter symbols trigger free spins.</li>
                        </ul>
                        <h3>Free Spins Feature</h3>
                        <p>Get ${this.slotMachine?.scatterThreshold || 3} or more Scatter symbols anywhere on the reels to trigger free spins!</p>
                        <p>During free spins, all wins are multiplied by ${this.slotMachine?.freeSpinMultiplier || 1.25}.</p>
                    </div>
                </div>
                <div class="help-modal-footer">
                    <label class="startup-checkbox">
                        <input type="checkbox" id="showOnStartupCheckbox" ${showOnStartup ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        <span class="checkbox-label">Show on startup</span>
                    </label>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    setupEventListeners() {
        // Help button click
        const helpButton = document.getElementById('helpButton');
        helpButton.addEventListener('click', () => this.openModal());
        
        // Close button click
        const closeBtn = document.querySelector('#helpModal .close-btn');
        closeBtn.addEventListener('click', () => this.closeModal());
        
        // Tab switching
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Close when clicking outside modal
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('helpModal')) {
                this.closeModal();
            }
        });
        
        // Keyboard escape to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeModal();
            }
        });
        
        // Show on startup checkbox
        const startupCheckbox = document.getElementById('showOnStartupCheckbox');
        startupCheckbox.addEventListener('change', (e) => {
            localStorage.setItem(this.storageKey, e.target.checked ? 'true' : 'false');
        });
    }
    
    openModal() {
        const modal = document.getElementById('helpModal');
        modal.style.display = 'flex';
        this.isOpen = true;
        
        // Always refresh content when opening to ensure current theme is shown
        this.updateContent();
        
        // Add animation class
        setTimeout(() => {
            modal.classList.add('open');
        }, 10);
    }
    
    closeModal() {
        const modal = document.getElementById('helpModal');
        modal.classList.remove('open');
        
        // Wait for animation to finish
        setTimeout(() => {
            modal.style.display = 'none';
            this.isOpen = false;
        }, 300);
    }
    
    switchTab(tabName) {
        // Update active tab button
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update active tab content
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        const activeTab = document.getElementById(`${tabName}-tab`);
        activeTab.classList.add('active');
        
        // Ensure the body scrolls to top when switching tabs
        const modalBody = document.querySelector('.help-modal-body');
        if (modalBody) modalBody.scrollTop = 0;
        
        this.currentTab = tabName;
        
        // Update content for the tab if needed
        this.updateContent(tabName);
    }
    
    updateContent(tabName = this.currentTab) {
        if (tabName === 'symbols') {
            this.updateSymbolsContent();
        } else if (tabName === 'paylines') {
            this.updatePaylinesContent();
        }
    }
    
    updateSymbolsContent() {
        if (!this.slotMachine || !this.slotMachine.symbols) return;
        
        const symbolsTab = document.getElementById('symbols-tab');
        symbolsTab.innerHTML = '';
        
        const symbols = this.slotMachine.symbols;
        
        // Find max possible match length (typically 5 for 5-reel slots)
        const maxMatchLength = Math.min(5, this.slotMachine.config.reels);
        const minWinLength = this.slotMachine.minWinLength;
        
        // Create heading
        const heading = document.createElement('h3');
        heading.textContent = `Symbol Values - ${this.slotMachine.gameThemes[this.slotMachine.currentTheme].name}`;
        symbolsTab.appendChild(heading);
        
        // Create container for symbol rows
        const symbolsContainer = document.createElement('div');
        symbolsContainer.className = 'symbols-container';
        
        // First add special symbols (wild, scatter)
        const specialSymbols = symbols.filter(s => s.isWild || s.isScatter);
        const regularSymbols = symbols.filter(s => !s.isWild && !s.isScatter);
        
        // Sort regular symbols by value (highest first)
        regularSymbols.sort((a, b) => b.value - a.value);
        
        // Combine special first, then regular
        const orderedSymbols = [...specialSymbols, ...regularSymbols];
        
        orderedSymbols.forEach(symbol => {
            const symbolCard = document.createElement('div');
            symbolCard.className = 'symbol-card';
            
            let cardContent = `
                <div class="symbol-card-layout">
                    <div class="symbol-large" style="background-color: ${symbol.color}40">
                        <span class="symbol-text">${symbol.name}</span>
                    </div>
                    <div class="symbol-details">
                        <div class="symbol-name">${symbol.isWild ? 'Wild' : (symbol.isScatter ? 'Scatter' : symbol.id)}</div>
            `;
            
            // For regular symbols, show values for different win lengths
            if (!symbol.isWild && !symbol.isScatter) {
                cardContent += `<div class="symbol-values-list">`;
                for (let i = minWinLength; i <= maxMatchLength; i++) {
                    // Calculate multiplier based on match length
                    let multiplier = 1;
                    if (i === 4) multiplier = 1.5;
                    else if (i === 5) multiplier = 2.5;
                    
                    const value = symbol.value * multiplier * (i / minWinLength);
                    
                    cardContent += `
                        <div class="value-row">
                            <span class="match-length">${i}x</span>
                            <span class="value-amount">${value.toFixed(0)}</span>
                        </div>
                    `;
                }
                cardContent += `</div>`;
            } else if (symbol.isWild) {
                cardContent += `
                    <div class="special-description">
                        Substitutes for any symbol except Scatter.
                    </div>
                `;
            } else if (symbol.isScatter) {
                cardContent += `
                    <div class="special-description">
                        ${this.slotMachine.scatterThreshold}+ Scatters award ${this.slotMachine.baseFreeSpins} Free Spins.
                        <br>Pays anywhere on the reels.
                    </div>
                `;
            }
            
            cardContent += `
                    </div>
                </div>
            `;
            symbolCard.innerHTML = cardContent;
            symbolsContainer.appendChild(symbolCard);
        });
        
        symbolsTab.appendChild(symbolsContainer);
    }
    
    updatePaylinesContent() {
        if (!this.slotMachine || !this.slotMachine.paylines) return;
        
        const paylinesTab = document.getElementById('paylines-tab');
        paylinesTab.innerHTML = '';
        
        const heading = document.createElement('h3');
        heading.textContent = `Available Paylines (${this.slotMachine.maxPaylines})`;
        paylinesTab.appendChild(heading);
        
        const paylinesContainer = document.createElement('div');
        paylinesContainer.className = 'paylines-container';
        
        // Show a sample of paylines (limit to 20 to prevent overwhelming)
        const paylinesToShow = this.slotMachine.paylines.slice(0, 20);
        
        paylinesToShow.forEach((payline, index) => {
            const paylineCard = document.createElement('div');
            paylineCard.className = 'payline-card';
            
            // Create mini-grid representation of the payline
            const gridSize = {
                rows: this.slotMachine.config.rows,
                reels: this.slotMachine.config.reels
            };
            
            let miniGrid = `
                <div class="payline-name">${payline.name}</div>
                <div class="payline-grid" style="grid-template-columns: repeat(${gridSize.reels}, 1fr); grid-template-rows: repeat(${gridSize.rows}, 1fr);">
            `;
            
            // Create cells for the grid
            for (let row = 0; row < gridSize.rows; row++) {
                for (let reel = 0; reel < gridSize.reels; reel++) {
                    // Check if this position is part of the payline
                    const isPaylinePosition = payline.positions.some(pos => 
                        pos.row === row && pos.reel === reel
                    );
                    
                    const cellClass = isPaylinePosition ? 'payline-cell active' : 'payline-cell';
                    const cellColor = isPaylinePosition ? payline.color : 'transparent';
                    
                    miniGrid += `<div class="${cellClass}" style="background-color: ${cellColor}"></div>`;
                }
            }
            
            miniGrid += `</div>`;
            paylineCard.innerHTML = miniGrid;
            paylinesContainer.appendChild(paylineCard);
        });
        
        // If there are more paylines than we're showing, add a note
        if (this.slotMachine.paylines.length > paylinesToShow.length) {
            const note = document.createElement('p');
            note.className = 'payline-note';
            note.textContent = `Showing ${paylinesToShow.length} of ${this.slotMachine.paylines.length} available paylines.`;
            paylinesContainer.appendChild(note);
        }
        
        paylinesTab.appendChild(paylinesContainer);
    }
    
    checkStartupPreference() {
        // Default to true (show on startup) if not set
        const showOnStartup = localStorage.getItem(this.storageKey) !== 'false';
        
        if (showOnStartup) {
            // Slight delay to ensure the game UI is ready
            setTimeout(() => this.openModal(), 800);
        }
    }
}

// Initialize the help modal when the window loads - after slotMachine is created
window.addEventListener('load', () => {
    // Wait a bit to ensure slotMachine is initialized
    setTimeout(() => {
        window.helpModal = new HelpModal(slotMachine);
        
        // Add window resize handler to maintain proper modal dimensions
        window.addEventListener('resize', () => {
            if (window.helpModal && window.helpModal.isOpen) {
                // Optional: adjust content if needed on resize
            }
        });
    }, 500);
});