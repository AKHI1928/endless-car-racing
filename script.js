/**
 * Lucky Nitro - Cyberpunk Road with Professional EnemyManager Architecture
 * script.js
 */

// Use the existing canvas from index.html
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game state flags & scoring variables
let isGameOver = false;
let score = 0;
let bestScore = parseInt(localStorage.getItem('luckyNitroBestScore')) || 0;

// Load images with fallback support
const playerImage = new Image();
playerImage.src = 'assets/player.png';
let playerImageLoaded = false;
playerImage.onload = () => { playerImageLoaded = true; };

const enemyImage = new Image();
enemyImage.src = 'assets/enemy.png';
let enemyImageLoaded = false;
enemyImage.onload = () => { enemyImageLoaded = true; };

// Handle canvas resizing to match window dimensions
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/**
 * Cyberpunk Road Renderer with Perspective Projection
 */
class CyberpunkRoad {
    constructor() {
        this.offsetY = 0;
        this.baseSpeed = 8; // Scrolling speed
    }

    update(speedMultiplier = 1) {
        this.offsetY += this.baseSpeed * speedMultiplier;
        if (this.offsetY >= 60) {
            this.offsetY = 0;
        }
    }

    draw(ctx, width, height) {
        // Perspective road parameters
        const topRoadWidth = width * 0.15;   // Narrower at the horizon/top
        const bottomRoadWidth = width * 0.55; // Wider at the bottom
        const horizonY = height * 0.35;       // Vanishing point Y coordinate
        const bottomY = height;              // Bottom of the screen

        const centerX = width / 2;

        const topLeftX = centerX - topRoadWidth / 2;
        const topRightX = centerX + topRoadWidth / 2;
        const bottomLeftX = centerX - bottomRoadWidth / 2;
        const bottomRightX = centerX + bottomRoadWidth / 2;

        // Draw dark asphalt road background using a trapezoid path
        ctx.fillStyle = '#12121c';
        ctx.beginPath();
        ctx.moveTo(topLeftX, horizonY);
        ctx.lineTo(topRightX, horizonY);
        ctx.lineTo(bottomRightX, bottomY);
        ctx.lineTo(bottomLeftX, bottomY);
        ctx.closePath();
        ctx.fill();

        // Draw glowing cyan neon borders following the perspective
        ctx.save();
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 4;

        // Left perspective border
        ctx.beginPath();
        ctx.moveTo(topLeftX, horizonY);
        ctx.lineTo(bottomLeftX, bottomY);
        ctx.stroke();

        // Right perspective border
        ctx.beginPath();
        ctx.moveTo(topRightX, horizonY);
        ctx.lineTo(bottomRightX, bottomY);
        ctx.stroke();
        ctx.restore();

        // Draw animated dashed center lane following the perspective
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;

        const totalSegments = 20;
        const segmentHeight = (bottomY - horizonY) / totalSegments;
        
        for (let i = 0; i < totalSegments; i++) {
            let progress = (i + (this.offsetY / 60)) % totalSegments;
            
            if (Math.floor(progress) % 2 === 0) {
                let y1 = horizonY + progress * segmentHeight;
                let y2 = horizonY + (progress + 0.6) * segmentHeight;

                if (y2 > bottomY) y2 = bottomY;

                let x1 = centerX;
                let x2 = centerX;

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }
        ctx.restore();
    }
}

/**
 * Player Car Controller & Renderer with PNG Sprite Support & Fallback
 */
class PlayerCar {
    constructor() {
        this.width = 70;
        this.height = 110;
        this.x = canvas.width / 2; // Spawn exactly in the center lane
        this.y = 0;
        
        this.vx = 0;
        this.acceleration = 0.8;
        this.friction = 0.85;
        this.maxSpeed = 10;

        // Input states
        this.keys = {
            left: false,
            right: false
        };

        this.setupListeners();
    }

    setupListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                this.keys.left = true;
            }
            if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                this.keys.right = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                this.keys.left = false;
            }
            if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                this.keys.right = false;
            }
        });
    }

    update(canvasWidth, canvasHeight) {
        // Position car near the bottom center of the road
        this.y = canvasHeight - this.height - 30;

        if (isNaN(this.x)) {
            this.x = canvasWidth / 2;
        }

        // Handle acceleration based on input
        if (this.keys.left) {
            this.vx -= this.acceleration;
        } else if (this.keys.right) {
            this.vx += this.acceleration;
        } else {
            this.vx *= this.friction;
        }

        // Clamp velocity to max speed
        if (this.vx > this.maxSpeed) this.vx = this.maxSpeed;
        if (this.vx < -this.maxSpeed) this.vx = -this.maxSpeed;

        if (Math.abs(this.vx) < 0.05) this.vx = 0;

        this.x += this.vx;

        // Keep the car strictly inside the road boundaries at the bottom width
        const bottomRoadWidth = canvasWidth * 0.55;
        const roadLeft = (canvasWidth - bottomRoadWidth) / 2;
        const roadRight = roadLeft + bottomRoadWidth;

        const margin = 15;
        if (this.x - this.width / 2 < roadLeft + margin) {
            this.x = roadLeft + margin + this.width / 2;
            this.vx = 0;
        }
        if (this.x + this.width / 2 > roadRight - margin) {
            this.x = roadRight - margin - this.width / 2;
            this.vx = 0;
        }
    }

    // Get bounding box for AABB collision detection
    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const tilt = this.vx * 0.015;
        ctx.rotate(tilt);

        if (playerImageLoaded) {
            ctx.drawImage(playerImage, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            // Fallback Canvas drawing
            ctx.fillStyle = '#ff0055';
            ctx.shadowColor = '#ff0055';
            ctx.shadowBlur = 10;

            ctx.beginPath();
            ctx.moveTo(-this.width / 2 + 10, 20);
            ctx.lineTo(-this.width / 2, -20);
            ctx.lineTo(-this.width / 4, -this.height / 2);
            ctx.lineTo(this.width / 4, -this.height / 2);
            ctx.lineTo(this.width / 2, -20);
            ctx.lineTo(this.width / 2 - 10, 20);
            ctx.closePath();
            ctx.fill();

            // Hood & Front Nose
            ctx.fillStyle = '#b3003b';
            ctx.beginPath();
            ctx.moveTo(-this.width / 4, -this.height / 2);
            ctx.lineTo(this.width / 4, -this.height / 2);
            ctx.lineTo(this.width / 3, -10);
            ctx.lineTo(-this.width / 3, -10);
            ctx.closePath();
            ctx.fill();

            // Windshield
            ctx.fillStyle = '#0b0b16';
            ctx.beginPath();
            ctx.moveTo(-this.width / 4 + 4, -this.height / 2 + 12);
            ctx.lineTo(this.width / 4 - 4, -this.height / 2 + 12);
            ctx.lineTo(this.width / 3 - 4, -5);
            ctx.lineTo(-this.width / 3 + 4, -5);
            ctx.closePath();
            ctx.fill();

            // Headlights
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#00f0ff';
            ctx.fillRect(-this.width / 2 + 6, -this.height / 2 + 2, 12, 4);
            ctx.fillRect(this.width / 2 - 18, -this.height / 2 + 2, 12, 4);

            // Taillights
            ctx.shadowColor = '#ff3300';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#ff3300';
            ctx.fillRect(-this.width / 2 + 4, this.height / 2 - 15, 14, 4);
            ctx.fillRect(this.width / 2 - 18, this.height / 2 - 15, 14, 4);

            // Wheels
            ctx.fillStyle = '#111111';
            ctx.shadowBlur = 0;
            ctx.fillRect(-this.width / 2 - 4, -this.height / 3, 6, 22);
            ctx.fillRect(this.width / 2 - 2, -this.height / 3, 6, 22);
            ctx.fillRect(-this.width / 2 - 4, this.height / 4, 6, 26);
            ctx.fillRect(this.width / 2 - 2, this.height / 4, 6, 26);
        }

        ctx.restore();
    }
}

/**
 * Individual Enemy Car Class
 */
class EnemyCar {
    constructor(lane, progress, speed) {
        this.lane = lane;           // 0: Left, 1: Center, 2: Right
        this.progress = progress;   // Progress along the perspective road (negative = above horizon)
        this.speed = speed;         // Natural movement speed
    }

    update(difficultyMultiplier = 1) {
        this.progress += this.speed * difficultyMultiplier;
    }

