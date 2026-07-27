/**
 * Enemy Car Class supporting multiple instances, individual progress, random negative respawn, lanes, and speeds
 */
class EnemyCar {
    constructor(initialProgress = 0) {
        this.reset(initialProgress);
    }

    reset(initialProgress = 0) {
        // Random lane selection: 0 = Left, 1 = Center, 2 = Right
        const lanes = [0, 1, 2];
        this.lane = lanes[Math.floor(Math.random() * lanes.length)];
        
        // Progress along the perspective road (negative values place it above the horizon)
        this.progress = initialProgress;
        
        // Slightly different speed for each enemy
        this.speed = 0.006 + Math.random() * 0.008;
    }

    update() {
        this.progress += this.speed;
        // When enemy leaves the screen (progress > 1.0), respawn it ABOVE the horizon using a random negative progress between -0.2 and -1.5
        if (this.progress > 1.0) {
            const randomNegativeProgress = -0.2 - Math.random() * 1.3;
            this.reset(randomNegativeProgress);
        }
    }

    // Get bounding box for accurate AABB collision detection
    getBounds(width, height) {
        const horizonY = height * 0.35;
        const bottomY = height;
        const centerX = width / 2;

        const topRoadWidth = width * 0.15;
        const bottomRoadWidth = width * 0.55;

        const y = horizonY + this.progress * (bottomY - horizonY);
        const currentRoadWidth = topRoadWidth + (bottomRoadWidth - topRoadWidth) * this.progress;
        const roadLeft = centerX - currentRoadWidth / 2;

        // Lane horizontal multipliers: 0.25 (left), 0.5 (center), 0.75 (right)
        const laneMultipliers = [0.25, 0.50, 0.75];
        const x = roadLeft + currentRoadWidth * laneMultipliers[this.lane];

        const baseWidth = 65;
        const baseHeight = 100;
        const scale = 0.30 + 0.70 * this.progress;

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
        const scale = 0.30 + 0.70 * this.progress;

        const carWidth = baseWidth * scale;
        const carHeight = baseHeight * scale;

        ctx.save();
        ctx.translate(x, y);

        if (enemyImageLoaded) {
            ctx.drawImage(enemyImage, -carWidth / 2, -carHeight / 2, carWidth, carHeight);
        } else {
            // Fallback Canvas drawing
            ctx.fillStyle = '#ffaa00';
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 12 * scale;

            ctx.beginPath();
            ctx.moveTo(-carWidth / 2 + 8 * scale, carHeight / 2);
            ctx.lineTo(-carWidth / 2, -carHeight / 4);
            ctx.lineTo(-carWidth / 4, -carHeight / 2);
            ctx.lineTo(carWidth / 4, -carHeight / 2);
            ctx.lineTo(carWidth / 2, -carHeight / 4);
            ctx.lineTo(carWidth / 2 - 8 * scale, carHeight / 2);
            ctx.closePath();
            ctx.fill();

            // Windshield
            ctx.fillStyle = '#0b0b16';
            ctx.beginPath();
            ctx.moveTo(-carWidth / 4 + 2, -carHeight / 2 + 8 * scale);
            ctx.lineTo(carWidth / 4 - 2, -carHeight / 2 + 8 * scale);
            ctx.lineTo(carWidth / 3 - 2, -2);
            ctx.lineTo(-carWidth / 3 + 2, -2);
            ctx.closePath();
            ctx.fill();

            // Taillights
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 15 * scale;
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(-carWidth / 2 + 4 * scale, carHeight / 2 - 8 * scale, Math.max(4, 10 * scale), Math.max(2, 4 * scale));
            ctx.fillRect(carWidth / 2 - 14 * scale, carHeight / 2 - 8 * scale, Math.max(4, 10 * scale), Math.max(2, 4 * scale));
        }

        ctx.restore();
    }
}
