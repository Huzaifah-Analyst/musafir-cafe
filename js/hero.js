// hero.js — full-width autoplay video hero that cycles through products.
// Each slide: a background video + the product name (in its accent colour) on the left.
// When a video ends, the next product crossfades in and its name slides in.
// No scroll animation here. Classic script; exposes MC.initHero(). Data-driven.

window.MC = window.MC || {};

(function (MC) {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SAFETY_MS = 12000; // advance even if 'ended' never fires

  MC.initHero = async function initHero() {
    const hero = document.getElementById("hero");
    if (!hero || !hero.classList.contains("vhero")) return;

    const els = {
      a: document.getElementById("vheroA"),
      b: document.getElementById("vheroB"),
      poster: document.getElementById("vheroPoster"),
      name: document.getElementById("vheroName"),
      dots: document.getElementById("vheroDots"),
    };

    const data = await MC.loadMenu();
    const cats = (data && data.categories) || [];
    const slides = cats
      .filter((c) => c.heroVideo)
      .map((c) => ({ id: c.id, name: c.name, accent: c.accent || "#C4633A", video: c.heroVideo, poster: c.heroPoster }));

    if (!slides.length) return; // nothing to play; poster + inline name stay

    // Dots.
    if (els.dots) {
      els.dots.innerHTML = slides.map((_, i) =>
        `<button class="vhero__dot" type="button" data-i="${i}" aria-label="Show ${slides[i].name}"></button>`
      ).join("");
    }

    const paint = (i, animate) => {
      const s = slides[i];
      if (els.name) {
        els.name.textContent = s.name;
        els.name.style.color = s.accent;
        els.name.dataset.cat = s.id;
        if (animate) { els.name.classList.remove("anim"); void els.name.offsetWidth; els.name.classList.add("anim"); }
      }
      if (els.dots) els.dots.querySelectorAll(".vhero__dot").forEach((d, di) => d.classList.toggle("is-on", di === i));
    };

    let i = 0;
    paint(0, false);

    // Reduced motion / no <video>: static poster + first name, no cycling.
    const canVideo = !prefersReduced && els.a && els.a.canPlayType && els.a.canPlayType("video/mp4");
    if (!canVideo) {
      if (els.poster && slides[0].poster) els.poster.src = slides[0].poster;
      MC.heroPause = MC.heroResume = function () {};
      return;
    }

    let active = els.a, standby = els.b, safety = null;
    const arm = () => { clearTimeout(safety); safety = setTimeout(advance, SAFETY_MS); };

    // Let other modules pause the carousel (e.g. while a category overlay is open)
    // so the videos stop decoding and the cycle doesn't advance underneath.
    MC.heroPause = function () { clearTimeout(safety); try { active.pause(); standby.pause(); } catch (e) {} };
    MC.heroResume = function () { try { const p = active.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {} arm(); };

    function showActive() {
      active.classList.add("is-active");
      standby.classList.remove("is-active");
      if (els.poster) els.poster.classList.add("is-hidden");
      const p = active.play();
      if (p && p.catch) p.catch(() => {});
      arm();
    }

    function goTo(next) {
      if (next === i) return;
      clearTimeout(safety);
      const target = standby;                 // capture the layer we're loading into
      target.src = slides[next].video;
      target.currentTime = 0;
      let done = false;
      const swap = () => {
        if (done) return;                     // run exactly once per goTo
        done = true;
        target.oncanplay = null;
        const tmp = active; active = target; standby = tmp;
        active.onended = advance;
        i = next;
        paint(i, true);
        showActive();
        try { tmp.pause(); } catch (e) {}
      };
      if (target.readyState >= 2) swap();
      else {
        target.oncanplay = swap;
        target.load();
        setTimeout(swap, 2500);               // fallback if canplay never fires
      }
    }

    const advance = () => goTo((i + 1) % slides.length);

    // Kick off slide 0.
    active.src = slides[0].video;
    active.onended = advance;
    active.addEventListener("canplay", () => { if (els.poster) els.poster.classList.add("is-hidden"); }, { once: true });
    showActive();

    // Dots jump to a slide.
    els.dots && els.dots.addEventListener("click", (e) => {
      const btn = e.target.closest(".vhero__dot");
      if (!btn) return;
      const t = Number(btn.dataset.i);
      if (t !== i) goTo(t);
    });

    // Clicking the product name opens that category.
    els.name && els.name.addEventListener("click", () => {
      const id = els.name.dataset.cat;
      if (id) location.hash = "#/" + id;
    });
  };
})(window.MC);
