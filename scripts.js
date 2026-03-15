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

  let hovering = false;

  function enterState() {
    if (hovering) return;
    hovering = true;
    gsap.to(logo, { scale: 1.1, duration: 0.2, ease: "power2.out" });
    gsap.to(shadow, { ...SHADOW_HOVER, duration: 0.3, ease: "power2.out", onUpdate: applyShadow });
  }

  logo.addEventListener("mousemove", (e) => {
    enterState();
    const { left, top, width, height } = logo.getBoundingClientRect();
    xTo(e.clientX - (left + width / 2));
    yTo(e.clientY - (top + height / 2));
  });

  logo.addEventListener("mouseleave", () => {
    hovering = false;
    xTo(0);
    yTo(0);
    gsap.to(logo, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.4)" });
    gsap.to(shadow, { ...SHADOW_ZERO, duration: 0.6, ease: "elastic.out(1, 0.4)", onUpdate: applyShadow });
  });
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

initLogo();
