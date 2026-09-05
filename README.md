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
js/   main · curtain · cards · flip · sequence · menu   (classic scripts, MC namespace)
data/menu.json        single source of truth for items + prices
assets/               logo, 6 line illustrations, map, mojito poster, frames/
```

Change a price in one place: `data/menu.json` (and the mirrored inline HTML in `index.html`, which exists only for the no-JS fallback).

## What's built (demo scope)

- Intro curtain preloader (2.5s hard cap, sessionStorage skip on repeat) → center-split reveal
- Sticky nav: transparent over hero, gains paper bg + gold hairline on scroll, hides on scroll-down (mobile)
- Six category cards with the gravity settle (overshoot + responsive shadow), one focused at a time, animate once
- FLIP card → fullscreen category morph with `#/category` hash routing (back restores scroll position); hero + grid hide while a category is open
- Signature Mojito canvas scrubber in the hero (desktop) with progress + poster/mobile fallback
- **Mojito category build-up**: a second Mojito clip plays as a faded, scroll-scrubbed background (empty glass → ice → strawberries → drink) behind the category, with an ingredients list
- **Lenis smooth scroll** (client requested; off under reduced motion, integrated with GSAP ScrollTrigger)
- Visit section (static map → real Google Maps pin, hours, WhatsApp, Instagram, review) and footer

### Two Mojito clips
- `mojito.mp4.mp4` → hero rotating drink → `assets/frames/desktop/` (71 frames, ~2.2 MB)
- `video/kling_*.mp4` (build-up) → Mojito category background → `assets/frames/category/` (66 frames, ~1.2 MB)
- Both had the KlingAI watermark removed by cropping it out (`crop=1360:1360:40:0` / `crop=900:900:30:0`), not by blur.
- Frame URLs carry a `?v=N` (in `js/sequence.js` and `js/catbg.js`) — **bump `VER` whenever you re-export frames** so browsers don't serve stale cached frames.

## Frame pipeline (to enable the scrubber)

The demo ships without frames and shows the poster. To enable scrubbing, extract and compress a ~4s Mojito clip into `assets/frames/desktop/`:

```bash
# extract at 24fps, ~90 frames
ffmpeg -i mojito.mp4 -vf "fps=24,scale=1280:-1" assets/frames/desktop/mojito_%04d.png
ffmpeg -i mojito.mp4 -vf "fps=24,scale=720:-1"  assets/frames/mobile/mojito_%04d.png

# compress to WebP q78
for f in assets/frames/desktop/*.png; do cwebp -q 78 "$f" -o "${f%.png}.webp"; done

# check weight (keep desktop set under ~2.5 MB)
du -sh assets/frames/desktop
```

`js/sequence.js` looks for `mojito_0001.webp …`; set `CFG.count` to the frame count.

## Client to-do before the pitch

These are placeholders in `data/menu.json` — swap for the real values:

- **WhatsApp number** (`brand.whatsappNumber`) — currently `923000000000`
- **Google review URL** and **Maps pin** (`brand.googleReviewUrl`, `brand.mapsUrl`)
- **Address** and confirmed **hours**
- **Logo** — `assets/logo.svg` is a placeholder; drop in the client's real gold-script PNG/SVG
- **Item one-liners** — only two are the client's verbatim copy ("Mango doing mango things", "Berry good. No explanation needed."); the rest are written in-voice as placeholders pending the client's card
- **Mojito clip** for the scroll animation

## Known / flagged

- **Strawberry Cheesecake Shake** is described on the client's card as "For the Lotus lovers" — likely a copy mismatch. Left as-is per the spec and flagged in the category view as a note to raise in the pitch (builds trust).
