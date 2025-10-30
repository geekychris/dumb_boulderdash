// Boulder Dash Game - JavaScript Implementation
class BoulderDash {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game settings
        this.TILE_SIZE = 20;
        this.GRID_WIDTH = 32;
        this.GRID_HEIGHT = 24;
        
        // Game state
        this.gameState = 'menu'; // menu, playing, paused, gameOver, levelComplete
        this.currentLevel = 1;
        this.score = 0;
        this.timeLeft = 150;
        this.diamondsCollected = 0;
        this.diamondsRequired = 10;
        
        // Game grid and entities
        this.grid = [];
        this.player = { x: 1, y: 1, alive: true };
        this.fallingObjects = [];
        this.explosions = [];
        
        // Input handling
        this.keys = {};
        this.lastMoveTime = 0;
        this.moveDelay = 150; // milliseconds between moves
        
        // Game timer
        this.gameTimer = null;
        this.lastTime = 0;
        
        // Sound system
        this.audioContext = null;
        this.sounds = {};
        this.initializeSounds();
        
        // Element types
        this.EMPTY = 0;
        this.DIRT = 1;
        this.WALL = 2;
        this.ROCK = 3;
        this.DIAMOND = 4;
        this.PLAYER = 5;
        this.EXIT = 6;
        this.STEEL_WALL = 7;
        
