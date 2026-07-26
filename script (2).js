/* ==========================================================================
   Lucky Nitro — Core Engine Foundation
   --------------------------------------------------------------------------
   This file sets up ONLY the foundation of the game:
     - Canvas + context setup (with devicePixelRatio scaling)
     - Responsive resize handling
     - A fixed-logic, 60 FPS-targeted game loop (update/render split)
     - A dark cyberpunk background render

   No cars, roads, enemies, menus, or animations are implemented here.
   Later features will hook into `update(dt)` and `render(ctx)` below.
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
    // Intentionally empty for the foundation step.
  }

  /**
   * Renders a single frame. Currently only draws the base background.
   * @param {CanvasRenderingContext2D} ctx
   */
  function render(ctx) {
    ctx.clearRect(0, 0, viewport.width, viewport.height);
    renderBackground(ctx);
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
