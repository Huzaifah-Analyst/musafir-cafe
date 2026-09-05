// menu.js — loads data/menu.json and renders the category view + WhatsApp links.
// The card grid itself is already in the HTML source (no-JS readable); this module
// powers the interactive full-category view and keeps prices in one file.
// Classic script (no ES modules) so the demo runs from file:// by double-click.

window.MC = window.MC || {};

(function (MC) {
  let cache = null;

  MC.loadMenu = async function loadMenu() {
    if (cache) return cache;
    try {
      const res = await fetch("data/menu.json", { cache: "no-cache" });
      if (!res.ok) throw new Error(res.status);
      cache = await res.json();
    } catch (err) {
      // fetch() fails on file:// in some browsers. The inline HTML menu still stands,
      // and flip.js can rebuild categories from the DOM.
      console.warn("menu.json could not be loaded; using inline HTML fallback.", err);
      cache = null;
    }
    return cache;
  };

  MC.whatsappLink = function whatsappLink(number, message) {
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  };

  // Build the inner HTML for a category's full view.
  MC.renderCategory = function renderCategory(cat, brand) {
    const number = (brand && brand.whatsappNumber) || "923000000000";
    const drinks = cat.items.map((item) => {
      const msg = `Assalam o alaikum Musafir Cafe, one ${item.name} please.`;
      const note = item.descNote
        ? `<p class="drink__note">Note for the client: ${item.descNote}</p>`
        : "";
      return `
        <li class="drink">
          <div>
            <p class="drink__name">${item.name}</p>
            <p class="drink__desc">${item.desc}</p>
          </div>
          <p class="drink__price">PKR ${item.price}</p>
          <a class="btn btn--solid drink__order" href="${MC.whatsappLink(number, msg)}" target="_blank" rel="noopener">Order on WhatsApp</a>
          ${note}
        </li>`;
    }).join("");

    // Faded build-up background (canvas scrubs on scroll) — only where enabled.
    const stage = cat.hasBuildup
      ? `<div class="catview__stage" aria-hidden="true"><canvas class="catview__bgcanvas" id="catBgCanvas" width="640" height="640"></canvas></div>`
      : "";

    // Ingredients block.
    const ingredients = (cat.ingredients && cat.ingredients.length)
      ? `<section class="catview__ingredients" aria-labelledby="ingHead">
           <h3 id="ingHead">What goes in</h3>
           <ul class="ing-list">${cat.ingredients.map((i) => `<li>${i}</li>`).join("")}</ul>
           ${cat.hasBuildup ? `<p class="catview__buildnote">Scroll to watch it come together — ice first, then the strawberries, then the drink.</p>` : ""}
         </section>`
      : "";

    return `
      ${stage}
      <div class="catview__content">
        <div class="catview__hero">
          <span class="card__illus" aria-hidden="true" data-illus="${cat.illustration}"></span>
          <h2 class="catview__title">${cat.name}</h2>
          <p class="eyebrow">${cat.items.length} drinks · from PKR ${cat.from}</p>
        </div>
        <ul class="catview__drinks">${drinks}</ul>
        ${ingredients}
      </div>`;
  };

  // Wire the WhatsApp links from data where present.
  MC.applyBrandLinks = function applyBrandLinks(brand) {
    if (!brand) return;
    const wa = MC.whatsappLink(
      brand.whatsappNumber,
      "Assalam o alaikum Musafir Cafe, I'd like to place an order."
    );
    document.querySelectorAll('a[href*="wa.me"]').forEach((a) => { a.href = wa; });

    // Maps link — keep menu.json as the single source of truth.
    if (brand.mapsUrl) {
      document.querySelectorAll('.visit__map, a[href*="maps.app.goo.gl"], a[href*="maps.google"]')
        .forEach((a) => { a.href = brand.mapsUrl; });
    }
  };
})(window.MC);
