// cards.js — category grid gravity entry + focus lift. Owned by the Motion agent.
// Cards animate ONCE (data-revealed guard), never on every scroll pass.
// Classic script; exposes MC.initCards().

window.MC = window.MC || {};

(function (MC) {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  MC.initCards = function initCards() {
    const cards = Array.from(document.querySelectorAll(".card"));
    if (!cards.length) return;

    const gsap = window.gsap;

    // No GSAP or reduced motion: leave cards in their natural, visible state.
    if (!gsap || prefersReduced) {
      cards.forEach((c) => c.setAttribute("data-revealed", "true"));
      return;
    }

    gsap.registerPlugin(window.ScrollTrigger);

    // Hide first, so no flash of the settled state before animating.
    cards.forEach((c) => c.setAttribute("data-revealed", "false"));

    cards.forEach((card, i) => {
      window.ScrollTrigger.create({
        trigger: card,
        start: "top 88%",
        once: true, // animate a single time, then never again
        onEnter: () => revealCard(card, i % 3),
      });
    });

    initFocus(cards);
  };

  function revealCard(card, colIndex) {
    const gsap = window.gsap;
    // Shadow grows while the card rises, tightens as it settles — the shadow doing
    // the opposite of the card is what gives the sense of weight.
    const tl = gsap.timeline({ delay: colIndex * 0.08 }); // 80ms stagger across a row
    tl.set(card, { boxShadow: "0 6px 14px -10px rgba(43,38,33,0.14)" })
      .to(card, {
        opacity: 1, y: 0, scale: 1,
        duration: 1.1,
        ease: "elastic.out(1, 0.6)", // spring with overshoot
        onStart: () => card.setAttribute("data-revealed", "true"),
      })
      .to(card, {
        boxShadow: "0 30px 50px -22px rgba(43,38,33,0.22)",
        duration: 0.35, ease: "power2.out",
      }, 0)
      .to(card, {
        boxShadow: "0 10px 24px -14px rgba(43,38,33,0.14)",
        duration: 0.5, ease: "power3.out",
      }, 0.5);
  }

  // One card focused at a time — the one nearest the viewport centre.
  function initFocus(cards) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const mid = window.innerHeight / 2;
      let best = null, bestDist = Infinity;
      for (const card of cards) {
        const r = card.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) continue;
        const dist = Math.abs(r.top + r.height / 2 - mid);
        if (dist < bestDist) { bestDist = dist; best = card; }
      }
      cards.forEach((c) => c.classList.toggle("is-focused", c === best));
    };
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }
})(window.MC);