        this.initializeGame();
        this.bindEvents();
    }
    
    initializeGame() {
        this.initializeGrid();
        this.generateLevel(this.currentLevel);
        this.updateUI();
    }
    
    initializeSounds() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Audio not supported');
            this.audioContext = null;
        }
    }
    
    playSound(frequency, duration = 0.1, type = 'sine') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    initializeGrid() {
        this.grid = [];
        for (let y = 0; y < this.GRID_HEIGHT; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.GRID_WIDTH; x++) {
                this.grid[y][x] = this.EMPTY;
            }
        }
    }
    
    generateLevel(level) {
        this.initializeGrid();
        this.fallingObjects = [];
        this.explosions = [];
        this.diamondsCollected = 0;
        this.diamondsRequired = Math.max(10, 8 + level * 2);
        this.timeLeft = Math.max(120, 180 - level * 10);
        
        // Create border walls
        for (let x = 0; x < this.GRID_WIDTH; x++) {
            this.grid[0][x] = this.STEEL_WALL;
            this.grid[this.GRID_HEIGHT - 1][x] = this.STEEL_WALL;
        }
        for (let y = 0; y < this.GRID_HEIGHT; y++) {
            this.grid[y][0] = this.STEEL_WALL;
            this.grid[y][this.GRID_WIDTH - 1] = this.STEEL_WALL;
        }
        
        // Fill with dirt
        for (let y = 1; y < this.GRID_HEIGHT - 1; y++) {
            for (let x = 1; x < this.GRID_WIDTH - 1; x++) {
                if (Math.random() < 0.7) {
                    this.grid[y][x] = this.DIRT;
                }
            }
        }
        
        // Add walls randomly
        const wallCount = 30 + level * 5;
        for (let i = 0; i < wallCount; i++) {
            const x = Math.floor(Math.random() * (this.GRID_WIDTH - 2)) + 1;
            const y = Math.floor(Math.random() * (this.GRID_HEIGHT - 2)) + 1;
            if (Math.abs(x - 1) > 2 || Math.abs(y - 1) > 2) {
                this.grid[y][x] = this.WALL;
            }
        }
        
        // Add rocks
        const rockCount = 40 + level * 3;
        for (let i = 0; i < rockCount; i++) {
            const x = Math.floor(Math.random() * (this.GRID_WIDTH - 2)) + 1;
            const y = Math.floor(Math.random() * (this.GRID_HEIGHT - 2)) + 1;
            if (this.grid[y][x] === this.EMPTY && (Math.abs(x - 1) > 2 || Math.abs(y - 1) > 2)) {
                this.grid[y][x] = this.ROCK;
            }
        }
        
        // Add diamonds
        for (let i = 0; i < this.diamondsRequired + 5; i++) {
            const x = Math.floor(Math.random() * (this.GRID_WIDTH - 2)) + 1;
            const y = Math.floor(Math.random() * (this.GRID_HEIGHT - 2)) + 1;
            if (this.grid[y][x] === this.EMPTY && (Math.abs(x - 1) > 2 || Math.abs(y - 1) > 2)) {
                this.grid[y][x] = this.DIAMOND;
            }
        }
        
        // Place player
        this.player = { x: 1, y: 1, alive: true };
        this.grid[1][1] = this.EMPTY;
        this.grid[1][2] = this.EMPTY;
        this.grid[2][1] = this.EMPTY;
        
        // Place exit
        const exitX = this.GRID_WIDTH - 2;
        const exitY = this.GRID_HEIGHT - 2;
        this.grid[exitY][exitX] = this.EXIT;
        this.grid[exitY - 1][exitX] = this.EMPTY;
        this.grid[exitY][exitX - 1] = this.EMPTY;
    }
    
    bindEvents() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if (e.key === ' ') {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.restartLevel();
                }
            }
            
            if (e.key.toLowerCase() === 'r') {
                e.preventDefault();
                this.resetGame();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Button events
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restartButton').addEventListener('click', () => {
            this.resetGame();
        });
        
        document.getElementById('nextLevelButton').addEventListener('click', () => {
            this.nextLevel();
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        document.getElementById('gameOverlay').classList.add('hidden');
        this.startGameLoop();
        this.startTimer();
    }
    
    startGameLoop() {
        const gameLoop = (timestamp) => {
            if (this.gameState === 'playing') {
                this.update(timestamp);
                this.render();
                requestAnimationFrame(gameLoop);
            }
        };
        requestAnimationFrame(gameLoop);
    }
    
    startTimer() {
        this.gameTimer = setInterval(() => {
            if (this.gameState === 'playing') {
                this.timeLeft--;
                this.updateUI();
                
                if (this.timeLeft <= 0) {
                    this.gameOver('Time\'s up!');
                }
            }
        }, 1000);
    }
    
    update(timestamp) {
        if (timestamp - this.lastMoveTime > this.moveDelay) {
            this.handleInput();
            this.lastMoveTime = timestamp;
        }
        
        this.updatePhysics();
        this.updateExplosions();
        this.checkWinCondition();
    }
    
    handleInput() {
        if (!this.player.alive) return;
        
        let newX = this.player.x;
        let newY = this.player.y;
        
        if (this.keys['ArrowUp']) newY--;
        if (this.keys['ArrowDown']) newY++;
        if (this.keys['ArrowLeft']) newX--;
        if (this.keys['ArrowRight']) newX++;
        
        if (newX !== this.player.x || newY !== this.player.y) {
            this.tryMovePlayer(newX, newY);
        }
    }
    
    tryMovePlayer(newX, newY) {
        if (newX < 0 || newX >= this.GRID_WIDTH || newY < 0 || newY >= this.GRID_HEIGHT) {
            return false;
        }
        
        const targetTile = this.grid[newY][newX];
        
        switch (targetTile) {
            case this.EMPTY:
            case this.DIRT:
                this.player.x = newX;
                this.player.y = newY;
                if (targetTile === this.DIRT) {
                    this.grid[newY][newX] = this.EMPTY;
                    this.score += 1;
                    this.playSound(200, 0.05, 'sawtooth'); // Dig sound
                }
                return true;
                
            case this.DIAMOND:
                this.player.x = newX;
                this.player.y = newY;
                this.grid[newY][newX] = this.EMPTY;
                this.diamondsCollected++;
                this.score += 10;
                this.playSound(800, 0.15, 'sine'); // Diamond collect sound
                this.updateUI();
                return true;
                
            case this.ROCK:
                // Try to push rock
                const pushX = newX + (newX - this.player.x);
                const pushY = newY + (newY - this.player.y);
                
                if (pushX >= 0 && pushX < this.GRID_WIDTH && 
                    pushY >= 0 && pushY < this.GRID_HEIGHT &&
                    this.grid[pushY][pushX] === this.EMPTY &&
                    newY === this.player.y) { // Can only push horizontally
                    
                    this.grid[pushY][pushX] = this.ROCK;
                    this.grid[newY][newX] = this.EMPTY;
                    this.player.x = newX;
                    this.player.y = newY;
                    this.playSound(150, 0.1, 'square'); // Push rock sound
                    return true;
                }
                return false;
                
            case this.EXIT:
                if (this.diamondsCollected >= this.diamondsRequired) {
                    this.playSound(600, 0.3, 'sine'); // Level complete sound
                    this.levelComplete();
                    return true;
                }
                return false;
                
            default:
                return false;
        }
    }
    
    updatePhysics() {
        const newFallingObjects = [];
        
        // Check for new falling objects
        for (let y = this.GRID_HEIGHT - 2; y >= 1; y--) {
            for (let x = 1; x < this.GRID_WIDTH - 1; x++) {
                const current = this.grid[y][x];
                const below = this.grid[y + 1][x];
                
                if ((current === this.ROCK || current === this.DIAMOND) && below === this.EMPTY) {
                    // Object can fall
                    this.grid[y + 1][x] = current;
                    this.grid[y][x] = this.EMPTY;
                    newFallingObjects.push({ x: x, y: y + 1, type: current });
                } else if ((current === this.ROCK || current === this.DIAMOND) && 
                          (below === this.ROCK || below === this.DIAMOND)) {
                    // Check if can roll off
                    const left = this.grid[y][x - 1];
                    const belowLeft = this.grid[y + 1][x - 1];
                    const right = this.grid[y][x + 1];
                    const belowRight = this.grid[y + 1][x + 1];
                    
                    if (left === this.EMPTY && belowLeft === this.EMPTY && Math.random() < 0.5) {
                        this.grid[y][x - 1] = current;
                        this.grid[y][x] = this.EMPTY;
                        newFallingObjects.push({ x: x - 1, y: y, type: current });
                    } else if (right === this.EMPTY && belowRight === this.EMPTY) {
                        this.grid[y][x + 1] = current;
                        this.grid[y][x] = this.EMPTY;
                        newFallingObjects.push({ x: x + 1, y: y, type: current });
                    }
                }
            }
        }
        
        // Check for collisions with player
        for (const obj of newFallingObjects) {
            if (obj.y + 1 < this.GRID_HEIGHT && 
                obj.x === this.player.x && obj.y + 1 === this.player.y) {
                this.playerHit();
                break;
            }
        }
        
        this.fallingObjects = newFallingObjects;
    }
    
    updateExplosions() {
        this.explosions = this.explosions.filter(explosion => {
            explosion.timer--;
            return explosion.timer > 0;
        });
    }
    
    playerHit() {
        this.player.alive = false;
        this.playSound(100, 0.5, 'sawtooth'); // Death/explosion sound
        this.explosions.push({
            x: this.player.x,
            y: this.player.y,
            timer: 20,
            type: 'player'
        });
        
        setTimeout(() => {
            this.gameOver('You were crushed by a falling rock!');
        }, 500);
    }
    
    checkWinCondition() {
        if (this.diamondsCollected >= this.diamondsRequired) {
            // Show exit
            for (let y = 0; y < this.GRID_HEIGHT; y++) {
                for (let x = 0; x < this.GRID_WIDTH; x++) {
                    if (this.grid[y][x] === this.EXIT) {
                        // Exit is now accessible
                    }
                }
            }
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        for (let y = 0; y < this.GRID_HEIGHT; y++) {
            for (let x = 0; x < this.GRID_WIDTH; x++) {
                const tile = this.grid[y][x];
                this.drawTile(x, y, tile);
            }
        }
        
        // Draw player
        if (this.player.alive) {
            this.drawPlayer(this.player.x, this.player.y);
        }
        
        // Draw explosions
        for (const explosion of this.explosions) {
            this.drawExplosion(explosion.x, explosion.y, explosion.timer);
        }
    }
    
    drawTile(x, y, type) {
        const pixelX = x * this.TILE_SIZE;
        const pixelY = y * this.TILE_SIZE;
        
        switch (type) {
            case this.EMPTY:
                // Already black
                break;
                
            case this.DIRT:
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(pixelX, pixelY, this.TILE_SIZE, this.TILE_SIZE);
                this.ctx.fillStyle = '#A0522D';
                this.ctx.fillRect(pixelX + 2, pixelY + 2, this.TILE_SIZE - 4, this.TILE_SIZE - 4);
                break;
                
            case this.WALL:
                this.ctx.fillStyle = '#696969';
                this.ctx.fillRect(pixelX, pixelY, this.TILE_SIZE, this.TILE_SIZE);
                this.ctx.fillStyle = '#808080';
                this.ctx.fillRect(pixelX + 2, pixelY + 2, this.TILE_SIZE - 4, this.TILE_SIZE - 4);
                break;
                
            case this.STEEL_WALL:
                this.ctx.fillStyle = '#2F4F4F';
                this.ctx.fillRect(pixelX, pixelY, this.TILE_SIZE, this.TILE_SIZE);
                this.ctx.fillStyle = '#708090';
                this.ctx.fillRect(pixelX + 1, pixelY + 1, this.TILE_SIZE - 2, this.TILE_SIZE - 2);
                break;
                
            case this.ROCK:
                this.ctx.fillStyle = '#4A4A4A';
                this.ctx.fillRect(pixelX, pixelY, this.TILE_SIZE, this.TILE_SIZE);
                this.ctx.fillStyle = '#666666';
                this.ctx.beginPath();
                this.ctx.arc(pixelX + this.TILE_SIZE / 2, pixelY + this.TILE_SIZE / 2, 
                           this.TILE_SIZE / 2 - 2, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            case this.DIAMOND:
                this.ctx.fillStyle = '#00CED1';
                this.ctx.beginPath();
                this.ctx.moveTo(pixelX + this.TILE_SIZE / 2, pixelY + 2);
                this.ctx.lineTo(pixelX + this.TILE_SIZE - 2, pixelY + this.TILE_SIZE / 2);
                this.ctx.lineTo(pixelX + this.TILE_SIZE / 2, pixelY + this.TILE_SIZE - 2);
                this.ctx.lineTo(pixelX + 2, pixelY + this.TILE_SIZE / 2);
                this.ctx.closePath();
                this.ctx.fill();
                
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.beginPath();
                this.ctx.moveTo(pixelX + this.TILE_SIZE / 2, pixelY + 4);
                this.ctx.lineTo(pixelX + this.TILE_SIZE - 4, pixelY + this.TILE_SIZE / 2);
                this.ctx.lineTo(pixelX + this.TILE_SIZE / 2, pixelY + this.TILE_SIZE - 4);
                this.ctx.lineTo(pixelX + 4, pixelY + this.TILE_SIZE / 2);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case this.EXIT:
                const accessible = this.diamondsCollected >= this.diamondsRequired;
                this.ctx.fillStyle = accessible ? '#00FF00' : '#FF0000';
                this.ctx.fillRect(pixelX, pixelY, this.TILE_SIZE, this.TILE_SIZE);
                this.ctx.fillStyle = accessible ? '#90EE90' : '#FF6B6B';
                this.ctx.fillRect(pixelX + 4, pixelY + 4, this.TILE_SIZE - 8, this.TILE_SIZE - 8);
                
                // Draw exit symbol
                this.ctx.fillStyle = '#000000';
                this.ctx.font = '12px monospace';
                this.ctx.fillText('E', pixelX + 6, pixelY + 14);
                break;
        }
    }
    
    drawPlayer(x, y) {
        const pixelX = x * this.TILE_SIZE;
        const pixelY = y * this.TILE_SIZE;
        
        // Player body
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(pixelX + this.TILE_SIZE / 2, pixelY + this.TILE_SIZE / 2, 
                   this.TILE_SIZE / 2 - 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Player eyes
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(pixelX + 6, pixelY + 6, 2, 0, Math.PI * 2);
        this.ctx.arc(pixelX + 14, pixelY + 6, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Player mouth
        this.ctx.beginPath();
        this.ctx.arc(pixelX + this.TILE_SIZE / 2, pixelY + 12, 3, 0, Math.PI);
        this.ctx.stroke();
    }
    
    drawExplosion(x, y, timer) {
        const pixelX = x * this.TILE_SIZE;
        const pixelY = y * this.TILE_SIZE;
        
        const alpha = timer / 20;
        this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
        this.ctx.fillRect(pixelX, pixelY, this.TILE_SIZE, this.TILE_SIZE);
        
        this.ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
        this.ctx.fillRect(pixelX + 4, pixelY + 4, this.TILE_SIZE - 8, this.TILE_SIZE - 8);
    }
    
    updateUI() {
        document.getElementById('levelDisplay').textContent = this.currentLevel;
        document.getElementById('diamondCount').textContent = this.diamondsCollected;
        document.getElementById('diamondTarget').textContent = this.diamondsRequired;
        document.getElementById('timeDisplay').textContent = this.timeLeft;
        document.getElementById('scoreDisplay').textContent = this.score;
    }
    
    restartLevel() {
        this.generateLevel(this.currentLevel);
        this.updateUI();
    }
    
    resetGame() {
        this.currentLevel = 1;
        this.score = 0;
        this.gameState = 'menu';
        
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        
        document.getElementById('gameOverlay').classList.remove('hidden');
        document.getElementById('startScreen').classList.remove('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('levelCompleteScreen').classList.add('hidden');
        
        this.generateLevel(this.currentLevel);
        this.updateUI();
    }
    
    gameOver(message) {
        this.gameState = 'gameOver';
        
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        
        document.getElementById('gameOverMessage').textContent = message;
        document.getElementById('gameOverlay').classList.remove('hidden');
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('levelCompleteScreen').classList.add('hidden');
    }
    
    levelComplete() {
        this.gameState = 'levelComplete';
        
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        
        // Bonus points for remaining time
        this.score += this.timeLeft * 5;
        
        const message = `Level ${this.currentLevel} completed!\nScore: ${this.score}\nTime bonus: ${this.timeLeft * 5}`;
        document.getElementById('levelCompleteMessage').textContent = message;
        document.getElementById('gameOverlay').classList.remove('hidden');
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('levelCompleteScreen').classList.remove('hidden');
        
        this.updateUI();
    }
    
    nextLevel() {
        this.currentLevel++;
        this.generateLevel(this.currentLevel);
        this.startGame();
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new BoulderDash();
});
