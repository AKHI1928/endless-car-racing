/**
 * Lucky Nitro - Cyberpunk Road with Player Car Fixed
 * script.js
 */

// Use the existing canvas from index.html
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

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
        this.speed = 8; // Scrolling speed
    }

    update() {
        this.offsetY += this.speed;
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
 * Player Car Controller & Renderer using Canvas primitives
 */
class PlayerCar {
    constructor() {
        this.width = 70;
        this.height = 110;
        this.x = canvas.width / 2; // Initialize immediately to screen center
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

        // Ensure x is valid if resized
        if (isNaN(this.x)) {
            this.x = canvasWidth / 2;
        }

        // Handle acceleration based on input
        if (this.keys.left) {
            this.vx -= this.acceleration;
        } else if (this.keys.right) {
            this.vx += this.acceleration;
        } else {
            this.vx *= this.friction; // Apply friction when no keys are pressed
        }

        // Clamp velocity to max speed
        if (this.vx > this.maxSpeed) this.vx = this.maxSpeed;
        if (this.vx < -this.maxSpeed) this.vx = -this.maxSpeed;

        // Stop tiny floating point drift
        if (Math.abs(this.vx) < 0.05) this.vx = 0;

        // Update position
        this.x += this.vx;

        // Keep the car strictly inside the road boundaries at the bottom width
        const bottomRoadWidth = canvasWidth * 0.55;
        const roadLeft = (canvasWidth - bottomRoadWidth) / 2;
        const roadRight = roadLeft + bottomRoadWidth;

        const margin = 15; // Padding from the neon edges
        if (this.x - this.width / 2 < roadLeft + margin) {
            this.x = roadLeft + margin + this.width / 2;
            this.vx = 0;
        }
        if (this.x + this.width / 2 > roadRight - margin) {
            this.x = roadRight - margin - this.width / 2;
            this.vx = 0;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Slight tilt effect when steering
        const tilt = this.vx * 0.015;
        ctx.rotate(tilt);

        // Car Body (Modern Neon Sports Car Shape)
        ctx.fillStyle = '#ff0055'; // Vibrant cyberpunk magenta body
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

        // Hood & Front Nose refinement
        ctx.fillStyle = '#b3003b';
        ctx.beginPath();
        ctx.moveTo(-this.width / 4, -this.height / 2);
        ctx.lineTo(this.width / 4, -this.height / 2);
        ctx.lineTo(this.width / 3, -10);
        ctx.lineTo(-this.width / 3, -10);
        ctx.closePath();
        ctx.fill();

        // Windshield (Dark tinted glass with neon reflection)
        ctx.fillStyle = '#0b0b16';
        ctx.beginPath();
        ctx.moveTo(-this.width / 4 + 4, -this.height / 2 + 12);
        ctx.lineTo(this.width / 4 - 4, -this.height / 2 + 12);
        ctx.lineTo(this.width / 3 - 4, -5);
        ctx.lineTo(-this.width / 3 + 4, -5);
        ctx.closePath();
        ctx.fill();

        // Glowing Headlights
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(-this.width / 2 + 6, -this.height / 2 + 2, 12, 4);
        ctx.fillRect(this.width / 2 - 18, -this.height / 2 + 2, 12, 4);

        // Glowing Taillights
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

        ctx.restore();
    }
}

// Initialize instances
const road = new CyberpunkRoad();
const playerCar = new PlayerCar();

/**
 * Standard 60 FPS Game Loop
 */
function gameLoop() {
    // Clear canvas
    ctx.fillStyle = '#0b0b16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and render the perspective road
    road.update();
    road.draw(ctx, canvas.width, canvas.height);

    // Update and render the player car
    playerCar.update(canvas.width, canvas.height);
    playerCar.draw(ctx);

    // Maintain 60 FPS
    requestAnimationFrame(gameLoop);
}

// Start the game loop
requestAnimationFrame(gameLoop);
