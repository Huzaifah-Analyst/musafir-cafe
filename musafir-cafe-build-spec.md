# Musafir Cafe Website, Development Specification

Version 1.0
Owner: Huzaifah
Purpose: pitch demo for Musafir Cafe (Instagram @musafircafe.pk), drinks-only cafe.
This document is the single source of truth for the build. Any agent working on this project reads this file first.

---

## 0. Non-negotiables

These are hard failure conditions. If any of these break, the build is rejected regardless of how good it looks.

1. Site must work perfectly on a 360px wide Android phone on a 3G connection.
2. Total page weight on first load must be under 2.5 MB. Frame sequences load lazily, never on first paint.
3. Every animation must have a working `prefers-reduced-motion` fallback.
4. If JavaScript fails to load, the menu content and the address must still be readable. Content lives in HTML, not injected by JS.
5. No horizontal overflow at any viewport width between 320px and 2560px.
6. No layout shift after load. All images and canvases have explicit width/height or aspect-ratio.
7. Lighthouse mobile: Performance 85+, Accessibility 95+.
8. Animations must be tested at 3 widths (360, 768, 1440) before any agent reports a task complete.

---

## 1. Brand and design direction

The client already has branding. We follow it, we do not replace it.

Observed from their menu card:
- Logo: gold/bronze handwritten script, "Musafir Cafe", two lines.
- Background: warm off-white / cream paper.
- Illustrations: terracotta single-weight line drawings of glasses (mojito glass with cherry and lemon, iced shake cup, smoothie cup with straw).
- Body type: light serif, generous letter spacing, category names in serif caps.
- Voice: short, dry, witty item descriptions ("Mango doing mango things", "Berry good. No explanation needed.").
- They call customers "travellers". Use this word. It is their own language.

### Tokens

```
--paper:        #F7F3EC   /* page base, warm cream */
--paper-deep:   #EFE7DA   /* section alternation, card base */
--ink:          #2B2621   /* primary text, warm near-black */
--ink-soft:     #6B6058   /* secondary text, item descriptions */
--terracotta:   #C4633A   /* illustrations, accents, active states */
--gold:         #B08A4E   /* logo colour, hairlines, dividers */
--curtain:      #3A2F28   /* intro curtain, deep warm brown */
```

Note on palette: the cream plus terracotta combination is a common generated-design default. Here it is not a default, it is extracted from the client's own printed menu. We keep it deliberately. What differentiates this build is the gold script logo, the hand-drawn line illustrations reused as real UI elements, and the paper texture, not a generic warm palette.

### Type

- Display and logo: the client's logo is an image asset, use the PNG/SVG, do not attempt to match the script with a web font.
- Headings: a light serif with wide tracking to match their menu card. Cormorant Garamond (300/400) or EB Garamond.
- Body: same serif family at 400, or a quiet humanist sans for long copy. Do not use more than two families total.
- Do not set labels in all caps except category names, which the client's own menu already sets that way. This is matching the brand, not a default.

### Texture

Very subtle paper grain as an SVG noise data URI at 3 to 5 percent opacity over the whole page. This is what makes cream look like paper instead of looking like an unstyled background. Do not overdo it.

---

## 2. Content

Real content only. No lorem ipsum anywhere.

Categories and items, exactly as printed on their menu:

| Category | Items | From |
|---|---|---|
| Iced Tea | Peach Iced Tea 400, Mango Passion Iced Tea 450, Lychee Strawberry Iced Tea 450 | PKR 400 |
| Mojito | Strawberry Passion Mojito 450, Berry Burst Mojito 450, Dragon Mango Mojito 450 | PKR 450 |
| Daiquiri / Fruit Coolers | Peachy Flower Cooler 600, Mango Coconut Cooler 600, Watermelon Lychee Cooler 600 | PKR 600 |
| Shakes | Lotus Shake 650, Oreo Chocolate Shake 650, Strawberry Cheesecake Shake 680 | PKR 650 |
| Smoothies | Mango Peach Smoothie 700, Mixberry Smoothie 700, Mango Coconut Smoothie 700 | PKR 700 |
| Hot Stuff | Karak Chai 175, Cardamom 275, Cappuccino 300 | PKR 175 |