    getBounds(width, height) {
        const horizonY = height * 0.35;
        const bottomY = height;
        const centerX = width / 2;

        const topRoadWidth = width * 0.15;
        const bottomRoadWidth = width * 0.55;

        const y = horizonY + this.progress * (bottomY - horizonY);
        const currentRoadWidth = topRoadWidth + (bottomRoadWidth - topRoadWidth) * this.progress;
        const roadLeft = centerX - currentRoadWidth / 2;

        // Lane horizontal multipliers: 0.25 (left), 0.50 (center), 0.75 (right)
        const laneMultipliers = [0.25, 0.50, 0.75];
        const x = roadLeft + currentRoadWidth * laneMultipliers[this.lane];

        const baseWidth = 65;
        const baseHeight = 100;
        const scale = 0.30 + 0.70 * Math.max(0, this.progress);

        const carWidth = baseWidth * scale;
        const carHeight = baseHeight * scale;

        return {
            x: x - carWidth / 2,
            y: y - carHeight / 2,
            width: carWidth,
            height: carHeight
        };
    }

    draw(ctx, width, height) {
        const bounds = this.getBounds(width, height);

        ctx.save();
        ctx.translate(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);

        if (enemyImageLoaded) {
            ctx.drawImage(enemyImage, -bounds.width / 2, -bounds.height / 2, bounds.width, bounds.height);
        } else {
            // Fallback Canvas drawing
            const scale = 0.30 + 0.70 * Math.max(0, this.progress);
            ctx.fillStyle = '#ffaa00';
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 12 * scale;

            ctx.beginPath();
            ctx.moveTo(-bounds.width / 2 + 8 * scale, bounds.height / 2);
            ctx.lineTo(-bounds.width / 2, -bounds.height / 4);
            ctx.lineTo(-bounds.width / 4, -bounds.height / 2);
            ctx.lineTo(bounds.width / 4, -bounds.height / 2);
            ctx.lineTo(bounds.width / 2, -bounds.height / 4);
            ctx.lineTo(bounds.width / 2 - 8 * scale, bounds.height / 2);
            ctx.closePath();
            ctx.fill();

            // Windshield
            ctx.fillStyle = '#0b0b16';
            ctx.beginPath();
            ctx.moveTo(-bounds.width / 4 + 2, -bounds.height / 2 + 8 * scale);
            ctx.lineTo(bounds.width / 4 - 2, -bounds.height / 2 + 8 * scale);
            ctx.lineTo(bounds.width / 3 - 2, -2);
            ctx.lineTo(-bounds.width / 3 + 2, -2);
            ctx.closePath();
            ctx.fill();

            // Taillights
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 15 * scale;
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(-bounds.width / 2 + 4 * scale, bounds.height / 2 - 8 * scale, Math.max(4, 10 * scale), Math.max(2, 4 * scale));
            ctx.fillRect(bounds.width / 2 - 14 * scale, bounds.height / 2 - 8 * scale, Math.max(4, 10 * scale), Math.max(2, 4 * scale));
        }

        ctx.restore();
    }
}

/**
 * Professional EnemyManager Architecture managing traffic, spacing, and difficulty scaling
 */
class EnemyManager {
    constructor(targetCount = 5) {
        this.targetCount = targetCount;
        this.enemies = [];
        this.init();
    }

    init() {
        this.enemies = [];
        // Stagger initial enemies cleanly above and along the road to guarantee 3-5 active cars instantly
        const initialProgressValues = [-0.1, -0.45, -0.8, -1.15, -1.5];
        const lanes = [0, 1, 2, 0, 2];

        for (let i = 0; i < this.targetCount; i++) {
            const lane = lanes[i];
            const progress = initialProgressValues[i];
            const speed = 0.007 + Math.random() * 0.006;
            this.enemies.push(new EnemyCar(lane, progress, speed));
        }
    }

    update(difficultyMultiplier = 1) {
        for (let i = 0; i < this.enemies.length; i++) {
            let enemy = this.enemies[i];
            enemy.update(difficultyMultiplier);

            // When an enemy leaves the screen, respawn it safely above the horizon with no overlap
            if (enemy.progress > 1.1) {
                this.respawnEnemy(enemy);
            }
        }

        // Ensure no overlapping cars in the same lane near spawn zone
        this.preventOverlaps();
    }

