# Musafir Cafe — demo site

Pitch demo for **Musafir Cafe** ([@musafircafe.pk](https://instagram.com/musafircafe.pk)), a drinks-only cafe. Built to the spec in [`musafir-cafe-build-spec.md`](musafir-cafe-build-spec.md).

Warm cream + terracotta, gold script logo, hand-drawn line illustrations reused as real UI, subtle paper grain. No React, no Tailwind, no build step.

## Run it

Just open `index.html` — double-click it, or serve the folder:

```bash
npx serve .
```

GSAP loads from a CDN, so animations need an internet connection. Without JS or without the CDN, **the full menu and address still render** — content lives in the HTML, not in JS.

## Structure

```
index.html            all content in the source (no-JS readable)
css/  tokens · base · layout · components
js/   main · curtain · cards · flip · hero · catbg · menu   (classic scripts, MC namespace)
data/menu.json        single source of truth for items + prices
assets/               logo, 6 line illustrations, map, mojito poster, frames/
```

Change a price in one place: `data/menu.json` (and the mirrored inline HTML in `index.html`, which exists only for the no-JS fallback).

## What's built (demo scope)

- Intro curtain preloader (2.5s hard cap, sessionStorage skip on repeat) → center-split reveal
- Sticky nav: transparent over hero, gains paper bg + gold hairline on scroll, hides on scroll-down (mobile)
- Six category cards with the gravity settle (overshoot + responsive shadow), one focused at a time, animate once
- FLIP card → fullscreen category morph with `#/category` hash routing (back restores scroll position); hero + grid hide while a category is open
- **Full-width video hero** (`js/hero.js`): a carousel that cycles the featured drinks — each product's video plays full-bleed while its name slides in on the left in the product's own accent colour; when the clip ends the next product crosses in. Dots jump between slides; clicking a name opens that category. Poster fallback under reduced motion / no-JS.
- **Per-category build-up background** (`js/catbg.js`): opening a category with `hasBuildup` plays that drink's clip as a faded, full-screen, scroll-scrubbed background (empty glass → ingredients → full drink) with an ingredients list. Currently on **Iced Tea, Mojito, Coolers** (the three with videos).
- **Lenis smooth scroll** (client requested; off under reduced motion, integrated with GSAP ScrollTrigger)
- Visit section (static map → real Google Maps pin, hours, WhatsApp, Instagram, review) and footer

### Video assets (per category, data-driven)
Everything is keyed off `data/menu.json` — a category with `accent`, `heroVideo`/`heroPoster`, `hasBuildup` + `buildupCount` gets both the hero slide and the build-up background. Source clips live in `video/` (git-ignored) and are processed into:
- **Hero clips** → `assets/video/hero/<id>.mp4` (h264, muted, ~0.3 MB each) + `assets/img/hero/<id>.webp` posters.
- **Build-up frames** → `assets/frames/category/<id>_NNNN.webp` (~60 frames each, lazy-loaded only when that category opens).
- Frame URLs carry a `?v=N` (`VER` in `js/catbg.js`) — **bump `VER` whenever you re-export frames** so browsers don't serve stale cached frames.
- KlingAI watermark on the Mojito clip is cropped out (`crop=…`), not blurred. The Gemini clips (peach, watermelon) are already clean.

### Frame / video pipeline (ffmpeg)

```bash
# build-up frames for a category (fill window only, empty → full), ~60 frames
ffmpeg -ss 0.2 -i <clip>.mp4 -t 4.5 -vf "fps=14,scale=800:-2" \
  -c:v libwebp -quality 70 assets/frames/category/<id>_%04d.webp

# hero clip (web-optimized, muted)
ffmpeg -i <clip>.mp4 -t 6.5 -an -c:v libx264 -crf 28 -pix_fmt yuv420p \
  -movflags +faststart assets/video/hero/<id>.mp4
```

Add a new category video by dropping the clip in, running the two commands, and adding `accent` / `heroVideo` / `heroPoster` / `hasBuildup` / `buildupCount` to that category in `data/menu.json`.

## Client to-do before the pitch

These are placeholders in `data/menu.json` — swap for the real values:

- **WhatsApp number** (`brand.whatsappNumber`) — currently `923000000000`
- **Google review URL** and **Maps pin** (`brand.googleReviewUrl`, `brand.mapsUrl`)
- **Address** and confirmed **hours**
- **Logo** — `assets/logo.svg` is a placeholder; drop in the client's real gold-script PNG/SVG
- **Item one-liners** — only two are the client's verbatim copy ("Mango doing mango things", "Berry good. No explanation needed."); the rest are written in-voice as placeholders pending the client's card
- **Remaining category videos** — hero + build-up currently cover Iced Tea, Mojito, Coolers; add clips for **Shakes, Smoothies, Hot Stuff** to complete the set (see the pipeline above)

## Known / flagged

- **Strawberry Cheesecake Shake** is described on the client's card as "For the Lotus lovers" — likely a copy mismatch. Left as-is per the spec and flagged in the category view as a note to raise in the pitch (builds trust).
