import gsap from "https://cdn.jsdelivr.net/npm/gsap@3.12.7/+esm";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const IS_DESKTOP = window.matchMedia("(min-width: 769px)").matches;
const logo = document.querySelector(".logo");

// ---------------------------------------------------------------------------
// Logo shadow
// ---------------------------------------------------------------------------

const shadow = { y: 0, blur: 0, alpha: 0, r: 0, g: 0, b: 0 };
const SHADOW_HOVER = { y: 14, blur: 12, alpha: 0.16, r: 4, g: 93, b: 43 };
const SHADOW_ZERO = { y: 0, blur: 0, alpha: 0, r: 0, g: 0, b: 0 };

function applyShadow() {
  logo.style.filter = shadow.alpha > 0
    ? `drop-shadow(0 ${shadow.y}px ${shadow.blur}px rgba(${Math.round(shadow.r)},${Math.round(shadow.g)},${Math.round(shadow.b)},${shadow.alpha}))`
    : "none";
}

// ---------------------------------------------------------------------------
// Logo intro animation
// ---------------------------------------------------------------------------

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

  tl.fromTo(
    logo,
    { opacity: 0, x: 12, y: 24, scale: 0.4, rotation: -48 },
    { opacity: 1, x: 0, y: -20, scale: 1.06, rotation: 12, duration: 0.6, ease: "power3.inOut" }
  );

  tl.to(logo, { x: 0, y: -8, scale: 1, rotation: 0, duration: 1, ease: "elastic.out(1, 0.5)" });
}

function initLogo() {
  if (!logo) return;

  let fired = false;
  function go() {
    if (fired) return;
    fired = true;
    requestAnimationFrame(() => requestAnimationFrame(playLogoIntro));
  }

  if (logo.complete && logo.naturalWidth) {
    go();
  } else {
    logo.addEventListener("load", go);
    window.addEventListener("load", go);
    setTimeout(go, 2000);
  }
}

// ---------------------------------------------------------------------------
// Logo magnet — follows cursor on hover, springs back on leave
// ---------------------------------------------------------------------------

function initMagnet() {
  const xTo = gsap.quickTo(logo, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
  const yTo = gsap.quickTo(logo, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });
  const rotYTo = gsap.quickTo(logo, "rotationY", { duration: 1, ease: "elastic.out(1, 0.3)" });
  const rotXTo = gsap.quickTo(logo, "rotationX", { duration: 1, ease: "elastic.out(1, 0.3)" });

  const TILT = 10;
  let hovering = false;
  const dimTargets = document.querySelectorAll(".intro p:not(:last-child)");

  gsap.set(logo, { transformPerspective: 500 });

  function enterState() {
    if (hovering) return;
    hovering = true;
    gsap.to(logo, { scale: 1.1, duration: 0.2, ease: "power2.out" });
    gsap.to(shadow, { ...SHADOW_HOVER, duration: 0.3, ease: "power2.out", onUpdate: applyShadow });
    gsap.to(dimTargets, { opacity: 0.4, duration: 0.4, ease: "power2.out" });
  }

  logo.addEventListener("mousemove", (e) => {
    enterState();
    const { left, top, width, height } = logo.getBoundingClientRect();
    const dx = e.clientX - (left + width / 2);
    const dy = e.clientY - (top + height / 2);
    xTo(dx);
    yTo(dy);
    rotYTo((dx / (width / 2)) * TILT);
    rotXTo(-(dy / (height / 2)) * TILT);
  });

  logo.addEventListener("mouseleave", () => {
    hovering = false;
    xTo(0);
    yTo(0);
    rotYTo(0);
    rotXTo(0);
    gsap.to(logo, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.4)" });
    gsap.to(shadow, { ...SHADOW_ZERO, duration: 0.6, ease: "elastic.out(1, 0.4)", onUpdate: applyShadow });
    gsap.to(dimTargets, { opacity: 1, duration: 0.4, ease: "power2.out" });
  });
}

// ---------------------------------------------------------------------------
// Plots preview — 3x3 garden bed with rippling plant animation
// ---------------------------------------------------------------------------

const PLANTS = [
  "/images/plants/tomato-globe@thumb.webp",
  "/images/plants/sunflower@thumb.webp",
  "/images/plants/lettuce-looseleaf@thumb.webp",
  "/images/plants/pepper-bell@thumb.webp",
  "/images/plants/marigold@thumb.webp",
  "/images/plants/zucchini@thumb.webp",
  "/images/plants/pea-shelling@thumb.webp",
  "/images/plants/squash-pumpkin@thumb.webp",
];

