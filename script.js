/**
 * Lucky Nitro - Endless Cyberpunk Road
 * script.js
 */

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// Setup document body and canvas for fullscreen responsive rendering
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.backgroundColor = '#0b0b16';

canvas.style.display = 'block';
canvas.style.width = '100vw';
canvas.style.height = '100vh';
document.body.appendChild(canvas);

// Handle canvas sizing and responsiveness
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/**
 * Cyberpunk Road Renderer and Controller
 */
class CyberpunkRoad {
    constructor() {
        this.offsetY = 0;
        this.speed = 8; // Scrolling speed of the road
    }

    update() {
        // Continuously move the offset down to simulate forward motion
        this.offsetY += this.speed;
        
        // Reset offset to prevent overflow and maintain seamless loop
        if (this.offsetY >= 60) {
            this.offsetY = 0;
        }
    }

    draw(ctx, width, height) {
        // Road dimensions: occupy ~40% of the screen width, centered
        const roadWidth = width * 0.4;
        const roadLeft = (width - roadWidth) / 2;
        const roadRight = roadLeft + roadWidth;

        // Draw dark asphalt road background
        ctx.fillStyle = '#12121c';
        ctx.fillRect(roadLeft, 0, roadWidth, height);

        // Draw glowing cyan neon borders on the left and right edges
        ctx.save();
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 4;

        // Left border
        ctx.beginPath();
        ctx.moveTo(roadLeft, 0);
        ctx.lineTo(roadLeft, height);
        ctx.stroke();

        // Right border
        ctx.beginPath();
        ctx.moveTo(roadRight, 0);
        ctx.lineTo(roadRight, height);
        ctx.stroke();
        ctx.restore();

        // Draw animated dashed white center lane markings
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.setLineDash([30, 30]); // Dash length and gap length
        // Apply the continuous offset to the line dash pattern
        ctx.lineDashOffset = -this.offsetY;

        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
        ctx.restore();
    }
}

// Initialize the road instance
const road = new CyberpunkRoad();

/**
 * Standard 60 FPS Game Loop
 */
function gameLoop() {
    // Clear the entire canvas with a dark cybernetic background tone
    ctx.fillStyle = '#0b0b16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and render the road
    road.update();
    road.draw(ctx, canvas.width, canvas.height);

    // Maintain 60 FPS via requestAnimationFrame
    requestAnimationFrame(gameLoop);
}

// Start the game loop
requestAnimationFrame(gameLoop);
