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
    els.catview.hidden = false;

    // Mount the faded build-up background scrub (no-op for non-buildup categories).
    if (bgCleanup) { bgCleanup(); bgCleanup = null; }
    bgCleanup = MC.mountCatBuildup(els.catview);

    // Hide the hero while a category is open, so the category (and its build-up
    // background) is what fills the screen.
    if (els.hero) els.hero.style.display = "none";

    const gsap = window.gsap;
    const canMorph = gsap && !prefersReduced && card;

    if (!canMorph) {
      els.menu.style.display = "none";
      scrollToY(0, true);
      els.back && els.back.focus();
      return;
    }

    const first = card.getBoundingClientRect();
    els.menu.style.display = "none";
    scrollToY(0, true);

    const clone = card.cloneNode(true);
    clone.classList.add("flip-clone");
    Object.assign(clone.style, {
      left: `${first.left}px`, top: `${first.top}px`,
      width: `${first.width}px`, height: `${first.height}px`,
    });
    document.body.appendChild(clone);

    const pad = Math.min(window.innerWidth * 0.05, 40);
    const target = {
      left: pad, top: pad,
      width: window.innerWidth - pad * 2,
      height: window.innerHeight - pad * 2,
    };

    els.catview.style.opacity = "0";

    gsap.to(clone, {
      left: target.left, top: target.top,
      width: target.width, height: target.height,
      duration: 0.6, ease: "power3.inOut",
      onComplete: () => {
        clone.remove();
        els.catview.style.opacity = "";
        els.back && els.back.focus();
      },
    });
    // Content fades in over the last 200ms of the 600ms morph.
    gsap.to(els.catview, { opacity: 1, duration: 0.2, delay: 0.4 });
  }

  function closeCategory() {
    isOpen = false;
    if (bgCleanup) { bgCleanup(); bgCleanup = null; }
    els.catview.hidden = true;
    els.catview.style.opacity = "";
    els.menu.style.display = "";
    if (els.hero) els.hero.style.display = "";
    scrollToY(savedScrollY, true); // restore exact previous position
    window.ScrollTrigger && window.ScrollTrigger.refresh && window.ScrollTrigger.refresh();
  }
})(window.MC);
