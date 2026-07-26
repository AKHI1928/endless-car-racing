/* ==========================================================================
   Lucky Nitro — Core Engine Foundation
   --------------------------------------------------------------------------
   This file contains the game engine foundation plus the road feature:
     - Canvas + context setup (with devicePixelRatio scaling)
     - Responsive resize handling
     - A fixed-logic, 60 FPS-targeted game loop (update/render split)
     - A dark cyberpunk background render
     - A centered, responsive neon road with glowing edges and an
       animated dashed center lane, simulating forward motion

   No cars, enemies, menus, or sound are implemented here. Later features
   will continue to hook into `update(dt)` and `render(ctx)` below.
   ========================================================================== */

(function () {
  'use strict';

  // --------------------------------------------------------------------
  // Canvas & Context Setup
  // --------------------------------------------------------------------

  /** @type {HTMLCanvasElement} */
  const canvas = document.getElementById('gameCanvas');

  /** @type {CanvasRenderingContext2D} */
  const ctx = canvas.getContext('2d');

  // Logical (CSS pixel) size of the canvas. Kept in sync with the viewport.
  const viewport = {
    width: 0,
    height: 0,
  };

  // --------------------------------------------------------------------
  // Responsive Resize Handling
  // --------------------------------------------------------------------

  /**
   * Resizes the canvas to fill the current viewport, accounting for
   * devicePixelRatio so the game renders crisply on high-DPI screens.
   */
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;

    viewport.width = window.innerWidth;
    viewport.height = window.innerHeight;

    // Set the actual pixel buffer size (scaled for device pixel ratio)
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);

    // Set the CSS display size back to the logical viewport size
    canvas.style.width = viewport.width + 'px';
    canvas.style.height = viewport.height + 'px';

    // Reset any existing transform, then scale so that all drawing
    // operations can be written in logical (CSS) pixels.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  // Recalculate on resize and on orientation change (mobile).
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', resizeCanvas);

  // Initial sizing before the loop starts.
  resizeCanvas();

  // --------------------------------------------------------------------
  // Background Rendering (Dark Cyberpunk Base)
  // --------------------------------------------------------------------

  /**
   * Draws the base dark cyberpunk backdrop: a deep vertical gradient with
   * a very subtle neon-tinted glow. This is intentionally minimal — road,
   * cars, and effects will be layered on top in future features.
   * @param {CanvasRenderingContext2D} ctx
   */
  function renderBackground(ctx) {
    const { width, height } = viewport;

    // Deep vertical gradient: near-black with a faint purple/blue cyberpunk tint.
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0a0a14');
    gradient.addColorStop(0.5, '#05050a');
    gradient.addColorStop(1, '#030308');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Faint radial neon glow near the center to add atmosphere without
    // introducing any gameplay elements yet.
    const glow = ctx.createRadialGradient(
      width / 2, height * 0.4, 0,
      width / 2, height * 0.4, Math.max(width, height) * 0.6
    );
    glow.addColorStop(0, 'rgba(120, 40, 200, 0.08)');
    glow.addColorStop(1, 'rgba(120, 40, 200, 0)');

    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  // --------------------------------------------------------------------
  // Road Rendering (Neon Cyberpunk Road)
  // --------------------------------------------------------------------
  //
  // The road is fully derived from the current viewport each frame, so it
  // automatically stays centered and correctly scaled on resize — no
  // separate resize handling is required for it.

  const road = {
    // Fraction of the viewport width the road occupies.
    widthRatio: 0.4,

    // Vertical scroll offset (px) used to animate the center lane dashes
    // and the road surface downward, simulating forward motion.
    scrollOffset: 0,

    // How fast the road appears to scroll, in px/second.
    scrollSpeed: 480,

    // Lane dash geometry, in logical px.
    dashWidth: 6,
    dashHeight: 40,
    dashGap: 30,

    // Border (edge line) geometry, in logical px.
    borderWidth: 5,
  };

  /**
   * Advances the road's scroll animation. Kept separate from rendering so
   * the animation speed stays tied to the fixed-timestep update, not the
   * variable frame rate.
   * @param {number} dt - Fixed delta time in milliseconds.
   */
  function updateRoad(dt) {
    const dtSeconds = dt / 1000;
    road.scrollOffset += road.scrollSpeed * dtSeconds;

    // Wrap the offset within a single dash+gap cycle to avoid the value
    // growing unbounded over a long play session.
    const cycle = road.dashHeight + road.dashGap;
    if (road.scrollOffset >= cycle) {
      road.scrollOffset -= cycle;
    }
  }

  /**
   * Draws the road surface, glowing neon edge borders, and animated
   * dashed center lane markings, centered horizontally in the viewport.
   * @param {CanvasRenderingContext2D} ctx
   */
  function renderRoad(ctx) {
    const { width, height } = viewport;

    const roadWidth = width * road.widthRatio;
    const roadX = (width - roadWidth) / 2; // left edge of the road
    const roadCenterX = width / 2;

    // ---- Road surface ----
    // A subtle vertical gradient keeps the asphalt from looking flat while
    // staying dark enough for the neon elements to pop.
    const surfaceGradient = ctx.createLinearGradient(0, 0, 0, height);
    surfaceGradient.addColorStop(0, '#141420');
    surfaceGradient.addColorStop(1, '#0c0c16');

    ctx.fillStyle = surfaceGradient;
    ctx.fillRect(roadX, 0, roadWidth, height);

    // ---- Glowing neon edge borders (left & right) ----
    ctx.save();
    ctx.strokeStyle = '#00f6ff';
    ctx.lineWidth = road.borderWidth;
    ctx.shadowColor = '#00f6ff';
    ctx.shadowBlur = 20;

    // Left border
    ctx.beginPath();
    ctx.moveTo(roadX, 0);
    ctx.lineTo(roadX, height);
    ctx.stroke();

    // Right border
    ctx.beginPath();
    ctx.moveTo(roadX + roadWidth, 0);
    ctx.lineTo(roadX + roadWidth, height);
    ctx.stroke();

    // A second, brighter thin pass on top sharpens the glow's core.
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#bafeff';

    ctx.beginPath();
    ctx.moveTo(roadX, 0);
    ctx.lineTo(roadX, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(roadX + roadWidth, 0);
    ctx.lineTo(roadX + roadWidth, height);
    ctx.stroke();

    ctx.restore();

    // ---- Animated dashed center lane markings ----
    ctx.save();
    ctx.fillStyle = '#f5f5f5';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;

    const cycle = road.dashHeight + road.dashGap;
    const dashX = roadCenterX - road.dashWidth / 2;

    // Start one cycle above the viewport so dashes scroll seamlessly into
    // view from the top rather than popping in.
    for (let y = -cycle + road.scrollOffset; y < height; y += cycle) {
      ctx.fillRect(dashX, y, road.dashWidth, road.dashHeight);
    }

    ctx.restore();
  }

  // --------------------------------------------------------------------
  // Game Loop (fixed-timestep update, render every frame)
  // --------------------------------------------------------------------

  const TARGET_FPS = 60;
  const FIXED_DT = 1000 / TARGET_FPS; // ms per logic update (~16.67ms)
  const MAX_FRAME_TIME = 250; // clamp to avoid "spiral of death" after tab-switch

  let lastTimestamp = 0;
  let accumulator = 0;

  // Exposed lightly for future features/debugging; not required externally.
  const engine = {
    running: false,
    fps: 0,
  };

  /**
   * Fixed-timestep logic update. Placeholder for now — future features
   * (cars, spawning, collisions, scoring) will hook in here.
   * @param {number} dt - Fixed delta time in milliseconds.
   */
  function update(dt) {
    updateRoad(dt);
  }

  /**
   * Renders a single frame. Currently only draws the base background.
   * @param {CanvasRenderingContext2D} ctx
   */
  function render(ctx) {
    ctx.clearRect(0, 0, viewport.width, viewport.height);
    renderBackground(ctx);
    renderRoad(ctx);
  }

  /**
   * Main loop driven by requestAnimationFrame. Uses a fixed-timestep
   * accumulator so `update()` runs at a consistent 60Hz regardless of the
   * actual display refresh rate, while `render()` runs once per frame.
   * @param {number} timestamp - High-resolution timestamp from rAF.
   */
  function gameLoop(timestamp) {
    if (!engine.running) return;

    let frameTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    // Guard against huge jumps (e.g. when the tab regains focus).
    if (frameTime > MAX_FRAME_TIME) {
      frameTime = MAX_FRAME_TIME;
    }

    engine.fps = frameTime > 0 ? 1000 / frameTime : 0;
    accumulator += frameTime;

    // Run as many fixed updates as needed to catch up to real time.
    while (accumulator >= FIXED_DT) {
      update(FIXED_DT);
      accumulator -= FIXED_DT;
    }

    render(ctx);

    requestAnimationFrame(gameLoop);
  }

  /**
   * Starts the game loop.
   */
  function start() {
    if (engine.running) return;
    engine.running = true;
    lastTimestamp = performance.now();
    accumulator = 0;
    requestAnimationFrame(gameLoop);
  }

  /**
   * Stops the game loop (useful for pausing/tab visibility handling later).
   */
  function stop() {
    engine.running = false;
  }

  // Pause the loop when the tab is hidden, resume when visible again,
  // to avoid a large accumulated frameTime spike on return.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  // --------------------------------------------------------------------
  // Boot
  // --------------------------------------------------------------------

  start();

})();