Item descriptions: use the client's own one-liners from the menu card verbatim. They are better than anything we would write.

All menu data lives in one file, `data/menu.json`. Nothing hardcodes a price in markup or CSS. When the cafe changes a price, one file changes.

Note: one item on their card has a description mismatch (Strawberry Cheesecake Shake is described as "For the Lotus lovers"). Do not silently fix it in the demo. Flag it to the client in the pitch as a detail we noticed. This builds trust.

---

## 3. Page flow and interaction spec

```
[INTRO CURTAIN]  full screen, terracotta-deep, logo + "Khush aamdeed, musafir"
       |         doubles as asset preloader, hard cap 2.5s
       v
[REVEAL]         curtain splits from center to left and right,
       |         cream page revealed behind, like sliding doors
       v
[HERO]           logo, one line of copy, scroll cue
       |         one signature drink scroll animation (Mojito)
       v
[CATEGORIES]     6 cards, spring settle on entry, focused card lifts
       |         click -> card morphs to fullscreen (FLIP)
       v
[CATEGORY VIEW]  category hero + its 3 drinks + WhatsApp order per drink
       |         back returns to the same scroll position
       v
[VISIT]          map, timings, WhatsApp, Instagram, Google review link
       v
[FOOTER]         logo, socials, "10% off your first order" capture
```

### 3.1 Intro curtain

- Text: "Khush aamdeed, musafir" then fades to "Welcome, traveller". Client can pick one.
- It is a real preloader. It waits for the hero image and the logo only. It does not wait for frame sequences.
- Hard timeout 2500ms. If assets are not ready, proceed anyway and let them stream in.
- `sessionStorage` flag: on repeat visits within the session, skip straight to reveal in 400ms.
- Reduced motion: show a static cream page with the logo, no curtain.

### 3.2 Curtain reveal

- Two panels, `--curtain` colour, split from center outward on the X axis.
- Duration 900ms, easing `cubic-bezier(0.76, 0, 0.24, 1)`.
- Hero content underneath starts at `opacity: 1` already. The curtain is on top. Do not fade the hero in separately, that reads cheap.
- Panels get `pointer-events: none` and are removed from the DOM after the animation ends.

### 3.3 Navbar

- Logo left or centered. One action on the right, "Visit us", which scrolls to the visit section.
- Everything else behind a minimal menu toggle.
- Transparent over hero. On scroll past 80px it gains `--paper` background and a 1px `--gold` hairline at 20 percent opacity. Backdrop blur is optional and must be tested on Android, it is a known performance trap.
- Hides on scroll down, reappears on scroll up, on mobile only.

### 3.4 Category cards, the gravity feel

This is the part most likely to be built badly. Precise spec:

- Desktop: 3 columns x 2 rows. Tablet: 2 columns. Mobile: 1 column, full width.
- Each card contains the terracotta line illustration, the category name, item count, and "from PKR xxx".
- Entry animation on scroll into view: card starts 40px below its final position at `scale(0.96)`, travels up, overshoots its resting point by roughly 6px, then settles. The shadow underneath grows as the card rises and tightens as it lands. The shadow doing the opposite of the card is what produces the sense of weight. Scale alone reads flat.
- Stagger between cards: 80ms.
- Use a spring easing, not a linear or ease-out curve. GSAP `elastic.out(1, 0.6)` or a custom cubic-bezier with overshoot.
- The card nearest the viewport center gets a subtle lift, `scale(1.02)` and a deeper shadow. One card focused at a time.
- Do not animate all six cards on every scroll pass. Animate once, then set a `data-revealed` attribute and leave them alone. Repeating animations on scroll up is the single most common way this effect starts feeling cheap.

### 3.5 Card to category transition (FLIP)

- On click, the card expands from its current position and size to fullscreen. It does not navigate away and it does not fade out then in.
- Implementation: record the card's bounding rect, clone or promote the element, animate to the target rect, then swap in the full category content.
- Duration 600ms. The category content fades in over the last 200ms.
- Back button reverses the animation and restores the exact previous scroll position.
- This is a single page app style transition without a framework router. Use the History API to push a hash like `#/mojito` so the back button works and the client can share a direct link.

