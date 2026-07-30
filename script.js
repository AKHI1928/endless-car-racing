/**
 * Lucky Nitro - Cyberpunk City Background, Upgraded Speed Road, Sports Cars, Traffic AI, Nitro Boost,
 * Coin Collection & Garage System
 * script.js
 */

// Use the existing canvas from index.html
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game state flags & scoring variables
let isGameOver = false;
let score = 0;
let bestScore = parseInt(localStorage.getItem('luckyNitroBestScore')) || 0;

// Coin collection state variables
let coinsCount = parseInt(localStorage.getItem('luckyNitroCoins')) || 0;
let floatingTexts = [];

// Coin Sound
const coinSound = new Audio("assets/audio/coin.mp3");
coinSound.volume = 0.6;
const crashSound = new Audio("assets/audio/crash.mp3");
crashSound.volume = 0.8;
const engineSound = new Audio("assets/audio/engine.mp3");
engineSound.loop = true;
engineSound.volume = 0.3;
// Game over animation & state variables
let crashTimer = 0;
let playerCrashAngle = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 20 + 20) * (Math.PI / 180);
let playerCrashBackward = 0;
let smokeParticles = [];
let isFlashingRed = true;
let flashTimer = 0;

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
        for (let star of this.stars) {
            star.alpha += star.twinkleSpeed;
            if (star.alpha > 1 || star.alpha < 0.2) {
                star.twinkleSpeed *= -1;
            }
        }
    }

    draw(ctx, width, height) {
        const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.4);
        skyGradient.addColorStop(0, '#05020a');
        skyGradient.addColorStop(0.5, '#0b0b16');
        skyGradient.addColorStop(1, '#150c24');

        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height * 0.4);

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
        this.colorTheme = colorTheme;
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
                if (Math.random() > 0.35) {
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

        ctx.fillStyle = '#0d0814';
        ctx.fillRect(0, 0, this.width, this.height);

        let neonColor = '#00f0ff';
        if (this.colorTheme === 'pink') neonColor = '#ff007f';
        if (this.colorTheme === 'purple') neonColor = '#9900ff';

        ctx.strokeStyle = neonColor;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = neonColor;
        ctx.shadowBlur = 8;
        ctx.strokeRect(0, 0, this.width, this.height);

        ctx.fillStyle = neonColor;
        ctx.shadowBlur = 4;
        for (let win of this.windows) {
            ctx.fillRect(win.x, win.y, win.w, win.h);
        }

        if (this.hasRooftopAntenna) {
            ctx.strokeStyle = '#555577';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.width / 2, 0);
            ctx.lineTo(this.width / 2, -25);
            ctx.stroke();

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
        this.speed = 0.5;
        this.initBuildings();
    }

    initBuildings() {
        this.buildings = [];
        let currentX = -100;
        const totalWidth = window.innerWidth + 400;

        while (currentX < totalWidth) {
            const width = Math.floor(Math.random() * 50) + 70;
            const height = Math.floor(Math.random() * 140) + 90;
            const themes = ['cyan', 'pink', 'purple'];
            const colorTheme = themes[Math.floor(Math.random() * themes.length)];

            this.buildings.push(new Building(currentX, width, height, colorTheme));
            currentX += width + Math.floor(Math.random() * 15) + 5;
        }
    }

    update(speedMultiplier = 1) {
        this.offsetX += this.speed * speedMultiplier;

        const firstBuilding = this.buildings[0];
        if (firstBuilding && this.offsetX >= firstBuilding.width + 50) {
            this.offsetX = 0;
            const shifted = this.buildings.shift();
            const lastBuilding = this.buildings[this.buildings.length - 1];
            shifted.x = lastBuilding.x + lastBuilding.width + Math.floor(Math.random() * 15) + 5;
            this.buildings.push(shifted);
        }
    }

    draw(ctx, width, height) {
        const horizonY = height * 0.35;

        ctx.save();
        ctx.translate(-this.offsetX, 0);

        for (let building of this.buildings) {
            building.draw(ctx, horizonY);
        }

        ctx.restore();

        const fogGradient = ctx.createLinearGradient(0, horizonY - 40, 0, horizonY + 20);
        fogGradient.addColorStop(0, 'rgba(11, 11, 22, 0)');
        fogGradient.addColorStop(1, 'rgba(11, 11, 22, 0.85)');

        ctx.fillStyle = fogGradient;
        ctx.fillRect(0, horizonY - 40, width, 60);
    }
}

/**
 * Upgraded Cyberpunk Speed Road Renderer with Professional Effects & Cyan Speed Lines
 */
class CyberpunkRoad {
    constructor() {
        this.offsetY = 0;
        this.baseSpeed = 8;
        this.speedStreaks = [];
        this.particles = [];
        this.initSpeedElements();
    }

