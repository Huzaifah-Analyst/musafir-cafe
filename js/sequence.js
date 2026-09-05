// sequence.js — canvas frame scrubber for the signature Mojito. Owned by the Sequence agent.
//  - Mobile (<768px): NO canvas scrubbing. Static poster (looping MP4 in prod).
//  - Reduced motion: static final frame, no scrub.
//  - Never show a half-loaded sequence: preload with progress, then scrub.
//  - Frames lazy-load; never block first paint. Absent frames → poster fallback.
// Classic script; exposes MC.initSequence().

window.MC = window.MC || {};

(function (MC) {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Populate assets/frames/desktop with mojito_0001.webp … per the README pipeline.
  const VER = "2"; // bump whenever frames are re-exported, to bust browser cache
  const CFG = {
    count: 71, pad: 4,
    dir: "assets/frames/desktop",
    prefix: "mojito_", ext: "webp",
    poster: "assets/img/mojito-poster.webp?v=" + VER,
  };
  const framePath = (i) =>
    `${CFG.dir}/${CFG.prefix}${String(i).padStart(CFG.pad, "0")}.${CFG.ext}?v=${VER}`;

  MC.initSequence = function initSequence() {
    const fig = document.getElementById("heroDrink");
    const canvas = document.getElementById("mojitoCanvas");
    if (!fig || !canvas) return;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (isMobile || prefersReduced) { showPoster(canvas); return; }

    // Probe frame 1. Missing (demo default) → poster instead of an empty canvas.
    const probe = new Image();
    probe.onload = () => loadAndScrub(fig, canvas);
    probe.onerror = () => {
      console.info(
        "[sequence] No frames in assets/frames/desktop — showing poster. " +
        "Run the ffmpeg + cwebp pipeline (README) to enable the scrubber."
      );
      showPoster(canvas);
    };
    probe.src = framePath(1);
  };

  function showPoster(canvas) {
    const img = new Image();
    img.src = CFG.poster;
    img.alt = "";
    img.width = 640; img.height = 640;
    img.decoding = "async";
    canvas.replaceWith(img);
  }

  function loadAndScrub(fig, canvas) {
    const ctx = canvas.getContext("2d");
    const frames = new Array(CFG.count);
    let loaded = 0;

    const progress = document.createElement("div");
    progress.className = "seq-progress";
    progress.setAttribute("role", "progressbar");
    progress.setAttribute("aria-label", "Loading animation");
    progress.style.cssText =
      "position:absolute;left:50%;bottom:12%;transform:translateX(-50%);" +
      "color:var(--terracotta);font-size:0.8rem;letter-spacing:0.1em;";
    fig.appendChild(progress);

    const draw = (i) => {
      const img = frames[i];
      if (!img) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };

    const onOne = () => {
      loaded += 1;
      progress.textContent = `Loading ${Math.round((loaded / CFG.count) * 100)}%`;
      if (loaded === CFG.count) {
        progress.remove();
        draw(0);
        bindScrub(canvas, frames, draw);
      }
    };

    for (let i = 0; i < CFG.count; i++) {
      const img = new Image();
      img.onload = onOne;
      img.onerror = onOne;
      img.src = framePath(i + 1);
      frames[i] = img;
    }
  }

  function bindScrub(canvas, frames, draw) {
    const gsap = window.gsap;
    const last = frames.length - 1;
    if (!gsap || !window.ScrollTrigger) { draw(last); return; }

    const state = { f: 0 };
    gsap.to(state, {
      f: last, ease: "none",
      scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: 0.5 },
      onUpdate: () => draw(Math.round(state.f)),
    });
  }
})(window.MC);