const PLANT_ORDER = [0, 1, 2, 3, 4, 5, 6, 7];

const RINGS = [
  [4],
  [1, 3, 5, 7],
  [0, 2, 6, 8],
];

function initLinkPreviews() {
  const links = document.querySelectorAll("[data-preview]");
  if (!links.length) return;

  // Build the preview container
  const preview = document.createElement("div");
  preview.className = "link-preview";

  const bg = document.createElement("img");
  bg.className = "link-preview-bg";
  bg.src = "/images/plots-bed.png";
  bg.alt = "";
  preview.appendChild(bg);

  const grid = document.createElement("div");
  grid.className = "link-preview-grid";
  preview.appendChild(grid);

  const cells = [];
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.className = "link-preview-cell";
    const img = document.createElement("img");
    img.className = "link-preview-plant";
    img.alt = "";
    gsap.set(img, { scale: 0, opacity: 0 });
    cell.appendChild(img);
    grid.appendChild(cell);
    cells.push(img);
  }

  document.body.appendChild(preview);

  // Cursor follow
  const GAP = 32;
  const leftTo = gsap.quickTo(preview, "left", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
  const topTo = gsap.quickTo(preview, "top", { duration: 0.8, ease: "elastic.out(1, 0.4)" });

  // Plant state — snake animation: plants slide through 0→1→...→8
  let loopTimer = null;
  let orderIdx = 0;
  const BEAT = 400;
  const SLIDE_DUR = 0.25;

  let cellState = new Array(9).fill(null);

  function pickPlant() {
    const plant = PLANTS[PLANT_ORDER[orderIdx % PLANT_ORDER.length]];
    orderIdx++;
    return plant;
  }

  function slideIn(cellIdx, src) {
    const img = cells[cellIdx];
    img.src = src;
    cellState[cellIdx] = src;
    gsap.fromTo(img,
      { xPercent: -120, opacity: 1, scale: 1 },
      { xPercent: 0, duration: SLIDE_DUR, ease: "power2.out" }
    );
  }

  function slideOut(cellIdx) {
    const img = cells[cellIdx];
    cellState[cellIdx] = null;
    gsap.to(img, { xPercent: 120, duration: SLIDE_DUR, ease: "power2.in" });
  }

  function tick() {
    // Cell 8 exits
    if (cellState[8] !== null) slideOut(8);

    // Shift each cell: slide out current, slide in from previous
    for (let i = 8; i > 0; i--) {
      if (cellState[i - 1] !== null) {
        if (cellState[i] !== null) slideOut(i);
        slideIn(i, cellState[i - 1]);
      }
    }

    // New plant slides into cell 0
    slideIn(0, pickPlant());

    loopTimer = setTimeout(tick, BEAT);
  }

  function startLoop() {
    orderIdx = 0;
    cellState = new Array(9).fill(null);
    tick();
  }

  function stopLoop() {
    if (loopTimer) { clearTimeout(loopTimer); loopTimer = null; }
    cells.forEach((img) => {
      gsap.killTweensOf(img);
      gsap.set(img, { xPercent: 0, opacity: 0 });
    });
    cellState = new Array(9).fill(null);
  }

  // Wire up hover
  links.forEach((link) => {
    const parentP = link.closest("p");
    const siblings = document.querySelectorAll(".intro p");
    const dimTargets = [...siblings].filter((p) => p !== parentP);

    link.addEventListener("mouseenter", (e) => {
      gsap.set(preview, { left: e.clientX, top: e.clientY - GAP, display: "block" });
      gsap.to(preview, { opacity: 1, duration: 0.25, ease: "power2.out" });
      gsap.to(dimTargets, { opacity: 0.4, duration: 0.4, ease: "power2.out" });
      startLoop();
    });

    link.addEventListener("mousemove", (e) => {
      leftTo(e.clientX);
      topTo(e.clientY - GAP);
    });

    link.addEventListener("mouseleave", () => {
      stopLoop();
      gsap.to(preview, {
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => gsap.set(preview, { display: "none" }),
      });
      gsap.to(dimTargets, { opacity: 1, duration: 0.4, ease: "power2.out" });
    });
  });
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

initLogo();
if (IS_DESKTOP) initLinkPreviews();