    initSpeedElements() {
        for (let i = 0; i < 35; i++) {
            this.speedStreaks.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                length: Math.random() * 50 + 30,
                speed: Math.random() * 15 + 10,
                alpha: Math.random() * 0.6 + 0.2
            });
        }

        for (let i = 0; i < 15; i++) {
            this.particles.push({
                progress: Math.random(),
                side: Math.random() > 0.5 ? 'left' : 'right',
                speed: Math.random() * 0.02 + 0.01
            });
        }
    }

    update(speedMultiplier = 1) {
        this.offsetY += this.baseSpeed * speedMultiplier;
        if (this.offsetY >= 60) {
            this.offsetY = 0;
        }

        for (let streak of this.speedStreaks) {
            streak.y += streak.speed * speedMultiplier;
            if (streak.y > window.innerHeight) {
                streak.y = -50;
                streak.x = Math.random() * window.innerWidth;
            }
        }

        for (let p of this.particles) {
            p.progress += p.speed * speedMultiplier;
            if (p.progress > 1) {
                p.progress = 0;
                p.side = Math.random() > 0.5 ? 'left' : 'right';
            }
        }
    }

    draw(ctx, width, height, speedMultiplier = 1, isNitroActive = false) {
        const topRoadWidth = width * 0.15;   
        const bottomRoadWidth = width * 0.55; 
        const horizonY = height * 0.35;       
        const bottomY = height;              

        const centerX = width / 2;

        const topLeftX = centerX - topRoadWidth / 2;
        const topRightX = centerX + topRoadWidth / 2;
        const bottomLeftX = centerX - bottomRoadWidth / 2;
        const bottomRightX = centerX + bottomRoadWidth / 2;

        const roadGradient = ctx.createLinearGradient(centerX, horizonY, centerX, bottomY);
        roadGradient.addColorStop(0, '#0a0a12');
        roadGradient.addColorStop(0.5, '#12121c');
        roadGradient.addColorStop(1, '#181824');

        ctx.fillStyle = roadGradient;
        ctx.beginPath();
        ctx.moveTo(topLeftX, horizonY);
        ctx.lineTo(topRightX, horizonY);
        ctx.lineTo(bottomRightX, bottomY);
        ctx.lineTo(bottomLeftX, bottomY);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 240, 255, 0.03)';
        ctx.beginPath();
        ctx.moveTo(centerX, horizonY);
        ctx.lineTo(bottomRightX, bottomY);
        ctx.lineTo(bottomLeftX, bottomY);
        ctx.closePath();
        ctx.fill();

        const glowIntensity = isNitroActive ? 25 : (10 + (speedMultiplier * 5));
        ctx.save();
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = glowIntensity;
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = isNitroActive ? 7 : 5;

        ctx.beginPath();
        ctx.moveTo(topLeftX, horizonY);
        ctx.lineTo(bottomLeftX, bottomY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(topRightX, horizonY);
        ctx.lineTo(bottomRightX, bottomY);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.moveTo(topLeftX + 3, horizonY);
        ctx.lineTo(bottomLeftX + 8, bottomY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(topRightX - 3, horizonY);
        ctx.lineTo(bottomRightX - 8, bottomY);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 12;

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

        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        for (let p of this.particles) {
            let py = horizonY + p.progress * (bottomY - horizonY);
            let currentRoadWidth = topRoadWidth + (bottomRoadWidth - topRoadWidth) * p.progress;
            let roadLeft = centerX - currentRoadWidth / 2;
            let px = p.side === 'left' ? roadLeft + 4 : roadLeft + currentRoadWidth - 4;

            ctx.beginPath();
            ctx.arc(px, py, 2.5 * (0.5 + 0.5 * p.progress), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = isNitroActive ? 'rgba(0, 240, 255, 0.8)' : 'rgba(0, 240, 255, 0.35)';
        ctx.lineWidth = isNitroActive ? 2.5 : 1.5;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = isNitroActive ? 12 : 4;
        for (let streak of this.speedStreaks) {
            ctx.beginPath();
            ctx.moveTo(streak.x, streak.y);
            ctx.lineTo(streak.x, streak.y + (isNitroActive ? streak.length * 1.5 : streak.length));
            ctx.stroke();
        }
        ctx.restore();
    }
}

/**
 * Player Car Controller & Renderer with Professional Cyberpunk Sports Car Design & Nitro Boost System
 */
class PlayerCar {
    constructor() {
        this.width = 70;
        this.height = 110;
        this.x = canvas.width / 2;
        this.y = 0;
        
        this.vx = 0;
        this.acceleration = 0.8;
        this.friction = 0.85;
        this.maxSpeed = 10;

        this.nitroMeter = 100;
        this.isNitroActive = false;
        this.nitroKeyHeld = false;
        this.mobileNitroPressed = false;
        this.nitroTimer = 0;
        this.maxNitroFrames = 300;

        this.keys = {
            left: false,
            right: false
        };

        this.setupListeners();
        this.setupMobileControls();
    }

    reset() {
        this.x = canvas.width / 2;
        this.vx = 0;
        this.nitroMeter = 100;
        this.isNitroActive = false;
        this.nitroKeyHeld = false;
        this.mobileNitroPressed = false;
        this.nitroTimer = 0;
        this.keys.left = false;
        this.keys.right = false;
    }

    setupListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                this.keys.left = true;
            }
            if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                this.keys.right = true;
            }
            if (e.code === 'Space') {
                e.preventDefault();
                this.nitroKeyHeld = true;
                this.tryActivateNitro();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                this.keys.left = false;
            }
            if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                this.keys.right = false;
            }
            if (e.code === 'Space') {
                this.nitroKeyHeld = false;
            }
        });
    }

    tryActivateNitro() {
        if (!isGameOver && this.nitroMeter > 0 && !this.isNitroActive) {
            this.isNitroActive = true;
            this.nitroTimer = this.maxNitroFrames;
        }
    }

    setupMobileControls() {
        const nitroBtn = document.createElement('div');
        nitroBtn.id = 'mobileNitroBtn';
        nitroBtn.innerHTML = 'NITRO (SPACE)';
        nitroBtn.style.position = 'fixed';
        nitroBtn.style.bottom = '30px';
        nitroBtn.style.right = '30px';
        nitroBtn.style.padding = '15px 25px';
        nitroBtn.style.background = 'linear-gradient(135deg, #00f0ff, #ff007f)';
        nitroBtn.style.color = '#ffffff';
        nitroBtn.style.fontFamily = 'sans-serif';
        nitroBtn.style.fontWeight = 'bold';
        nitroBtn.style.fontSize = '18px';
        nitroBtn.style.borderRadius = '12px';
        nitroBtn.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.6)';
        nitroBtn.style.zIndex = '1000';
        nitroBtn.style.cursor = 'pointer';
        nitroBtn.style.userSelect = 'none';
        nitroBtn.style.webkitUserSelect = 'none';

        document.body.appendChild(nitroBtn);

        const handleMobileNitro = (e) => {
            e.preventDefault();
            this.mobileNitroPressed = true;
            this.tryActivateNitro();
        };

        nitroBtn.addEventListener('touchstart', handleMobileNitro);
        nitroBtn.addEventListener('mousedown', handleMobileNitro);

        nitroBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.mobileNitroPressed = false;
        });
        nitroBtn.addEventListener('mouseup', () => {
            this.mobileNitroPressed = false;
        });
    }

    update(canvasWidth, canvasHeight) {
        this.y = canvasHeight - this.height - 30;

        if (isNaN(this.x)) {
            this.x = canvasWidth / 2;
        }

        if (this.isNitroActive && !isGameOver) {
            this.nitroTimer--;
            this.nitroMeter = Math.max(0, (this.nitroTimer / this.maxNitroFrames) * 100);

            if (this.nitroTimer <= 0 || this.nitroMeter <= 0) {
                this.isNitroActive = false;
                this.nitroTimer = 0;
            }
        } else {
            if (this.nitroMeter < 100 && !isGameOver) {
                this.nitroMeter += 0.25;
                if (this.nitroMeter > 100) this.nitroMeter = 100;
            }
        }

        if (this.keys.left) {
            this.vx -= this.acceleration;
        } else if (this.keys.right) {
            this.vx += this.acceleration;
        } else {
            this.vx *= this.friction;
        }

        const currentMaxSpeed = this.isNitroActive ? this.maxSpeed * 1.6 : this.maxSpeed;
        if (this.vx > currentMaxSpeed) this.vx = currentMaxSpeed;
        if (this.vx < -currentMaxSpeed) this.vx = -currentMaxSpeed;

        if (Math.abs(this.vx) < 0.05) this.vx = 0;

        this.x += this.vx;

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

        let renderY = this.y;
        let renderAngle = this.vx * 0.015;

        if (isGameOver) {
            renderY += playerCrashBackward;
            renderAngle = playerCrashAngle;
        }

        ctx.translate(this.x, renderY);
        ctx.rotate(renderAngle);

        if (isGameOver && isFlashingRed) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 30;
        }

        if (this.isNitroActive && !isGameOver) {
            ctx.save();
            ctx.shadowColor = '#0088ff';
            ctx.shadowBlur = 30;
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.moveTo(-18, this.height / 2);
            ctx.lineTo(0, this.height / 2 + 50 + Math.random() * 20);
            ctx.lineTo(18, this.height / 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        const w = this.width;
        const h = this.height;

        // Determine car color theme based on selected car in garage
        const selectedCar = localStorage.getItem('luckyNitroSelectedCar') || 'Pink Car';
        let primaryColor = '#ff007f';
        let darkColor = '#99004d';

        if (selectedCar === 'Blue Car') {
            primaryColor = '#00f0ff';
            darkColor = '#005599';
        } else if (selectedCar === 'Green Car') {
            primaryColor = '#00ff66';
            darkColor = '#006622';
        } else if (selectedCar === 'Red Car') {
            primaryColor = '#ff0033';
            darkColor = '#990011';
        } else if (selectedCar === 'Gold Car') {
            primaryColor = '#ffcc00';
            darkColor = '#997700';
        }

        ctx.shadowColor = (isGameOver && isFlashingRed) ? '#ff0000' : (this.isNitroActive ? '#00f0ff' : primaryColor);
        ctx.shadowBlur = this.isNitroActive ? 35 : 20;

        const bodyGrad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
        bodyGrad.addColorStop(0, darkColor);
        bodyGrad.addColorStop(0.5, primaryColor);
        bodyGrad.addColorStop(1, darkColor);

        ctx.fillStyle = (isGameOver && isFlashingRed) ? '#cc0000' : bodyGrad;
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

        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.moveTo(-w / 4, -h / 2 + 15);
        ctx.lineTo(w / 4, -h / 2 + 15);
        ctx.lineTo(w / 3, 0);
        ctx.lineTo(-w / 3, 0);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#05050a';
        ctx.beginPath();
        ctx.moveTo(-w / 4 + 4, -h / 2 + 22);
        ctx.lineTo(w / 4 - 4, -h / 2 + 22);
        ctx.lineTo(w / 3 - 6, -5);
        ctx.lineTo(-w / 3 + 6, -5);
        ctx.closePath();
        ctx.fill();

        ctx.save();
        ctx.strokeStyle = primaryColor;
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-w / 4 + 8, -h / 2 + 26);
        ctx.lineTo(w / 4 - 8, -h / 2 + 26);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#111116';
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 10;
        
        ctx.fillRect(-w / 2 - 5, -h / 3, 7, 24);
        ctx.strokeRect(-w / 2 - 5, -h / 3, 7, 24);
        ctx.fillRect(w / 2 - 2, -h / 3, 7, 24);
        ctx.strokeRect(w / 2 - 2, -h / 3, 7, 24);
        ctx.fillRect(-w / 2 - 5, h / 4, 7, 28);
        ctx.strokeRect(-w / 2 - 5, h / 4, 7, 28);
        ctx.fillRect(w / 2 - 2, h / 4, 7, 28);
        ctx.strokeRect(w / 2 - 2, h / 4, 7, 28);

        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 18;
        ctx.fillStyle = primaryColor;
        ctx.fillRect(-w / 2 + 6, -h / 2 + 4, 12, 5);
        ctx.fillRect(w / 2 - 18, -h / 2 + 4, 12, 5);

        ctx.shadowColor = '#ff0033';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#ff0033';
        ctx.fillRect(-w / 2 + 5, h / 2 - 14, 14, 5);
        ctx.fillRect(w / 2 - 19, h / 2 - 14, 14, 5);

        ctx.restore();
    }
}

