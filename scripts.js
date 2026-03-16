import gsap from "https://cdn.jsdelivr.net/npm/gsap@3.12.7/+esm";

// ===========================================================================
// Tweakable values
// ===========================================================================

// Logo intro
const INTRO_POP_DURATION       = 0.6;
const INTRO_SETTLE_DURATION    = 1;
const INTRO_FALLBACK_TIMEOUT   = 2000;    // ms before forcing intro if image hasn't loaded

// Logo magnet
const MAGNET_TILT              = 10;      // max 3D tilt angle in degrees
const MAGNET_PERSPECTIVE       = 500;     // 3D depth (lower = more dramatic)
const MAGNET_FOLLOW_DURATION   = 1;
const MAGNET_FOLLOW_EASE       = "elastic.out(1, 0.3)";
const MAGNET_SCALE             = 1.1;
const MAGNET_SCALE_IN_DURATION = 0.2;
const MAGNET_SCALE_OUT_DURATION= 0.6;

// Logo shadow (hover only)
const SHADOW_HOVER = { y: 14, blur: 12, alpha: 0.16, r: 4, g: 93, b: 43 };
const SHADOW_ZERO  = { y: 0,  blur: 0,  alpha: 0,    r: 0, g: 0,  b: 0 };

// Paragraph dim on hover
const DIM_OPACITY  = 0.4;
const DIM_DURATION = 0.4;

// Plots preview — cursor follow
const PREVIEW_GAP              = 32;      // px above cursor
const PREVIEW_FOLLOW_DURATION  = 0.8;
const PREVIEW_FOLLOW_EASE      = "elastic.out(1, 0.4)";
const PREVIEW_POP_DURATION     = 0.8;     // elastic pop-in duration
const PREVIEW_POP_EASE         = "elastic.out(1, 0.6)";  // higher period = floatier

// Plots preview — bed sway on move
const SWAY_MAX_DEG             = 14;      // max tilt in degrees
const SWAY_VELOCITY_FACTOR     = 8;       // faster = more sway (speed in px/ms → degrees)
const SWAY_SETTLE_DURATION     = 0.7;     // settle back to zero
const SWAY_SETTLE_EASE         = "elastic.out(1, 0.5)";  // rocking overshoot
const SWAY_SETTLE_DELAY        = 80;      // ms of no movement before settling

// Plots preview — snake animation
const SNAKE_BEAT               = 800;     // ms between each step
const SNAKE_SLIDE_DURATION     = 0.2;     // seconds per slide in/out
const SNAKE_WOBBLE             = 40;      // max rotation degrees on horizontal slides
const SNAKE_WOBBLE_EASE        = "back.out(.4)";

// Plant graphics and display order
const PLANTS = [
  "/images/plants/tomato-globe@thumb.webp",
  "/images/plants/sunflower@thumb.webp",
  "/images/plants/lettuce-looseleaf@thumb.webp",
  "/images/plants/pepper-bell@thumb.webp",
  "/images/plants/marigold@thumb.webp",
  "/images/plants/zucchini@thumb.webp",
  "/images/plants/pea-shelling@thumb.webp",
  "/images/plants/squash-pumpkin@thumb.webp",
  "/images/plants/corn@thumb.webp",
  "/images/plants/squash-spaghetti@thumb.webp",
  "/images/plants/cauliflower@thumb.webp",
  "/images/plants/dahlia@thumb.webp",
  "/images/plants/carrot@thumb.webp",
];

const PLANT_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// Snake path — directions as [x, y] in px (half cell = center to boundary)
const CELL_SIZE = 54;
const HALF = CELL_SIZE / 2;
const L = [-HALF, 0], R = [HALF, 0], T = [0, -HALF], B = [0, HALF];

const SNAKE_PATH = [
  { cell: 6, in: L, out: R },   // cell 6: enter from left, exit right
  { cell: 7, in: L, out: R },   // cell 7: enter from left, exit right
  { cell: 8, in: L, out: T },   // cell 8: enter from left, exit top
  { cell: 5, in: B, out: T },   // cell 5: enter from bottom, exit top
  { cell: 2, in: B, out: L },   // cell 2: enter from bottom, exit left
  { cell: 1, in: R, out: L },   // cell 1: enter from right, exit left
  { cell: 0, in: R, out: B },   // cell 0: enter from right, exit bottom
  { cell: 3, in: T, out: R },   // cell 3: enter from top, exit right
  { cell: 4, in: L, out: R },   // cell 4: enter from left, exit right
];

// ===========================================================================
// Internal state
// ===========================================================================

