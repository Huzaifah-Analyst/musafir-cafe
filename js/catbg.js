// catbg.js — faded build-up background that scrubs on scroll inside a category view.
// Frames come from the SECOND Mojito clip (empty glass -> ice -> strawberries -> drink).
// Classic script; exposes MC.mountCatBuildup(catviewEl) -> cleanup fn.
// Lazy: frames load only when this is mounted (i.e. when the Mojito category opens).

window.MC = window.MC || {};

(function (MC) {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const VER = "3"; // bump whenever frames are re-exported, to bust browser cache
  const CFG = {
    count: 60, pad: 4,
    dir: "assets/frames/category",
    prefix: "mojito_", ext: "webp",
    poster: "assets/img/mojito-cat-poster.webp?v=" + VER,
  };
  const framePath = (i) =>
    `${CFG.dir}/${CFG.prefix}${String(i).padStart(CFG.pad, "0")}.${CFG.ext}?v=${VER}`;

  // Mounts the scrubbing background. Returns a cleanup function (always safe to call).
  MC.mountCatBuildup = function mountCatBuildup(catviewEl) {
    const canvas = catviewEl && catviewEl.querySelector("#catBgCanvas");
    if (!canvas) return function () {};

    const ctx = canvas.getContext("2d");
    let trigger = null;
    let cancelled = false;
    let lastImg = null;

    // Match the canvas bitmap to its on-screen (full-viewport) size.
    const sizeCanvas = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
    };

    // Draw the (square) frame to fill the whole canvas — "cover" fit, centered.
    const drawImg = (img) => {
      if (!img) return;
      lastImg = img;
      const cw = canvas.width, ch = canvas.height;
      const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
      if (!iw || !ih) return;
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale, dh = ih * scale;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    };

    const onResize = () => { sizeCanvas(); drawImg(lastImg); };
    window.addEventListener("resize", onResize, { passive: true });
    sizeCanvas();

    // Reduced motion or no GSAP: just show the finished drink, faded, no scrub.
    const gsap = window.gsap;
    if (prefersReduced || !gsap || !window.ScrollTrigger) {
      const poster = new Image();
      poster.onload = () => drawImg(poster);
      poster.src = CFG.poster;
      return function () { window.removeEventListener("resize", onResize); };
    }

    // Preload all frames, then bind the scrub. Draw frame 1 as soon as it's ready
    // so there's never a blank stage.
    const frames = new Array(CFG.count);
    let loaded = 0;

    const bind = () => {
      if (cancelled) return;
      trigger = window.ScrollTrigger.create({
        trigger: catviewEl,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
        onUpdate: (self) => {
          const idx = Math.min(CFG.count - 1, Math.round(self.progress * (CFG.count - 1)));
          drawImg(frames[idx]);
        },
        // Fade the backdrop out once we scroll past the category content.
        onLeave: () => { canvas.style.opacity = "0"; },
        onEnterBack: () => { canvas.style.opacity = ""; },
      });
      window.ScrollTrigger.refresh();
    };

    for (let i = 0; i < CFG.count; i++) {
      const img = new Image();
      img.onload = img.onerror = () => {
        loaded += 1;
        if (i === 0) drawImg(img);           // first frame up immediately
        if (loaded === CFG.count) bind();
      };
      img.src = framePath(i + 1);
      frames[i] = img;
    }

    return function cleanup() {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      if (trigger) { trigger.kill(); trigger = null; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  };
})(window.MC);