### 3.6 Drink scroll animation

- Canvas based image sequence, the technique used on product marketing pages.
- Scope for the demo: one animation only, the Strawberry Passion Mojito. Not one per drink. Fifteen animations is neither buildable nor loadable.
- Production plan for the paid build: one hero animation per category, six total, each lazy loaded only when that category is opened.
- Frames: 90 to 120 frames at 1280px wide for desktop, plus a 60 frame set at 720px wide for mobile.
- Format: WebP quality 78. Target under 25 KB per frame, under 2.5 MB per sequence.
- Preload with a visible progress state before the sequence becomes scrubbable. Never show a half loaded sequence.
- Mobile under 768px: do not use the canvas sequence. Use a short muted autoplaying looping MP4 with `playsinline`, or a static hero image. Canvas scrubbing on mid range Android is unreliable and janky.
- Reduced motion: static final frame, no scrub.

### 3.7 Visit section

- Embedded Google map or a static map image linking out to the pin. Static image is faster, prefer it.
- Timings, address, WhatsApp button with a prefilled message, Instagram link, Google review link.
- WhatsApp link format: `https://wa.me/<number>?text=<urlencoded message>`. Client provides the number.

---

## 4. Tech stack

Deliberately boring where it does not matter, so that all the effort goes into the animation quality.

| Layer | Choice | Reason |
|---|---|---|
| Markup | Plain semantic HTML | Content must exist without JS. No build step to break. Client can host anywhere. |
| Styles | Vanilla CSS with custom properties | No Tailwind. This is a bespoke visual identity, not a component kit. Utility classes fight custom motion. |
| Motion | GSAP 3 with ScrollTrigger | The only library that handles pinning, scrubbing, and FLIP reliably across browsers. Free for this use. |
| Transitions | GSAP Flip plugin, or manual FLIP with getBoundingClientRect | Card to fullscreen morph. |
| Frames | ffmpeg for extraction, cwebp for compression | Standard, scriptable. |
| Data | menu.json fetched once | One file to update prices. |
| Fonts | Self hosted woff2, subset to Latin | Google Fonts CDN adds a round trip and a privacy flag. Subsetting cuts about 70 percent. |
| Icons | Inline SVG | No icon library for four icons. |
| Build | None for the demo. Vite for the paid build if needed. | Demo must open by double clicking index.html. |
| Hosting | Netlify or Vercel free tier for the demo | Instant share link for the pitch. |
| Analytics | None in the demo | Add Plausible or GA4 only in the paid build. |

Explicitly rejected and why:
- React or Next.js: no data, no state, no routes. It would add 100 KB and a build step for zero benefit and would make the client dependent on us for a text change.
- Tailwind: fights the custom design, and the class soup makes handoff worse.
- Lenis or Locomotive smooth scroll: tempting, but it breaks native scroll on iOS and hurts accessibility. Only add it if the client specifically asks and it is tested on a real iPhone.
- Three.js: no 3D geometry in this design. Frames give a better result at a fraction of the cost.

### File structure

```
musafir-cafe/
├── index.html
├── css/
│   ├── tokens.css        variables only
│   ├── base.css          reset, typography, paper texture
│   ├── layout.css        grid, sections, responsive
│   └── components.css    nav, cards, curtain, drink view
├── js/
│   ├── main.js           orchestration, entry point
│   ├── curtain.js        intro and reveal
│   ├── cards.js          category grid, gravity, focus
│   ├── flip.js           card to fullscreen transition
│   ├── sequence.js       canvas frame scrubber
│   └── menu.js           renders from menu.json
├── data/
│   └── menu.json
├── assets/
│   ├── logo.svg
│   ├── illustrations/    6 terracotta line drawings
│   ├── frames/
│   │   ├── desktop/      mojito_0001.webp ...
│   │   └── mobile/
│   └── img/
└── README.md
```