const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const IS_DESKTOP = window.matchMedia("(min-width: 769px)").matches;
const logo = document.querySelector(".logo");
const shadow = { y: 0, blur: 0, alpha: 0, r: 0, g: 0, b: 0 };

function applyShadow() {
  logo.style.filter = shadow.alpha > 0
    ? `drop-shadow(0 ${shadow.y}px ${shadow.blur}px rgba(${Math.round(shadow.r)},${Math.round(shadow.g)},${Math.round(shadow.b)},${shadow.alpha}))`
    : "none";
}

// ===========================================================================
// Logo intro
// ===========================================================================

function playLogoIntro() {
  document.documentElement.classList.add("is-loaded");

  if (REDUCED_MOTION) {
    gsap.set(logo, { opacity: 1, x: 0, y: -8, scale: 1, rotation: 0 });
    if (IS_DESKTOP) initMagnet();
    return;
  }

  const tl = gsap.timeline({
    onComplete: () => { if (IS_DESKTOP) initMagnet(); },
  });

  tl.fromTo(logo,
    { opacity: 0, x: 12, y: 24, scale: 0.4, rotation: -48 },
    { opacity: 1, x: 0, y: -20, scale: 1.06, rotation: 12, duration: INTRO_POP_DURATION, ease: "power3.inOut" }
  );

  tl.to(logo, {
    x: 0, y: -8, scale: 1, rotation: 0,
    duration: INTRO_SETTLE_DURATION, ease: "elastic.out(1, 0.5)",
  });
}

function initLogo() {
  if (!logo) return;

  let fired = false;
  function go() {
    if (fired) return;
    fired = true;
    requestAnimationFrame(() => requestAnimationFrame(playLogoIntro));
  }

  if (logo.complete && logo.naturalWidth) go();
  else {
    logo.addEventListener("load", go);
    window.addEventListener("load", go);
    setTimeout(go, INTRO_FALLBACK_TIMEOUT);
  }
}

// ===========================================================================
// Logo magnet
// ===========================================================================

function initMagnet() {
  const quickOpts = { duration: MAGNET_FOLLOW_DURATION, ease: MAGNET_FOLLOW_EASE };
  const xTo    = gsap.quickTo(logo, "x", quickOpts);
  const yTo    = gsap.quickTo(logo, "y", quickOpts);
  const rotYTo = gsap.quickTo(logo, "rotationY", quickOpts);
  const rotXTo = gsap.quickTo(logo, "rotationX", quickOpts);

  const dimTargets = document.querySelectorAll(".intro p:not(:last-child)");
  let hovering = false;

  gsap.set(logo, { transformPerspective: MAGNET_PERSPECTIVE });

  function enterState() {
    if (hovering) return;
    hovering = true;
    gsap.to(logo, { scale: MAGNET_SCALE, duration: MAGNET_SCALE_IN_DURATION, ease: "power2.out" });
    gsap.to(shadow, { ...SHADOW_HOVER, duration: 0.3, ease: "power2.out", onUpdate: applyShadow });
    gsap.to(dimTargets, { opacity: DIM_OPACITY, duration: DIM_DURATION, ease: "power2.out" });
  }

  logo.addEventListener("mousemove", (e) => {
    enterState();
    const { left, top, width, height } = logo.getBoundingClientRect();
    const dx = e.clientX - (left + width / 2);
    const dy = e.clientY - (top + height / 2);
    xTo(dx);
    yTo(dy);
    rotYTo((dx / (width / 2)) * MAGNET_TILT);
    rotXTo(-(dy / (height / 2)) * MAGNET_TILT);
  });

  logo.addEventListener("mouseleave", () => {
    hovering = false;
    xTo(0); yTo(0); rotYTo(0); rotXTo(0);
    gsap.to(logo, { scale: 1, duration: MAGNET_SCALE_OUT_DURATION, ease: "elastic.out(1, 0.4)" });
    gsap.to(shadow, { ...SHADOW_ZERO, duration: MAGNET_SCALE_OUT_DURATION, ease: "elastic.out(1, 0.4)", onUpdate: applyShadow });
    gsap.to(dimTargets, { opacity: 1, duration: DIM_DURATION, ease: "power2.out" });
  });
}

// ===========================================================================
// Plots preview
// ===========================================================================

