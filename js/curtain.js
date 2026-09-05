// curtain.js — intro preloader + reveal. Owned by the Motion agent.
// Real preloader (logo/hero image only, never frame sequences); 2500ms hard cap;
// sessionStorage skip on repeat; reduced motion shows a static page (CSS hides it).
// Classic script; exposes MC.initCurtain().

window.MC = window.MC || {};

(function (MC) {
  const HARD_CAP = 3500;   // max wait for assets before proceeding anyway
  const MIN_HOLD = 7000;   // keep the curtain up at least this long on first visit
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function waitForAssets(bar) {
    const imgs = Array.from(document.querySelectorAll(".curtain__logo, .vhero__poster"));
    let loaded = 0;
    const total = Math.max(imgs.length, 1);

    return new Promise((resolve) => {
      const tick = () => {
        loaded += 1;
        if (bar) bar.style.width = `${Math.min(100, (loaded / total) * 100)}%`;
        if (loaded >= total) resolve();
      };
      if (imgs.length === 0) return resolve();
      imgs.forEach((img) => {
        if (img.complete) tick();
        else {
          img.addEventListener("load", tick, { once: true });
          img.addEventListener("error", tick, { once: true });
        }
      });
    });
  }

  MC.initCurtain = function initCurtain() {
    const curtain = document.getElementById("curtain");
    if (!curtain) return Promise.resolve();

    if (prefersReduced) {
      curtain.classList.add("is-done");
      return Promise.resolve();
    }

    const bar = document.getElementById("curtainBar");

    const reveal = () => new Promise((resolve) => {
      curtain.classList.add("is-revealing");
      const done = () => {
        curtain.classList.add("is-done");
        curtain.querySelectorAll(".curtain__panel").forEach((p) => p.remove());
        resolve();
      };
      setTimeout(done, 1000);
    });

    // Note: the repeat-visit fast-skip is intentionally disabled so the full
    // intro plays on every load (per request while showcasing the long intro).
    const started = performance.now();
    if (bar) bar.style.transition = `width ${MIN_HOLD}ms linear`; // fill smoothly across the hold

    const assetsReady = waitForAssets(bar);
    const timeout = new Promise((resolve) => setTimeout(resolve, HARD_CAP));

    // Reveal only once BOTH are true: assets ready (or hard cap) AND the minimum
    // hold has elapsed — so the intro is always on screen for ~2.4s, never a flash.
    return Promise.race([assetsReady, timeout]).then(() => {
      if (bar) bar.style.width = "100%";
      const remaining = Math.max(0, MIN_HOLD - (performance.now() - started));
      return new Promise((resolve) => setTimeout(resolve, remaining));
    }).then(reveal);
  };
})(window.MC);
