// flip.js — card → fullscreen category morph + History API routing.
// Owned by the Motion agent. Reduced motion / no-GSAP path shows the view instantly.
// Classic script; exposes MC.initFlip(). Depends on MC.loadMenu / MC.renderCategory.

window.MC = window.MC || {};

(function (MC) {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let menuData = null;
  let savedScrollY = 0;
  let isOpen = false;
  let pendingCard = null;
  let bgCleanup = null;   // tears down the build-up background scrub
  const els = {};

  // Lenis-aware scroll (falls back to native).
  function scrollToY(y, immediate) {
    if (MC.lenis) MC.lenis.scrollTo(y, { immediate: !!immediate });
    else window.scrollTo(0, y);
  }

  MC.initFlip = async function initFlip() {
    els.menu = document.getElementById("menu");
    els.hero = document.getElementById("hero");
    els.catview = document.getElementById("catview");
    els.body = document.getElementById("catviewBody");
    els.back = document.getElementById("catviewBack");
    els.cards = document.getElementById("cards");
    if (!els.catview || !els.body) return;

    menuData = await MC.loadMenu();

    els.cards && els.cards.addEventListener("click", (e) => {
      const link = e.target.closest(".card__link");
      if (!link) return;
      e.preventDefault();
      const card = link.closest(".card");
      const id = card && card.dataset.category;
      if (id) navigateTo(id, card);
    });

    els.back && els.back.addEventListener("click", () => history.back());

    window.addEventListener("hashchange", syncFromHash);
    if (getHashId()) syncFromHash();
  };

  function getHashId() {
    const m = location.hash.match(/^#\/(.+)$/);
    return m ? m[1] : null;
  }

  function findCategory(id) {
    if (menuData && menuData.categories) {
      const cat = menuData.categories.find((c) => c.id === id);
      if (cat) return cat;
    }
    return buildFromDOM(id);
  }

  // Reconstruct a category from the inline HTML card (always present, file:// safe).
  function buildFromDOM(id) {
    const card = document.querySelector(`.card[data-category="${id}"]`);
    if (!card) return null;
    const items = Array.from(card.querySelectorAll(".card__items li")).map((li) => ({
      name: (li.querySelector(".item__name") || {}).textContent?.trim() || "",
      price: Number(((li.querySelector(".item__price") || {}).textContent || "").replace(/\D/g, "")) || "",
      desc: (li.querySelector(".item__desc") || {}).textContent?.trim() || "",
    }));
    return {
      id,
      name: (card.querySelector(".card__name") || {}).textContent?.trim() || id,
      illustration: (card.querySelector(".card__illus") || {}).dataset?.illus || "",
      from: items.reduce((min, it) => Math.min(min, it.price || Infinity), Infinity),
      items,
    };
  }

  function navigateTo(id, card) {
    pendingCard = card || null;
    location.hash = `#/${id}`;
  }

  function syncFromHash() {
    const id = getHashId();
    if (id && !isOpen) {
      openCategory(id, pendingCard);
      pendingCard = null;
    } else if (!id && isOpen) {
      closeCategory();
    } else if (id && isOpen) {
      const cat = findCategory(id);
      if (cat) {
        if (bgCleanup) { bgCleanup(); bgCleanup = null; }
        els.body.innerHTML = MC.renderCategory(cat, menuData && menuData.brand);
        bgCleanup = MC.mountCatBuildup(els.catview);
      }
    }
  }

  function openCategory(id, card) {
    const cat = findCategory(id);
    if (!cat) return;

    savedScrollY = window.scrollY;
    isOpen = true;
    els.body.innerHTML = MC.renderCategory(cat, menuData && menuData.brand);

    // The "teleport": hide the home page, jump to top, reveal the category, mount
    // its build-up background. Kept OFF the animation frame — either done instantly
    // (no-morph path) or once the clone fully covers the screen (so it's invisible).
    const reveal = () => {
      els.menu.style.display = "none";
      if (els.hero) els.hero.style.display = "none";
      scrollToY(0, true);
      els.catview.hidden = false;
      els.catview.style.opacity = "";
      // Defer the heavy frame preload one frame so it never blocks the morph.
      requestAnimationFrame(() => {
        if (bgCleanup) { bgCleanup(); bgCleanup = null; }
        bgCleanup = MC.mountCatBuildup(els.catview);
      });
      els.back && els.back.focus();
    };

    if (MC.heroPause) MC.heroPause(); // stop the hero videos decoding/advancing

    const gsap = window.gsap;
    const canMorph = gsap && !prefersReduced && card;
    if (!canMorph) { reveal(); return; }

    // Morph a clone of the card to full-screen. The home page stays put underneath
    // until the clone covers the viewport, so there is no visible jump.
    const first = card.getBoundingClientRect();
    const clone = card.cloneNode(true);
    clone.classList.add("flip-clone");
    Object.assign(clone.style, {
      left: `${first.left}px`, top: `${first.top}px`,
      width: `${first.width}px`, height: `${first.height}px`,
    });
    document.body.appendChild(clone);

    let swapped = false;
    const swap = () => { if (swapped) return; swapped = true; reveal(); };

    gsap.to(clone, {
      left: 0, top: 0,
      width: window.innerWidth, height: window.innerHeight,
      borderRadius: 0,
      duration: 0.55, ease: "power3.inOut",
      onUpdate: function () { if (this.progress() > 0.75) swap(); }, // covered → teleport
      onComplete: () => { swap(); clone.remove(); },
    });
    // Safety: never leave the category unopened if the tween is interrupted.
    setTimeout(() => { swap(); if (clone.parentNode) clone.remove(); }, 800);
  }

  function closeCategory() {
    isOpen = false;
    if (bgCleanup) { bgCleanup(); bgCleanup = null; }
    els.catview.hidden = true;
    els.catview.style.opacity = "";
    els.menu.style.display = "";
    if (els.hero) els.hero.style.display = "";
    if (MC.heroResume) MC.heroResume(); // restart the hero carousel
    scrollToY(savedScrollY, true); // restore exact previous position
    window.ScrollTrigger && window.ScrollTrigger.refresh && window.ScrollTrigger.refresh();
  }
})(window.MC);
