// main.js — entry point / orchestration. Classic script; runs after the others (defer order).

window.MC = window.MC || {};

(function (MC) {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Signal JS is on (CSS hides the no-JS inline item lists).
  document.documentElement.classList.add("js-on");

  // Lenis smooth scroll (client requested). Off under reduced motion.
  function initSmoothScroll() {
    const gsap = window.gsap;
    if (prefersReduced || !window.Lenis || !gsap) return;

    const lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    MC.lenis = lenis;

    if (window.ScrollTrigger) lenis.on("scroll", window.ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // Smooth in-page anchor links, but leave the card routing links (#/...) alone.
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      const href = a.getAttribute("href");
      if (!href || href === "#" || href.startsWith("#/")) return;
      a.addEventListener("click", (e) => {
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target);
      });
    });
  }

  function waitForGsap(timeout = 1500) {
    return new Promise((resolve) => {
      if (window.gsap) return resolve();
      const start = performance.now();
      const check = () => {
        if (window.gsap || performance.now() - start > timeout) resolve();
        else requestAnimationFrame(check);
      };
      check();
    });
  }

  function initNav() {
    const nav = document.getElementById("nav");
    const toggle = document.getElementById("navToggle");
    const navMenu = document.getElementById("navMenu");
    if (!nav) return;

    toggle && toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      navMenu.hidden = open;
    });
    navMenu && navMenu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        navMenu.hidden = true;
        toggle && toggle.setAttribute("aria-expanded", "false");
      })
    );

    let lastY = window.scrollY;
    let ticking = false;
    const isMobile = () => window.matchMedia("(max-width: 767px)").matches;

    const update = () => {
      ticking = false;
      const y = window.scrollY;
      nav.classList.toggle("is-scrolled", y > 80);
      if (isMobile() && navMenu.hidden) {
        if (y > lastY && y > 200) nav.classList.add("is-hidden");
        else nav.classList.remove("is-hidden");
      } else {
        nav.classList.remove("is-hidden");
      }
      lastY = y;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  async function boot() {
    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());

    initNav();

    // Curtain first (it's the preloader). Don't block the rest of init on it.
    const curtainDone = MC.initCurtain();

    await waitForGsap();

    initSmoothScroll();

    const data = await MC.loadMenu();
    MC.applyBrandLinks(data && data.brand);

    MC.initCards();
    await MC.initFlip();
    MC.initHero();

    await curtainDone;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})(window.MC);
