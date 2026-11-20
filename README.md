# BISCAYNE Cover Studio

An offline cover-art studio that turns ordinary photos into
comic-poster game covers: multi-panel layouts with keylines, bold
display captions, colour grades and ink treatments — built with
vanilla HTML, CSS and canvas 2D. No build step, no network, no
dependencies.

**Live shape of it:** open `app/index.html` in any modern browser.
The default canvas is **1080 × 1350** — portrait, the shape real box
art ships in.

## What it does

- **7 layouts** — Collage, Triptych, Hero, Cinematic, Medallion
  (circular hero over a backdrop column), Slant Duo (a true diagonal
  split) and Magazine Rail (a tall side photo with a hero and a pair
  beside it). Panels are separated by poster keylines everywhere.
- **4 colour grades** — Vice, Sunset, Neon Nights, Teal & Orange
  (plus a Clean grade).
- **3 treatments** on top of any grade:
  - **Game Art** — 7-level posterize with Sobel edge ink, the
    illustrated-cover look.
  - **Heatwave** — an indigo → magenta → amber duotone ramp with a
    fixed-grid halftone dot screen and inked edges.
  - **Dusk Film** — lifted warm blacks, a gentle fade toward
    luminance, and fixed-pattern grain from an integer coordinate
    hash. Fully deterministic: the same cover renders identically
    every time.
- **Head-safe framing** — photo crops bias the focal window upward
  (0.42 of the overflow), so faces and subjects near the top of a
  frame are not cut by a panel edge.
- **Canvas sizes** — 1080 × 1350 (default), 1080 × 1080 and
  1920 × 1080 from a segmented control, with one-click PNG export at
  the full chosen size (`biscayne-cover-<layout>-<w>x<h>.png`).
- **A working editor** — click any panel on the poster to select it,
  assign photos from the bundled library of 12 (or your own file),
  and fine-tune each panel with zoom and shift controls. Captions
  are editable and set in Anton, the bundled display face.

## Structure

- `app/index.html` — the page.
- `app/style.css` — studio theme and bundled `@font-face` rules.
- `app/src/cover.js` — the poster engine: layouts, grades,
  treatments, keylines, captions.
- `app/src/main.js` — the editor UI and PNG export.
- `app/src/shots.js` — fixed scenes used to produce the screenshots
  in `screenshots/` (see `shots.json`).
- `app/samples/` — the photo library (credits in `CREDITS.md`).
- `app/fonts/` — Anton and Plus Jakarta Sans with their OFL texts.
- `main.ts` — the competition hand-in: copies `app/` and
  `screenshots/` to the output directory and writes `dossier.json`
  via the vendor helper. It refuses to hand in when `screenshots/`
  is empty.

## Notes

- Everything runs locally and offline; the app makes no network
  requests and loads only files inside `app/`.
- BISCAYNE is an original studio name and brand for this entry. No
  logos, wordmarks, artwork or characters from any existing game or
  franchise appear anywhere in the project.