### Frame pipeline commands

```bash
# extract at 24fps, 5 second clip gives 120 frames
ffmpeg -i mojito.mp4 -vf "fps=24,scale=1280:-1" frames/desktop/mojito_%04d.png

# mobile set
ffmpeg -i mojito.mp4 -vf "fps=24,scale=720:-1" frames/mobile/mojito_%04d.png

# compress
for f in frames/desktop/*.png; do cwebp -q 78 "$f" -o "${f%.png}.webp"; done

# verify total weight
du -sh frames/desktop
```

If the desktop set exceeds 3 MB, drop to 20fps or shorten the clip. Do not lower quality below 70, banding becomes visible on the gradient of a drink.

---

## 5. Agent architecture

Work is split so that no agent holds the whole build in its head, and so that quality gates are enforced by an agent that did not write the code.

### Master agent, the Orchestrator

Responsibilities:
- Owns this specification. Is the only agent allowed to change it.
- Receives every request and question from Huzaifah. Sub agents never talk to Huzaifah directly.
- Decomposes work into tasks, assigns each to exactly one sub agent, and defines the acceptance criteria for that task before work begins.
- Resolves conflicts between agents. If the Motion agent and the Performance agent disagree, the Orchestrator decides and records the decision in the Decision Log at the bottom of this file.
- Never writes production code itself.
- Enforces this rule: no task is complete until the Reviewer agent has signed off.

Task assignment format the Orchestrator uses:

```
TASK ID:      [e.g. M-03]
AGENT:        [which sub agent]
GOAL:         [one sentence]
INPUTS:       [files, assets, data it may read]
OUTPUTS:      [exact files it may write, nothing outside this list]
ACCEPTANCE:   [checklist the Reviewer will test against]
CONSTRAINTS:  [relevant non-negotiables from section 0]
```

### Sub agents

**1. Design System agent**
Scope: `css/tokens.css`, `css/base.css`.
Builds the token set, type scale, paper texture, focus states, and the reduced-motion base rules. Produces nothing visual on its own. Every other agent consumes its tokens and is forbidden from writing a raw hex value anywhere else in the codebase.

**2. Structure agent**
Scope: `index.html`, `data/menu.json`, `js/menu.js`.
Builds semantic markup with all real content present in the HTML source. Owns heading hierarchy, landmarks, alt text, and the menu data schema. Hard rule: the site must be fully readable with CSS and JS disabled. This agent proves it by testing with both off.

**3. Layout and Responsive agent**
Scope: `css/layout.css`.
Owns the grid, spacing rhythm, and every breakpoint. Tests at 320, 360, 390, 768, 1024, 1440, 2560. Owns the no-horizontal-overflow rule. Runs a check for elements wider than the viewport at every breakpoint before signing off.

**4. Motion agent**
Scope: `js/curtain.js`, `js/cards.js`, `js/flip.js`, and the animation-specific rules in `css/components.css`.
Owns the curtain, the gravity spring on the cards, the focus lift, and the FLIP morph. Must ship a working reduced-motion path for every effect it writes. Must not introduce any animation not described in section 3 without Orchestrator approval.

**5. Sequence agent**
Scope: `js/sequence.js`, the frame pipeline, `assets/frames/`.
Owns frame extraction, compression, preloading with progress, canvas scrubbing, the desktop/mobile split, and the mobile fallback. Owns the weight budget for frames and reports the actual byte count in every handoff.

**6. Performance and Accessibility agent**
Scope: audit and fix only, may touch any file but must document each change.
Runs Lighthouse mobile, checks total transferred bytes, checks CLS, checks keyboard navigation through every interactive element, checks focus visibility, checks contrast ratios against the cream background, checks the reduced-motion path, checks screen reader labels on icon-only buttons. Has veto power on any feature that breaks a section 0 rule.

**7. Content and Copy agent**
Scope: all user-facing strings, `data/menu.json` copy fields, README.
Matches the client's voice: short, dry, warm, uses "traveller". Writes the CTA labels, the empty and error states, and the WhatsApp prefilled message. Verifies every price against the client's menu image. No invented items, no invented claims.