/**
 * Individual Enemy Car Class with 8 Random Colors & Perspective Scaling
 */
class EnemyCar {
    constructor(lane, progress, speed, color) {
        this.lane = lane;
        this.progress = progress;
        this.speed = speed;
        this.color = color;
    }

    update(difficultyMultiplier = 1) {
        if (!isGameOver) {
            this.progress += this.speed * difficultyMultiplier;
        }
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
        if (this.progress < 0) {
            return;
        }

        const bounds = this.getBounds(width, height);
        const scale = 0.30 + 0.70 * this.progress;

        ctx.save();
        ctx.translate(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);

        const bw = bounds.width;
        const bh = bounds.height;

        ctx.shadowColor = this.color;
        ctx.shadowBlur = 16 * scale;

        const bodyGrad = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
        bodyGrad.addColorStop(0, '#111111');
        bodyGrad.addColorStop(0.5, this.color);
        bodyGrad.addColorStop(1, '#111111');

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.moveTo(-bw / 2 + 10 * scale, bh / 2 - 8 * scale);
        ctx.lineTo(-bw / 2 + 4 * scale, -5 * scale);
        ctx.lineTo(-bw / 4, -bh / 2 + 15 * scale);
        ctx.lineTo(bw / 4, -bh / 2 + 15 * scale);
        ctx.lineTo(bw / 2 - 4 * scale, -5 * scale);
        ctx.lineTo(bw / 2 - 10 * scale, bh / 2 - 8 * scale);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#05050a';
        ctx.beginPath();
        ctx.moveTo(-bw / 4 + 2, -bh / 2 + 20 * scale);
        ctx.lineTo(bw / 4 - 2, -bh / 2 + 20 * scale);
        ctx.lineTo(bw / 3 - 4, -2);
        ctx.lineTo(-bw / 3 + 4, -2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1, 1.5 * scale);
        ctx.beginPath();
        ctx.moveTo(-bw / 6, -bh / 2 + 24 * scale);
        ctx.lineTo(bw / 6, -bh / 2 + 24 * scale);
        ctx.stroke();

        ctx.fillStyle = '#111116';
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = Math.max(1, 1.5 * scale);

        const wheelW = Math.max(3, 6 * scale);
        const wheelH = Math.max(12, 22 * scale);

        ctx.fillRect(-bw / 2 - wheelW / 2, -bh / 3, wheelW, wheelH);
        ctx.strokeRect(-bw / 2 - wheelW / 2, -bh / 3, wheelW, wheelH);
        ctx.fillRect(bw / 2 - wheelW / 2, -bh / 3, wheelW, wheelH);
        ctx.strokeRect(bw / 2 - wheelW / 2, -bh / 3, wheelW, wheelH);
        ctx.fillRect(-bw / 2 - wheelW / 2, bh / 6, wheelW, wheelH + 4 * scale);
        ctx.strokeRect(-bw / 2 - wheelW / 2, bh / 6, wheelW, wheelH + 4 * scale);
        ctx.fillRect(bw / 2 - wheelW / 2, bh / 6, wheelW, wheelH + 4 * scale);
        ctx.strokeRect(bw / 2 - wheelW / 2, bh / 6, wheelW, wheelH + 4 * scale);

        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10 * scale;
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(-bw / 2 + 4 * scale, -bh / 2 + 10 * scale, Math.max(3, 10 * scale), Math.max(2, 4 * scale));
        ctx.fillRect(bw / 2 - 14 * scale, -bh / 2 + 10 * scale, Math.max(3, 10 * scale), Math.max(2, 4 * scale));

        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 12 * scale;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-bw / 2 + 4 * scale, bh / 2 - 10 * scale, Math.max(3, 10 * scale), Math.max(2, 4 * scale));
        ctx.fillRect(bw / 2 - 14 * scale, bh / 2 - 10 * scale, Math.max(3, 10 * scale), Math.max(2, 4 * scale));

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

