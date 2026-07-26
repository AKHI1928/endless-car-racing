// ===============================
// Lucky Nitro - Version 1
// ===============================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Resize Canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ===============================
// Draw Road
// ===============================
function drawRoad() {

    // Left Grass
    ctx.fillStyle = "#081018";
    ctx.fillRect(0, 0, canvas.width * 0.25, canvas.height);

    // Right Grass
    ctx.fillRect(canvas.width * 0.75, 0, canvas.width * 0.25, canvas.height);

    // Road
    ctx.fillStyle = "#222";
    ctx.fillRect(canvas.width * 0.25, 0, canvas.width * 0.50, canvas.height);

    // Center Line
    ctx.fillStyle = "#ffffff";

    for (let y = 0; y < canvas.height; y += 80) {
        ctx.fillRect(canvas.width / 2 - 5, y, 10, 40);
    }
}

// ===============================
// Game Loop
// ===============================
function gameLoop() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawRoad();

    requestAnimationFrame(gameLoop);
}

gameLoop();
