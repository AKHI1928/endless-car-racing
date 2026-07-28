/**
 * Lucky Nitro - Cyberpunk City Background, Road, Sports Cars & Traffic AI
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
 * Sky Class - Handles Night Sky, Stars, and Distant Fog
 */
class Sky {
    constructor() {
        this.stars = [];
        this.initStars();
    }

    initStars() {
        this.stars = [];
        for (let i = 0; i < 120; i++) {
            this.stars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * (window.innerHeight * 0.4),
                radius: Math.random() * 1.5 + 0.5,
                alpha: Math.random(),
                twinkleSpeed: Math.random() * 0.02 + 0.005
            });
        }
    }

    update() {
        // Subtle twinkling effect
        for (let star of this.stars) {
            star.alpha += star.twinkleSpeed;
            if (star.alpha > 1 || star.alpha < 0.2) {
                star.twinkleSpeed *= -1;
            }
        }
    }

    draw(ctx, width, height) {
        // Rich night sky vertical gradient
        const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.4);
        skyGradient.addColorStop(0, '#05020a');
        skyGradient.addColorStop(0.5, '#0b0b16');
        skyGradient.addColorStop(1, '#150c24');

        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height * 0.4);

        // Draw twinkling stars
        ctx.save();
        for (let star of this.stars) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, Math.min(1, star.alpha))})`;
            ctx.beginPath();
            ctx.arc(star.x % width, star.y, star.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

/**
 * Building Class - Represents an Individual Skyscraper in the City Skyline
 */
class Building {
    constructor(x, width, height, colorTheme) {
        this.x = x;
        this.width = width;
        this.height = height;
        this.colorTheme = colorTheme; // 'cyan', 'pink', or 'purple'
        this.windows = this.generateWindows();
        this.hasRooftopAntenna = Math.random() > 0.6;
        this.blinkingLightOffset = Math.random() * Math.PI * 2;
    }

    generateWindows() {
        const windows = [];
        const rows = Math.floor((this.height - 30) / 18);
        const cols = Math.max(2, Math.floor((this.width - 12) / 10));

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (Math.random() > 0.35) { // Active lit windows
                    windows.push({
                        x: 6 + c * 10,
                        y: 20 + r * 18,
                        w: 5,
                        h: 10
                    });
                }
            }
        }
        return windows;
    }

    draw(ctx, baseY) {
        const buildingY = baseY - this.height;

        ctx.save();
        ctx.translate(this.x, buildingY);

        // Building Silhouette Fill
        ctx.fillStyle = '#0d0814';
        ctx.fillRect(0, 0, this.width, this.height);

        // Neon outline/glow based on theme
        let neonColor = '#00f0ff';
        if (this.colorTheme === 'pink') neonColor = '#ff007f';
        if (this.colorTheme === 'purple') neonColor = '#9900ff';

        ctx.strokeStyle = neonColor;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = neonColor;
        ctx.shadowBlur = 8;
        ctx.strokeRect(0, 0, this.width, this.height);

        // Lit Windows
        ctx.fillStyle = neonColor;
        ctx.shadowBlur = 4;
        for (let win of this.windows) {
            ctx.fillRect(win.x, win.y, win.w, win.h);
        }

        // Rooftop antenna & blinking beacon
        if (this.hasRooftopAntenna) {
            ctx.strokeStyle = '#555577';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.width / 2, 0);
            ctx.lineTo(this.width / 2, -25);
            ctx.stroke();

            // Blinking rooftop warning light
            const blink = Math.sin(Date.now() * 0.005 + this.blinkingLightOffset);
            if (blink > 0) {
                ctx.fillStyle = '#ff0033';
                ctx.shadowColor = '#ff0033';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(this.width / 2, -25, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}

/**
 * CityBackground Class - Manages the Parallax Scrolling Cyberpunk Skyline
 */
class CityBackground {
    constructor() {
        this.buildings = [];
        this.offsetX = 0;
        this.speed = 0.5; // Very slow parallax scrolling speed
        this.initBuildings();
    }

    initBuildings() {
        this.buildings = [];
        let currentX = -100;
        const totalWidth = window.innerWidth + 400;

        while (currentX < totalWidth) {
            const width = Math.floor(Math.random() * 50) + 70; // Building width 70-120px
            const height = Math.floor(Math.random() * 140) + 90; // Building height 90-230px
            const themes = ['cyan', 'pink', 'purple'];
            const colorTheme = themes[Math.floor(Math.random() * themes.length)];

            this.buildings.push(new Building(currentX, width, height, colorTheme));
            currentX += width + Math.floor(Math.random() * 15) + 5; // Spacing between buildings
        }
    }

    update(speedMultiplier = 1) {
        this.offsetX += this.speed * speedMultiplier;

        // Infinite seamless loop wrapping
        const firstBuilding = this.buildings[0];
        if (firstBuilding && this.offsetX >= firstBuilding.width + 50) {
            this.offsetX = 0;
            // Shift first building to the end
            const shifted = this.buildings.shift();
            const lastBuilding = this.buildings[this.buildings.length - 1];
            shifted.x = lastBuilding.x + lastBuilding.width + Math.floor(Math.random() * 15) + 5;
            this.buildings.push(shifted);
        }
    }

    draw(ctx, width, height) {
        const horizonY = height * 0.35;

        ctx.save();
        // Apply parallax offset translation
        ctx.translate(-this.offsetX, 0);

        for (let building of this.buildings) {
            building.draw(ctx, horizonY);
        }

        ctx.restore();

        // Soft atmospheric fog gradient near the horizon
        const fogGradient = ctx.createLinearGradient(0, horizonY - 40, 0, horizonY + 20);
        fogGradient.addColorStop(0, 'rgba(11, 11, 22, 0)');
        fogGradient.addColorStop(1, 'rgba(11, 11, 22, 0.85)');

        ctx.fillStyle = fogGradient;
        ctx.fillRect(0, horizonY - 40, width, 60);
    }
}

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
 * Player Car Controller & Renderer with Professional Cyberpunk Sports Car Design
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
            // Professional Cyberpunk Sports Car Design (Pink / Magenta Theme)
            const w = this.width;
            const h = this.height;

            // Drop shadow & glow
            ctx.shadowColor = '#ff007f';
            ctx.shadowBlur = 18;

            // Detailed Body Shape (Sleek aerodynamic curves)
            ctx.fillStyle = '#ff007f'; // Primary Pink / Magenta
            ctx.beginPath();
            ctx.moveTo(-w / 2 + 12, h / 2 - 10);
            ctx.lineTo(-w / 2 + 4, -10);
            ctx.lineTo(-w / 2 + 10, -h / 2 + 25);
            ctx.lineTo(-w / 4, -h / 2);
            ctx.lineTo(w / 4, -h / 2);
            ctx.lineTo(w / 2 - 10, -h / 2 + 25);
            ctx.lineTo(w / 2 - 4, -10);
            ctx.lineTo(w / 2 - 12, h / 2 - 10);
            ctx.closePath();
            ctx.fill();

            // Hood / Body Highlights & Aerodynamic Panels
            ctx.fillStyle = '#cc0066';
            ctx.beginPath();
            ctx.moveTo(-w / 4, -h / 2 + 15);
            ctx.lineTo(w / 4, -h / 2 + 15);
            ctx.lineTo(w / 3, 0);
            ctx.lineTo(-w / 3, 0);
            ctx.closePath();
            ctx.fill();

            // Dark Windshield Cockpit
            ctx.fillStyle = '#0b0b16';
            ctx.beginPath();
            ctx.moveTo(-w / 4 + 4, -h / 2 + 22);
            ctx.lineTo(w / 4 - 4, -h / 2 + 22);
            ctx.lineTo(w / 3 - 6, -5);
            ctx.lineTo(-w / 3 + 6, -5);
            ctx.closePath();
            ctx.fill();

            // Windshield Reflection / Tint line
            ctx.strokeStyle = '#ff66b2';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-w / 4 + 8, -h / 2 + 26);
            ctx.lineTo(w / 4 - 8, -h / 2 + 26);
            ctx.stroke();

            // Wheels with detailed rims
            ctx.fillStyle = '#111116';
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2;
            
            // Front Left Wheel
            ctx.fillRect(-w / 2 - 5, -h / 3, 7, 24);
            ctx.strokeRect(-w / 2 - 5, -h / 3, 7, 24);
            // Front Right Wheel
            ctx.fillRect(w / 2 - 2, -h / 3, 7, 24);
            ctx.strokeRect(w / 2 - 2, -h / 3, 7, 24);
            // Rear Left Wheel
            ctx.fillRect(-w / 2 - 5, h / 4, 7, 28);
            ctx.strokeRect(-w / 2 - 5, h / 4, 7, 28);
            // Rear Right Wheel
            ctx.fillRect(w / 2 - 2, h / 4, 7, 28);
            ctx.strokeRect(w / 2 - 2, h / 4, 7, 28);

            // Neon Headlights (Cyan Glow)
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#00f0ff';
            ctx.fillRect(-w / 2 + 6, -h / 2 + 4, 12, 5);
            ctx.fillRect(w / 2 - 18, -h / 2 + 4, 12, 5);

            // Neon Taillights (Intense Red Glow)
            ctx.shadowColor = '#ff0033';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#ff0033';
            ctx.fillRect(-w / 2 + 5, h / 2 - 14, 14, 5);
            ctx.fillRect(w / 2 - 19, h / 2 - 14, 14, 5);
        }

        ctx.restore();
    }
}

/**
 * Individual Enemy Car Class with Strict Horizon Clipping & Detailed Cyberpunk Sports Car Design
 */
class EnemyCar {
    constructor(lane, progress, speed, color = '#ffcc00') {
        this.lane = lane;           // 0: Left, 1: Center, 2: Right
        this.progress = progress;   // Progress along road (negative = above horizon)
        this.speed = speed;         // Randomized speed tier (slow, medium, fast)
        this.color = color;         // Random color theme (yellow, blue, green, red, white)
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
        // Never render or draw enemy cars above the horizon
        if (this.progress < 0) {
            return;
        }

        const bounds = this.getBounds(width, height);
        const scale = 0.30 + 0.70 * this.progress;

        ctx.save();
        ctx.translate(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);

        if (enemyImageLoaded) {
            ctx.drawImage(enemyImage, -bounds.width / 2, -bounds.height / 2, bounds.width, bounds.height);
        } else {
            // Professional Cyberpunk Sports Car Design for Enemies
            const bw = bounds.width;
            const bh = bounds.height;

            // Glow and shadows scaled with perspective
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 14 * scale;

            // Detailed Body Shape
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(-bw / 2 + 10 * scale, bh / 2 - 8 * scale);
            ctx.lineTo(-bw / 2 + 4 * scale, -5 * scale);
            ctx.lineTo(-bw / 4, -bh / 2 + 15 * scale);
            ctx.lineTo(bw / 4, -bh / 2 + 15 * scale);
            ctx.lineTo(bw / 2 - 4 * scale, -5 * scale);
            ctx.lineTo(bw / 2 - 10 * scale, bh / 2 - 8 * scale);
            ctx.closePath();
            ctx.fill();

            // Dark Windshield Cockpit
            ctx.fillStyle = '#0b0b16';
            ctx.beginPath();
            ctx.moveTo(-bw / 4 + 2, -bh / 2 + 20 * scale);
            ctx.lineTo(bw / 4 - 2, -bh / 2 + 20 * scale);
            ctx.lineTo(bw / 3 - 4, -2);
            ctx.lineTo(-bw / 3 + 4, -2);
            ctx.closePath();
            ctx.fill();

            // Detailed Wheels
            ctx.fillStyle = '#111116';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = Math.max(1, 1.5 * scale);

            const wheelW = Math.max(3, 6 * scale);
            const wheelH = Math.max(12, 22 * scale);

            // Front Left Wheel
            ctx.fillRect(-bw / 2 - wheelW / 2, -bh / 3, wheelW, wheelH);
            ctx.strokeRect(-bw / 2 - wheelW / 2, -bh / 3, wheelW, wheelH);
            // Front Right Wheel
            ctx.fillRect(bw / 2 - wheelW / 2, -bh / 3, wheelW, wheelH);
            ctx.strokeRect(bw / 2 - wheelW / 2, -bh / 3, wheelW, wheelH);
            // Rear Left Wheel
            ctx.fillRect(-bw / 2 - wheelW / 2, bh / 6, wheelW, wheelH + 4 * scale);
            ctx.strokeRect(-bw / 2 - wheelW / 2, bh / 6, wheelW, wheelH + 4 * scale);
            // Rear Right Wheel
            ctx.fillRect(bw / 2 - wheelW / 2, bh / 6, wheelW, wheelH + 4 * scale);
            ctx.strokeRect(bw / 2 - wheelW / 2, bh / 6, wheelW, wheelH + 4 * scale);

            // Neon Headlights
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 10 * scale;
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(-bw / 2 + 4 * scale, -bh / 2 + 10 * scale, Math.max(3, 10 * scale), Math.max(2, 4 * scale));
            ctx.fillRect(bw / 2 - 14 * scale, -bh / 2 + 10 * scale, Math.max(3, 10 * scale), Math.max(2, 4 * scale));

            // Neon Taillights
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 12 * scale;
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(-bw / 2 + 4 * scale, bh / 2 - 10 * scale, Math.max(3, 10 * scale), Math.max(2, 4 * scale));
            ctx.fillRect(bw / 2 - 14 * scale, bh / 2 - 10 * scale, Math.max(3, 10 * scale), Math.max(2, 4 * scale));
        }

        ctx.restore();
    }
}

/**
 * Professional Traffic AI & EnemyManager Architecture
 */
class EnemyManager {
    constructor() {
        this.enemies = [];
        this.spawnTimer = 0;
        this.init();
    }

    getRandomColor() {
        const colors = ['#ffcc00', '#00f0ff', '#00ff66', '#ff0033', '#ffffff'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    init() {
        this.enemies = [];
        const initialLanes = [0, 1, 2, 0, 2];
        const initialProgress = [-0.1, -0.5, -0.9, -1.3, -1.7];

        for (let i = 0; i < 5; i++) {
            const lane = initialLanes[i];
            const progress = initialProgress[i];
            const speed = this.getRandomSpeed();
            const color = this.getRandomColor();
            this.enemies.push(new EnemyCar(lane, progress, speed, color));
        }
    }

    getRandomSpeed() {
        const speedTiers = [0.005, 0.008, 0.011];
        return speedTiers[Math.floor(Math.random() * speedTiers.length)];
    }

    update(difficultyMultiplier = 1) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let enemy = this.enemies[i];
            enemy.update(difficultyMultiplier);

            if (enemy.progress > 1.2) {
                this.enemies.splice(i, 1);
            }
        }

        this.spawnTimer++;
        const currentDisplayScore = Math.floor(score / 10);
        const difficultyLevel = Math.floor(currentDisplayScore / 20);
        
        const spawnInterval = Math.max(45, 90 - (difficultyLevel * 8));
        const maxConcurrentCars = Math.min(8, 5 + Math.floor(difficultyLevel / 2));

        if (this.spawnTimer >= spawnInterval && this.enemies.length < maxConcurrentCars) {
            this.spawnTimer = 0;
            this.trySpawnCar();
        }

        this.preventLaneOverlaps();
    }

    trySpawnCar() {
        const availableLanes = [0, 1, 2];
        availableLanes.sort(() => Math.random() - 0.5);

        let chosenLane = -1;

        for (let lane of availableLanes) {
            let laneOccupied = false;
            for (let enemy of this.enemies) {
                if (enemy.lane === lane && enemy.progress < 0.2 && enemy.progress > -0.5) {
                    laneOccupied = true;
                    break;
                }
            }

            if (!laneOccupied) {
                chosenLane = lane;
                break;
            }
        }

        if (chosenLane !== -1) {
            const speed = this.getRandomSpeed();
            const color = this.getRandomColor();
            this.enemies.push(new EnemyCar(chosenLane, 0, speed, color));
        }
    }

    preventLaneOverlaps() {
        for (let i = 0; i < this.enemies.length; i++) {
            for (let j = i + 1; j < this.enemies.length; j++) {
                let e1 = this.enemies[i];
                let e2 = this.enemies[j];

                if (e1.lane === e2.lane) {
                    const minDistance = 0.35;
                    if (Math.abs(e1.progress - e2.progress) < minDistance) {
                        if (e1.progress < e2.progress) {
                            e2.progress = e1.progress + minDistance;
                        } else {
                            e1.progress = e2.progress + minDistance;
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
            if (this.enemies[i].progress < 0) continue;

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
const sky = new Sky();
const cityBackground = new CityBackground();
const road = new CyberpunkRoad();
const playerCar = new PlayerCar();
const enemyManager = new EnemyManager();

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

    // 1. Draw Night Sky and Stars (Static / Fixed)
    sky.update();
    sky.draw(ctx, canvas.width, canvas.height);

    // 2. Draw Animated Cyberpunk City Background (Parallax scrolling slower than road)
    cityBackground.update(difficultyMultiplier);
    cityBackground.draw(ctx, canvas.width, canvas.height);

    // 3. Draw Perspective Road (Drawn BEFORE cars, AFTER city)
    road.update(difficultyMultiplier);
    road.draw(ctx, canvas.width, canvas.height);

    // 4. Update and render all enemies via EnemyManager traffic AI
    enemyManager.update(difficultyMultiplier);
    enemyManager.draw(ctx, canvas.width, canvas.height);

    // 5. Update and render the player car
    playerCar.update(canvas.width, canvas.height);
    playerCar.draw(ctx);

    // Increment live score every frame while game is running
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

    // Check collisions with all active visible enemies using EnemyManager
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