function initPlotsPreview() {
  const links = document.querySelectorAll("[data-preview]");
  if (!links.length) return;

  // --- DOM ---
  const preview = document.createElement("div");
  preview.className = "link-preview";

  const sway = document.createElement("div");
  sway.className = "link-preview-sway";

  const content = document.createElement("div");
  content.className = "link-preview-content";

  const bg = document.createElement("img");
  bg.className = "link-preview-bg";
  bg.src = "/images/plots-bed.png";
  bg.alt = "";
  content.appendChild(bg);

  const grid = document.createElement("div");
  grid.className = "link-preview-grid";
  content.appendChild(grid);

  sway.appendChild(content);
  preview.appendChild(sway);

  const LETTER_CELLS = { 0: "P", 1: "L", 4: "O", 5: "T", 8: "S" };
  const cells = [];
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.className = "link-preview-cell";
    const letter = LETTER_CELLS[i];
    if (letter !== undefined) {
      const span = document.createElement("span");
      span.className = "link-preview-letter";
      span.textContent = letter;
      cell.appendChild(span);
    }
    const img = document.createElement("img");
    img.className = "link-preview-plant";
    img.alt = "";
    gsap.set(img, { scale: 0, opacity: 0 });
    cell.appendChild(img);
    grid.appendChild(cell);
    cells.push(img);
  }

  document.body.appendChild(preview);

  gsap.set(preview, { xPercent: -50, yPercent: -100, transformOrigin: "50% 100%" }); // anchor: bottom center

  // --- Cursor follow ---
  let leftTo, topTo;

  function initFollow() {
    leftTo = gsap.quickTo(preview, "left", { duration: PREVIEW_FOLLOW_DURATION, ease: PREVIEW_FOLLOW_EASE });
    topTo  = gsap.quickTo(preview, "top",  { duration: PREVIEW_FOLLOW_DURATION, ease: PREVIEW_FOLLOW_EASE });
  }

  // --- Bed sway (velocity-based rotation, settles with rocking) ---
  let swaySettleTimer = null;
  let prevMouseX = null, prevMouseY = null, prevMouseT = null;
  let lastClientX = 0, lastClientY = 0;
  const swayRotTo = gsap.quickTo(preview, "rotation", { duration: 0.15, ease: "power2.out" });

  function updateSway(clientX, clientY) {
    const now = performance.now();
    const dt = Math.max(now - (prevMouseT ?? now), 8);
    const dx = clientX - (prevMouseX ?? clientX);
    const dy = clientY - (prevMouseY ?? clientY);
    prevMouseX = clientX;
    prevMouseY = clientY;
    prevMouseT = now;

    const speed = Math.sqrt(dx * dx + dy * dy) / dt;
    const magnitude = Math.min(speed * SWAY_VELOCITY_FACTOR, SWAY_MAX_DEG);
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const rotation = (dx / len) * magnitude; // left/right sway from movement direction

    swayRotTo(rotation);

    clearTimeout(swaySettleTimer);
    swaySettleTimer = setTimeout(() => {
      gsap.to(preview, {
        rotation: 0,
        duration: SWAY_SETTLE_DURATION,
        ease: SWAY_SETTLE_EASE,
      });
    }, SWAY_SETTLE_DELAY);
  }

  function resetSway() {
    clearTimeout(swaySettleTimer);
    swaySettleTimer = null;
    prevMouseX = prevMouseY = prevMouseT = null;
    gsap.set(preview, { rotation: 0 });
  }

  // --- Garden bed shadow ---
  const bedShadow = { ...SHADOW_ZERO };
  function applyBedShadow() {
    preview.style.filter = bedShadow.alpha > 0
      ? `drop-shadow(0 ${bedShadow.y}px ${bedShadow.blur}px rgba(${Math.round(bedShadow.r)},${Math.round(bedShadow.g)},${Math.round(bedShadow.b)},${bedShadow.alpha}))`
      : "none";
  }

  // --- Snake animation ---
  let loopTimer = null;
  let plantIdx = 0;
  let snakeState = new Array(SNAKE_PATH.length).fill(null);

  function pickPlant() {
    const plant = PLANTS[PLANT_ORDER[plantIdx % PLANT_ORDER.length]];
    plantIdx++;
    return plant;
  }

  function slideIn(step, src, delay) {
    const s = SNAKE_PATH[step];
    const img = cells[s.cell];
    gsap.fromTo(img,
      { x: s.in[0], y: s.in[1], opacity: 1, scale: 1 },
      { x: 0, y: 0, duration: SNAKE_SLIDE_DURATION, ease: "power2.out", delay,
        immediateRender: false,
        onStart: () => { img.src = src; }
      }
    );
    if (s.in[0] !== 0) {
      const lean = s.in[0] < 0 ? -SNAKE_WOBBLE : SNAKE_WOBBLE;
      gsap.fromTo(img,
        { rotation: lean },
        { rotation: 0, duration: SNAKE_SLIDE_DURATION * 2, ease: SNAKE_WOBBLE_EASE,
          delay, immediateRender: false }
      );
    }
  }

  function slideOut(step) {
    const s = SNAKE_PATH[step];
    const img = cells[s.cell];
    gsap.killTweensOf(img);
    gsap.set(img, { x: 0, y: 0, rotation: 0 });
    gsap.to(img, {
      x: s.out[0], y: s.out[1],
      duration: SNAKE_SLIDE_DURATION, ease: "power2.in",
    });
  }

  function tick() {
    const last = SNAKE_PATH.length - 1;
    const delay = SNAKE_SLIDE_DURATION;

    // Exit the tail
    if (snakeState[last] !== null) slideOut(last);

    // Shift each position: exit current, fresh plant enters
    for (let i = last; i > 0; i--) {
      if (snakeState[i - 1] !== null) {
        slideOut(i - 1);
        snakeState[i] = pickPlant();
        slideIn(i, snakeState[i], delay);
      } else {
        snakeState[i] = null;
      }
    }

    // New plant enters cell 0 after the exit completes
    snakeState[0] = pickPlant();
    slideIn(0, snakeState[0], delay);

    loopTimer = setTimeout(tick, SNAKE_BEAT);
  }

  function startLoop() {
    plantIdx = 0;
    snakeState = new Array(SNAKE_PATH.length).fill(null);
    tick();
  }

  function stopLoop() {
    if (loopTimer) { clearTimeout(loopTimer); loopTimer = null; }
    cells.forEach((img) => {
      gsap.killTweensOf(img);
      gsap.set(img, { scale: 0, opacity: 0, x: 0, y: 0, rotation: 0 });
    });
    snakeState = new Array(SNAKE_PATH.length).fill(null);
  }

  // --- Hover wiring ---
  function isInLinkOrPreview(x, y) {
    const inLink = [...links].some((link) => {
      const r = link.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    });
    const r = preview.getBoundingClientRect();
    const inPreview = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    return inLink || inPreview;
  }

  function hidePreview() {
    stopLoop();
    resetSway();
    document.removeEventListener("mousemove", docMoveHandler);
    gsap.killTweensOf(preview);
    gsap.killTweensOf(bedShadow);
    Object.assign(bedShadow, SHADOW_ZERO);
    applyBedShadow();
    gsap.set(preview, { display: "none", opacity: 0, scale: 0, y: 0 });
    const siblings = document.querySelectorAll(".intro p");
    gsap.to(siblings, { opacity: 1, duration: DIM_DURATION, ease: "power2.out" });
  }

  function docMoveHandler(e) {
    lastClientX = e.clientX;
    lastClientY = e.clientY;
    leftTo(e.clientX);
    topTo(e.clientY - PREVIEW_GAP);
    updateSway(e.clientX, e.clientY);
    if (!isInLinkOrPreview(e.clientX, e.clientY)) hidePreview();
  }

  links.forEach((link) => {
    const parentP = link.closest("p");
    const siblings = document.querySelectorAll(".intro p");
    const dimTargets = [...siblings].filter((p) => p !== parentP);

    link.addEventListener("mouseenter", (e) => {
      Object.assign(bedShadow, SHADOW_ZERO);
      applyBedShadow();
      prevMouseX = lastClientX = e.clientX;
      prevMouseY = lastClientY = e.clientY;
      prevMouseT = performance.now();
      gsap.set(preview, { left: e.clientX, top: e.clientY - PREVIEW_GAP, y: PREVIEW_GAP, display: "block", scale: 0, opacity: 0 });
      gsap.set(preview, { rotation: 0 });
      initFollow();
      gsap.to(preview, { y: 0, opacity: 1, scale: 1, duration: PREVIEW_POP_DURATION, ease: PREVIEW_POP_EASE });
      gsap.to(bedShadow, { ...SHADOW_HOVER, duration: PREVIEW_POP_DURATION, ease: "power2.out", onUpdate: applyBedShadow });
      gsap.to(dimTargets, { opacity: DIM_OPACITY, duration: DIM_DURATION, ease: "power2.out" });
      startLoop();
      document.addEventListener("mousemove", docMoveHandler);
    });

    link.addEventListener("mouseleave", () => {
      if (!isInLinkOrPreview(lastClientX, lastClientY)) hidePreview();
    });
  });

  document.documentElement.addEventListener("mouseleave", hidePreview);
}

// ===========================================================================
// Boot
// ===========================================================================

initLogo();
if (IS_DESKTOP) initPlotsPreview();
