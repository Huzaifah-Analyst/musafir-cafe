// catbg.js — faded, full-screen, scroll-scrubbed build-up background for a category.
// Frames + count + poster come from the canvas's data-* attributes (set per category
// in menu.js), so any category with hasBuildup gets its own build-up. Lazy: frames
// load only when that category opens. Classic script; exposes MC.mountCatBuildup().

window.MC = window.MC || {};

(function (MC) {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const VER = "4"; // bump whenever any category frames are re-exported (cache-bust)
  const pad4 = (n) => String(n).padStart(4, "0");

  // Mounts the scrubbing background. Returns a cleanup function (always safe to call).
  MC.mountCatBuildup = function mountCatBuildup(catviewEl) {
    const canvas = catviewEl && catviewEl.querySelector("#catBgCanvas");
    if (!canvas) return function () {};

    const dir = canvas.dataset.dir || "assets/frames/category";
    const prefix = canvas.dataset.prefix || "";
    const count = Math.max(1, parseInt(canvas.dataset.count, 10) || 0);
    const poster = canvas.dataset.poster || "";
    if (!prefix || !count) return function () {};

    const framePath = (i) => `${dir}/${prefix}${pad4(i)}.webp?v=${VER}`;

    const ctx = canvas.getContext("2d");
    let trigger = null, cancelled = false, lastImg = null;

    const sizeCanvas = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
    };

    // Draw the frame to fill the whole canvas — "cover" fit, centered.
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

    // Reduced motion / no GSAP: just show the finished drink, faded, no scrub.
    const gsap = window.gsap;
    if (prefersReduced || !gsap || !window.ScrollTrigger) {
      if (poster) { const p = new Image(); p.onload = () => drawImg(p); p.src = poster; }
      return function () { window.removeEventListener("resize", onResize); };
    }

    // Preload all frames, then bind the scrub. Frame 1 shows as soon as it's ready.
    const frames = new Array(count);
    let loaded = 0;
    const bind = () => {
      if (cancelled) return;
      trigger = window.ScrollTrigger.create({
        trigger: catviewEl,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
        onUpdate: (self) => {
          const idx = Math.min(count - 1, Math.round(self.progress * (count - 1)));
          drawImg(frames[idx]);
        },
        onLeave: () => { canvas.style.opacity = "0"; },
        onEnterBack: () => { canvas.style.opacity = ""; },
      });
      window.ScrollTrigger.refresh();
    };

    for (let k = 0; k < count; k++) {
      const img = new Image();
      img.onload = img.onerror = () => {
        loaded += 1;
        if (k === 0) drawImg(img);
        if (loaded === count) bind();
      };
      img.src = framePath(k + 1);
      frames[k] = img;
    }

    return function cleanup() {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      if (trigger) { trigger.kill(); trigger = null; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  };
})(window.MC);