**8. Reviewer agent**
Scope: read only. Writes nothing but review reports.
Tests every completed task against its stated acceptance criteria plus the section 0 non-negotiables. Must actually load the page at three widths and interact with it, not just read the diff. Returns either PASS with evidence, or FAIL with a specific reproducible defect. Cannot review its own work because it writes none.

### Workflow

```
Huzaifah -> Orchestrator
                |
                | decomposes, writes acceptance criteria
                v
      Design System -> Structure -> Layout -> Motion -> Sequence
                |                                          |
                +---------------- Content ------------------+
                                   |
                                   v
                      Performance & Accessibility
                                   |
                                   v
                              Reviewer
                                   |
                    PASS -> Orchestrator reports to Huzaifah
                    FAIL -> back to the owning agent with the defect
```

Rules that keep this from turning into chaos:
- One agent owns each file. Two agents never write the same file. If a change is needed in a file you do not own, request it through the Orchestrator.
- No agent starts before its upstream dependency has passed review. Motion cannot start before Layout is stable, or it will animate elements that are about to move.
- Every handoff states what was built, what was tested, and what is known broken.
- Any agent may raise a blocker to the Orchestrator at any time. Silent workarounds are a failure.

---

## 6. Acceptance checklist

The Reviewer runs this before the build is shown to the client.

Responsiveness
- [ ] No horizontal scrollbar at 320, 360, 390, 768, 1024, 1440, 2560
- [ ] Category grid reflows 3 to 2 to 1 columns cleanly
- [ ] Tap targets at least 44px on mobile
- [ ] Text remains readable at 200 percent browser zoom
- [ ] Tested on a real Android phone, not only in devtools

Animation
- [ ] Curtain completes and is removed from the DOM
- [ ] Curtain never blocks the page if an asset fails to load
- [ ] Cards animate once, not on every scroll pass
- [ ] Gravity settle has visible overshoot and a shadow that responds
- [ ] FLIP morph has no flash, jump, or double render
- [ ] Back restores the previous scroll position
- [ ] Frame sequence never shows a partially loaded state
- [ ] Mobile uses the fallback, not the canvas scrubber
- [ ] All effects have a reduced-motion path, verified by toggling the OS setting

Performance
- [ ] First load under 2.5 MB
- [ ] Lighthouse mobile performance 85+
- [ ] CLS under 0.1
- [ ] Frames lazy loaded, not blocking first paint

Content and function
- [ ] All 18 items present with correct prices
- [ ] Descriptions match the client's card
- [ ] WhatsApp link opens with the prefilled message
- [ ] Map pin opens the correct location
- [ ] Instagram and Google review links work
- [ ] Site readable with JS disabled

Accessibility
- [ ] Full keyboard path through nav, cards, category view, and back
- [ ] Visible focus ring everywhere, not removed by a reset
- [ ] Contrast passes AA on cream
- [ ] Icon-only buttons have accessible labels
- [ ] Images have meaningful alt text

---

## 7. Demo scope versus paid scope

Demo, for the pitch, target 2 days:
- Curtain, reveal, nav
- Six category cards with the gravity effect
- One category opened fully (Mojito) with the FLIP morph
- One scroll animation (Strawberry Passion Mojito)
- Visit section
- Deployed to a share link

Not in the demo: the other five category animations, ordering, events page, email capture backend, CMS, analytics. These are what gets quoted.

---

## 8. Decision log

Record every decision that changes this spec, so no agent relitigates a settled question.

| Date | Decision | Reason |
|---|---|---|
| 2026-09-04 | Warm cream and terracotta instead of dark cinematic | Client's existing branding is light and warm. A dark site would clash with their printed menu and logo. |
| 2026-09-04 | One animation for the demo, not one per drink | 15 sequences is not buildable in the timeline and not loadable on mobile. |
| 2026-09-04 | No React, no Tailwind | Static content, bespoke design, client must be able to edit text without a build step. |
| 2026-09-04 | Canvas scrubbing disabled under 768px | Unreliable performance on mid range Android, which is most of the client's traffic. |