    respawnEnemy(enemy) {
        const lanes = [0, 1, 2];
        let chosenLane = lanes[Math.floor(Math.random() * lanes.length)];
        
        // Find highest negative progress currently among enemies in this lane to maintain vertical separation
        let minProgress = -0.2;
        for (let other of this.enemies) {
            if (other !== enemy && other.lane === chosenLane) {
                if (other.progress < minProgress) {
                    minProgress = other.progress;
                }
            }
        }

        // Place new enemy well above the existing traffic in that lane
        enemy.lane = chosenLane;
        enemy.progress = minProgress - (0.35 + Math.random() * 0.4);
        enemy.speed = 0.007 + Math.random() * 0.006;
    }

    preventOverlaps() {
        for (let i = 0; i < this.enemies.length; i++) {
            for (let j = i + 1; j < this.enemies.length; j++) {
                let e1 = this.enemies[i];
                let e2 = this.enemies[j];

                if (e1.lane === e2.lane) {
                    // If they are too close vertically, push the higher one further back
                    if (Math.abs(e1.progress - e2.progress) < 0.3) {
                        if (e1.progress < e2.progress) {
                            e2.progress = e1.progress - 0.35;
                        } else {
                            e1.progress = e2.progress - 0.35;
                        }
                    }
                }
            }
        }
    }

    draw(ctx, width, height) {
        for (let i = 0; i < this.enemies.length; i++) {
            this.enemies[i].draw(ctx, width, height);
        }
    }

    checkCollisions(playerBounds, width, height) {
        for (let i = 0; i < this.enemies.length; i++) {
            let enemyBounds = this.enemies[i].getBounds(width, height);
            if (
                playerBounds.x < enemyBounds.x + enemyBounds.width &&
                playerBounds.x + playerBounds.width > enemyBounds.x &&
                playerBounds.y < enemyBounds.y + enemyBounds.height &&
                playerBounds.y + playerBounds.height > enemyBounds.y
            ) {
                return true;
            }
        }
        return false;
    }
}

// Initialize instances
const road = new CyberpunkRoad();
const playerCar = new PlayerCar();
const enemyManager = new EnemyManager(5);

/**
 * Standard 60 FPS Game Loop
 */
function gameLoop() {
    // Clear canvas
    ctx.fillStyle = '#0b0b16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate dynamic difficulty scaling based on score
    const currentDisplayScore = Math.floor(score / 10);
    const difficultyLevel = Math.floor(currentDisplayScore / 20);
    const difficultyMultiplier = 1 + (difficultyLevel * 0.15);

    // Update and render the perspective road with speed scaling
    road.update(difficultyMultiplier);
    road.draw(ctx, canvas.width, canvas.height);

    // Update and render all enemies via EnemyManager
    enemyManager.update(difficultyMultiplier);
    enemyManager.draw(ctx, canvas.width, canvas.height);

    // Update and render the player car
    playerCar.update(canvas.width, canvas.height);
    playerCar.draw(ctx);

    // Increment live score every frame while game is running (if not game over)
    if (!isGameOver) {
        score += 1;
    }

    // Display Score and Best Score in the top-right corner
    ctx.save();
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.fillText(`SCORE: ${currentDisplayScore}`, canvas.width - 30, 40);
    ctx.fillText(`BEST: ${Math.floor(bestScore / 10)}`, canvas.width - 30, 70);
    ctx.restore();

    // Check collisions with all enemies using EnemyManager
    if (!isGameOver) {
        const playerBounds = playerCar.getBounds();
        if (enemyManager.checkCollisions(playerBounds, canvas.width, canvas.height)) {
            isGameOver = true;

            // Save Best Score using localStorage
            if (score > bestScore) {
                bestScore = score;
                localStorage.setItem('luckyNitroBestScore', bestScore);
            }
        }
    }

    // If game over occurred, display message overlay
    if (isGameOver) {
        ctx.save();
        ctx.font = 'bold 64px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ff0033';
        ctx.shadowColor = '#ff0033';
        ctx.shadowBlur = 25;
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        ctx.restore();
    }

    // Maintain 60 FPS loop continuously
    requestAnimationFrame(gameLoop);
}

// Start the game loop
requestAnimationFrame(gameLoop);