    reset() {
        this.enemies = [];
        this.spawnTimer = 0;
        this.init();
    }

    getRandomColor() {
        const colors = [
            '#ffcc00',
            '#00ff66',
            '#00f0ff',
            '#9900ff',
            '#ff6600',
            '#ffffff',
            '#ff0033',
            '#00ffff'
        ];
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

            if (!isGameOver && enemy.progress > 1.2) {
                this.enemies.splice(i, 1);
            }
        }

        if (!isGameOver) {
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

/**
 * Coin Class & CoinManager Architecture for Coin Collection
 */
class Coin {
    constructor(lane, progress, speed) {
        this.lane = lane; // 0: Left, 1: Center, 2: Right
        this.progress = progress; // Negative = above horizon
        this.speed = speed;
        this.spinAngle = Math.random() * Math.PI * 2;
        this.spinSpeed = 0.1;
        this.collected = false;
    }

    update(difficultyMultiplier = 1) {
        if (!isGameOver) {
            this.progress += this.speed * difficultyMultiplier;
            this.spinAngle += this.spinSpeed;
        }
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

        const baseSize = 35;
        const scale = 0.30 + 0.70 * Math.max(0, this.progress);
        const size = baseSize * scale;

        return {
            x: x - size / 2,
            y: y - size / 2,
            width: size,
            height: size
        };
    }

    draw(ctx, width, height) {
        if (this.progress < 0 || this.collected) return;

        const bounds = this.getBounds(width, height);
        const scale = 0.30 + 0.70 * this.progress;

        ctx.save();
        ctx.translate(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);

        // Apply 3D spinning effect via horizontal scaling (cosine of spinAngle)
        const spinScaleX = Math.cos(this.spinAngle);

        ctx.scale(spinScaleX, 1);

        // Glowing gold styling
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 15 * scale;

        const coinRadius = bounds.width / 2;

        // Outer gold circle
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(0, 0, coinRadius, 0, Math.PI * 2);
        ctx.fill();

        // Inner darker gold ring
        ctx.strokeStyle = '#997700';
        ctx.lineWidth = Math.max(1, 3 * scale);
        ctx.stroke();

        // Dollar sign or star emblem inside coin
        ctx.fillStyle = '#997700';
        ctx.font = `bold ${Math.floor(18 * scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);

        ctx.restore();
    }
}

class CoinManager {
    constructor() {
        this.coins = [];
        this.spawnTimer = 0;
    }

    reset() {
        this.coins = [];
        this.spawnTimer = 0;
    }

    update(difficultyMultiplier = 1) {
        for (let i = this.coins.length - 1; i >= 0; i--) {
            let coin = this.coins[i];
            coin.update(difficultyMultiplier);

            if (!isGameOver && coin.progress > 1.2 || coin.collected) {
                this.coins.splice(i, 1);
            }
        }

        if (!isGameOver) {
            this.spawnTimer++;
            if (this.spawnTimer >= 70) { // Spawn coin periodically
                this.spawnTimer = 0;
                this.trySpawnCoin();
            }
        }
    }

    trySpawnCoin() {
        const lanes = [0, 1, 2];
        const chosenLane = lanes[Math.floor(Math.random() * lanes.length)];
        const speed = 0.007;
        this.coins.push(new Coin(chosenLane, -0.2, speed));
    }

    draw(ctx, width, height) {
        for (let coin of this.coins) {
            coin.draw(ctx, width, height);
        }
    }

    checkCollection(playerBounds, width, height) {
        for (let coin of this.coins) {
            if (coin.collected || coin.progress < 0) continue;

            let coinBounds = coin.getBounds(width, height);
            if (
                playerBounds.x < coinBounds.x + coinBounds.width &&
                playerBounds.x + playerBounds.width > coinBounds.x &&
                playerBounds.y < coinBounds.y + coinBounds.height &&
                playerBounds.y + playerBounds.height > coinBounds.y
            ) {
                coin.collected = true;

                coinSound.currentTime = 0;
                coinSound.play();

                coinsCount++;
                localStorage.setItem('luckyNitroCoins', coinsCount);

                // Add floating "+1" text animation
                floatingTexts.push({
                    x: coinBounds.x + coinBounds.width / 2,
                    y: coinBounds.y,
                    text: '+1',
                    alpha: 1,
                    vy: -1.5
                });

               

            }
        }
    }
}

/**
 * Rain Effect Class - Handles Atmospheric Cyberpunk Weather
 */
class RainEffect {
    constructor() {
        this.drops = [];
        for (let i = 0; i < 100; i++) {
            this.drops.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                length: Math.random() * 20 + 10,
                speed: Math.random() * 15 + 10
            });
        }
    }

    update(speedMultiplier = 1) {
        for (let drop of this.drops) {
            drop.y += drop.speed * speedMultiplier;
            if (drop.y > window.innerHeight) {
                drop.y = -20;
                drop.x = Math.random() * window.innerWidth;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 1;
        for (let drop of this.drops) {
            ctx.beginPath();
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x - 1, drop.y + drop.length);
            ctx.stroke();
        }
        ctx.restore();
    }
}

// Initialize instances
const sky = new Sky();
const cityBackground = new CityBackground();
const road = new CyberpunkRoad();
const playerCar = new PlayerCar();
const enemyManager = new EnemyManager();
const coinManager = new CoinManager();
const rain = new RainEffect();

// Setup DOM overlay for Game Over professional panel & buttons
const gameOverContainer = document.createElement('div');
gameOverContainer.id = 'gameOverContainer';
gameOverContainer.style.position = 'fixed';
gameOverContainer.style.top = '0';
gameOverContainer.style.left = '0';
gameOverContainer.style.width = '100vw';
gameOverContainer.style.height = '100vh';
gameOverContainer.style.display = 'none';
gameOverContainer.style.justifyContent = 'center';
gameOverContainer.style.alignItems = 'center';
gameOverContainer.style.zIndex = '2000';
gameOverContainer.style.background = 'rgba(0, 0, 0, 0.75)';
gameOverContainer.style.backdropFilter = 'blur(5px)';

gameOverContainer.innerHTML = `
    <div style="
        background: linear-gradient(135deg, #0f0c1b, #1a102f);
        border: 2px solid #ff007f;
        box-shadow: 0 0 35px rgba(255, 0, 127, 0.6), inset 0 0 20px rgba(0, 240, 255, 0.2);
        padding: 40px;
        border-radius: 20px;
        text-align: center;
        width: 380px;
        font-family: 'sans-serif';
        color: #ffffff;
    ">
        <h2 style="
            margin-top: 0;
            font-size: 38px;
            letter-spacing: 2px;
            color: #ff007f;
            text-shadow: 0 0 15px #ff007f;
            margin-bottom: 25px;
        ">GAME OVER</h2>
        
        <div style="
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid #00f0ff;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 30px;
            box-shadow: inset 0 0 10px rgba(0, 240, 255, 0.2);
        ">
            <p id="goFinalScore" style="margin: 10px 0; font-size: 20px; color: #00f0ff; text-shadow: 0 0 8px #00f0ff;">FINAL SCORE: 0</p>
            <p id="goBestScore" style="margin: 10px 0; font-size: 18px; color: #ffcc00; text-shadow: 0 0 8px #ffcc00;">BEST SCORE: 0</p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 15px;">
            <button id="playAgainBtn" style="
                background: linear-gradient(135deg, #00f0ff, #0055ff);
                color: #ffffff;
                border: none;
                padding: 14px;
                font-size: 18px;
                font-weight: bold;
                border-radius: 10px;
                cursor: pointer;
                box-shadow: 0 0 15px rgba(0, 240, 255, 0.6);
                transition: transform 0.1s ease;
            ">▶ PLAY AGAIN</button>

            <button id="garageBtn" style="
                background: linear-gradient(135deg, #ffcc00, #ff6600);
                color: #ffffff;
                border: none;
                padding: 14px;
                font-size: 18px;
                font-weight: bold;
                border-radius: 10px;
                cursor: pointer;
                box-shadow: 0 0 15px rgba(255, 204, 0, 0.6);
                transition: transform 0.1s ease;
            ">🚗 GARAGE</button>

            <button id="mainMenuBtn" style="
                background: linear-gradient(135deg, #ff007f, #9900ff);
                color: #ffffff;
                border: none;
                padding: 14px;
                font-size: 18px;
                font-weight: bold;
                border-radius: 10px;
                cursor: pointer;
                box-shadow: 0 0 15px rgba(255, 0, 127, 0.6);
                transition: transform 0.1s ease;
            ">🏠 MAIN MENU</button>
        </div>
    </div>
`;
document.body.appendChild(gameOverContainer);

// Setup Garage Menu Overlay
const garageContainer = document.createElement('div');
garageContainer.id = 'garageContainer';
garageContainer.style.position = 'fixed';
garageContainer.style.top = '0';
garageContainer.style.left = '0';
garageContainer.style.width = '100vw';
garageContainer.style.height = '100vh';
garageContainer.style.display = 'none';
garageContainer.style.justifyContent = 'center';
garageContainer.style.alignItems = 'center';
garageContainer.style.zIndex = '3000';
garageContainer.style.background = 'rgba(0, 0, 0, 0.85)';
garageContainer.style.backdropFilter = 'blur(8px)';

function renderGarageHTML() {
    const ownedCars = JSON.parse(localStorage.getItem('luckyNitroOwnedCars')) || ['Pink Car'];
    const selectedCar = localStorage.getItem('luckyNitroSelectedCar') || 'Pink Car';

    const carsList = [
        { name: 'Pink Car', price: 0, color: '#ff007f' },
        { name: 'Blue Car', price: 100, color: '#00f0ff' },
        { name: 'Green Car', price: 250, color: '#00ff66' },
        { name: 'Red Car', price: 500, color: '#ff0033' },
        { name: 'Gold Car', price: 1000, color: '#ffcc00' }
    ];

    let carsHTML = '';
    for (let car of carsList) {
        const isOwned = ownedCars.includes(car.name);
        const isSelected = selectedCar === car.name;

        let actionButtonHTML = '';
        if (isSelected) {
            actionButtonHTML = `<button disabled style="background: #333; color: #888; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold;">SELECTED</button>`;
        } else if (isOwned) {
            actionButtonHTML = `<button class="selectCarBtn" data-car="${car.name}" style="background: linear-gradient(135deg, #00f0ff, #0055ff); color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">SELECT</button>`;
        } else {
            actionButtonHTML = `<button class="buyCarBtn" data-car="${car.name}" data-price="${car.price}" style="background: linear-gradient(135deg, #ffcc00, #ff6600); color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">BUY (${car.price} 🪙)</button>`;
        }

        carsHTML += `
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(0, 0, 0, 0.5);
                border: 2px solid ${car.color};
                padding: 12px 20px;
                border-radius: 12px;
                box-shadow: 0 0 10px ${car.color}40;
            ">
                <div style="text-align: left;">
                    <span style="font-size: 18px; font-weight: bold; color: ${car.color};">${car.name}</span>
                    <p style="margin: 4px 0 0 0; font-size: 14px; color: #aaa;">${isOwned ? (isSelected ? 'Active Vehicle' : 'Owned') : 'Locked (' + car.price + ' coins)'}</p>
                </div>
                <div>${actionButtonHTML}</div>
            </div>
        `;
    }

    garageContainer.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #0f0c1b, #1a102f);
            border: 2px solid #00f0ff;
            box-shadow: 0 0 40px rgba(0, 240, 255, 0.5);
            padding: 30px;
            border-radius: 20px;
            text-align: center;
            width: 440px;
            max-height: 90vh;
            overflow-y: auto;
            font-family: 'sans-serif';
            color: #ffffff;
        ">
            <h2 style="margin-top: 0; font-size: 32px; color: #00f0ff; text-shadow: 0 0 12px #00f0ff; margin-bottom: 10px;">GARAGE</h2>
            <p style="color: #ffcc00; font-size: 18px; margin-bottom: 25px;">Coins Available: <span id="garageCoinsCount">${coinsCount}</span> 🪙</p>
            
            <div style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 25px;">
                ${carsHTML}
            </div>

            <button id="closeGarageBtn" style="
                background: linear-gradient(135deg, #ff007f, #9900ff);
                color: #ffffff;
                border: none;
                padding: 12px 30px;
                font-size: 16px;
                font-weight: bold;
                border-radius: 10px;
                cursor: pointer;
                box-shadow: 0 0 15px rgba(255, 0, 127, 0.6);
            ">BACK TO GAME</button>
        </div>
    `;

    // Attach button event listeners inside garage
    garageContainer.querySelectorAll('.selectCarBtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const carName = e.target.getAttribute('data-car');
            localStorage.setItem('luckyNitroSelectedCar', carName);
            renderGarageHTML();
        });
    });

    garageContainer.querySelectorAll('.buyCarBtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const carName = e.target.getAttribute('data-car');
            const carPrice = parseInt(e.target.getAttribute('data-price'));

            if (coinsCount >= carPrice) {
                coinsCount -= carPrice;
                localStorage.setItem('luckyNitroCoins', coinsCount);

                const ownedCars = JSON.parse(localStorage.getItem('luckyNitroOwnedCars')) || ['Pink Car'];
                ownedCars.push(carName);
                localStorage.setItem('luckyNitroOwnedCars', JSON.stringify(ownedCars));
                localStorage.setItem('luckyNitroSelectedCar', carName);

                renderGarageHTML();
            } else {
                alert('Not enough coins!');
            }
        });
    });

    document.getElementById('closeGarageBtn').addEventListener('click', () => {
        garageContainer.style.display = 'none';
    });
}
document.body.appendChild(garageContainer);

// Add Garage Button to Main HUD or Game Over
const playAgainBtn = document.getElementById('playAgainBtn');
const garageBtn = document.getElementById('garageBtn');
const mainMenuBtn = document.getElementById('mainMenuBtn');
const goFinalScore = document.getElementById('goFinalScore');
const goBestScore = document.getElementById('goBestScore');

const restartGame = () => {
    isGameOver = false;
    score = 0;
    crashTimer = 0;
    playerCrashBackward = 0;
    smokeParticles = [];
    isFlashingRed = true;
    flashTimer = 0;
    playerCar.reset();
    enemyManager.reset();
    coinManager.reset();
    floatingTexts = [];
    gameOverContainer.style.display = 'none';
    engineSound.currentTime = 0;
    engineSound.play();
};

playAgainBtn.addEventListener('click', restartGame);
playAgainBtn.addEventListener('touchstart', (e) => { e.preventDefault(); restartGame(); });

garageBtn.addEventListener('click', () => {
    renderGarageHTML();
    garageContainer.style.display = 'flex';
});
garageBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    renderGarageHTML();
    garageContainer.style.display = 'flex';
});

mainMenuBtn.addEventListener('click', () => {
    alert('Main Menu placeholder clicked!');
});
mainMenuBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    alert('Main Menu placeholder clicked!');
});

// Also add a permanent Garage button on top-left / middle for quick access during gameplay
const hudGarageBtn = document.createElement('div');
hudGarageBtn.id = 'hudGarageBtn';
hudGarageBtn.innerHTML = '🚗 GARAGE';
hudGarageBtn.style.position = 'fixed';
hudGarageBtn.style.top = '30px';
hudGarageBtn.style.left = '230px';
hudGarageBtn.style.padding = '8px 15px';
hudGarageBtn.style.background = 'linear-gradient(135deg, #ffcc00, #ff6600)';
hudGarageBtn.style.color = '#ffffff';
hudGarageBtn.style.fontFamily = 'sans-serif';
hudGarageBtn.style.fontWeight = 'bold';
hudGarageBtn.style.fontSize = '14px';
hudGarageBtn.style.borderRadius = '8px';
hudGarageBtn.style.boxShadow = '0 0 10px rgba(255, 204, 0, 0.5)';
hudGarageBtn.style.zIndex = '1000';
hudGarageBtn.style.cursor = 'pointer';
hudGarageBtn.style.userSelect = 'none';

hudGarageBtn.addEventListener('click', () => {
    renderGarageHTML();
    garageContainer.style.display = 'flex';
});
document.body.appendChild(hudGarageBtn);


/**
 * Standard 60 FPS Game Loop
 */
function gameLoop() {
    ctx.fillStyle = '#0b0b16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const currentDisplayScore = Math.floor(score / 10);
    const difficultyLevel = Math.floor(currentDisplayScore / 20);
    let difficultyMultiplier = 1 + (difficultyLevel * 0.15);

    if (playerCar.isNitroActive && !isGameOver) {
        difficultyMultiplier *= 1.60;
    }

    if (isGameOver) {
        difficultyMultiplier = 0;
    }

    if (isGameOver) {
        crashTimer++;
        flashTimer++;
        if (flashTimer >= 15) {
            isFlashingRed = !isFlashingRed;
            flashTimer = 0;
        }

        if (playerCrashBackward < 25) {
            playerCrashBackward += 0.8;
        }

        if (crashTimer % 3 === 0 && smokeParticles.length < 30) {
            smokeParticles.push({
                x: playerCar.x + (Math.random() - 0.5) * 30,
                y: canvas.height - playerCar.height - 30 + (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 3 - 1,
                radius: Math.random() * 8 + 5,
                alpha: 0.8
            });
        }
    }

    for (let i = smokeParticles.length - 1; i >= 0; i--) {
        let p = smokeParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.radius += 0.4;
        p.alpha -= 0.03;
        if (p.alpha <= 0) {
            smokeParticles.splice(i, 1);
        }
    }

    ctx.save();
    if ((playerCar.isNitroActive || difficultyLevel >= 2) && !isGameOver) {
        const shakeIntensity = playerCar.isNitroActive ? 3.0 : Math.min(3, (difficultyLevel - 1) * 0.8);
        const shakeX = (Math.random() - 0.5) * shakeIntensity;
        const shakeY = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(shakeX, shakeY);
    }

    sky.update();
    sky.draw(ctx, canvas.width, canvas.height);

    cityBackground.update(difficultyMultiplier);
    cityBackground.draw(ctx, canvas.width, canvas.height);

    road.update(difficultyMultiplier);
    road.draw(ctx, canvas.width, canvas.height, difficultyMultiplier, playerCar.isNitroActive);

    const enemyDifficultyMultiplier = playerCar.isNitroActive ? difficultyMultiplier * 1.60 : difficultyMultiplier;
    enemyManager.update(enemyDifficultyMultiplier);
    enemyManager.draw(ctx, canvas.width, canvas.height);

    // Update and draw coins
    coinManager.update(enemyDifficultyMultiplier);
    coinManager.draw(ctx, canvas.width, canvas.height);

    if (!isGameOver) {
        playerCar.update(canvas.width, canvas.height);
    }
    playerCar.draw(ctx);

    rain.update(difficultyMultiplier);
    rain.draw(ctx);

    if (isGameOver) {
        ctx.save();
        for (let p of smokeParticles) {
            ctx.fillStyle = `rgba(150, 150, 150, ${Math.max(0, p.alpha)})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    ctx.restore();

    if (isGameOver) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    } else {
        ctx.save();
        const vignette = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.width * 0.35, canvas.width / 2, canvas.height / 2, canvas.width * 0.75);
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(5, 2, 10, 0.75)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    if (!isGameOver) {
        score += 1;
    }

    // Display Score, Best Score, and Coins at top-left/top-right
    ctx.save();
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.fillText(`SCORE: ${currentDisplayScore}`, canvas.width - 30, 40);
    ctx.fillText(`BEST: ${Math.floor(bestScore / 10)}`, canvas.width - 30, 70);
    ctx.restore();

    ctx.save();
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#ffcc00';
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 8;
    ctx.textAlign = 'left';
    ctx.fillText(`COINS: ${coinsCount} 🪙`, 30, 95);
    ctx.restore();

    ctx.save();
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.textAlign = 'left';
    ctx.fillText('NITRO BOOST (SPACE)', 30, 40);

    ctx.fillStyle = '#11111a';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.fillRect(30, 50, 180, 16);
    ctx.strokeRect(30, 50, 180, 16);

    const fillWidth = (playerCar.nitroMeter / 100) * 176;
    const nitroGradient = ctx.createLinearGradient(30, 0, 210, 0);
    nitroGradient.addColorStop(0, '#00f0ff');
    nitroGradient.addColorStop(1, '#ff007f');

    ctx.fillStyle = nitroGradient;
    ctx.fillRect(32, 52, fillWidth, 12);
    ctx.restore();

    // Render floating text animations for coin collections (+1)
    ctx.save();
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i];
        ft.y += ft.vy;
        ft.alpha -= 0.02;

        ctx.font = 'bold 22px sans-serif';
        ctx.fillStyle = `rgba(255, 204, 0, ${Math.max(0, ft.alpha)})`;
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 10;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);

        if (ft.alpha <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
    ctx.restore();

    if (!isGameOver) {
        const playerBounds = playerCar.getBounds();
        
        // Check coin collections
        coinManager.checkCollection(playerBounds, canvas.width, canvas.height);

        // Check enemy traffic collisions
        if (enemyManager.checkCollisions(playerBounds, canvas.width, canvas.height)) {
            isGameOver = true;
            crashSound.currentTime = 0;
            crashSound.play();
            engineSound.pause();
            crashTimer = 0;
            flashTimer = 0;
            playerCrashBackward = 0;
            playerCrashAngle = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 20 + 20) * (Math.PI / 180);

            if (score > bestScore) {
                bestScore = score;
                localStorage.setItem('luckyNitroBestScore', bestScore);
            }

            goFinalScore.textContent = `FINAL SCORE: ${currentDisplayScore}`;
            goBestScore.textContent = `BEST SCORE: ${Math.floor(bestScore / 10)}`;
            gameOverContainer.style.display = 'flex';
        }
    }

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
