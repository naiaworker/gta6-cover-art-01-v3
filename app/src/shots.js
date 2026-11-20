// BISCAYNE Cover Studio — screenshot scenes.
// Loaded only when the page URL carries ?shot=<name>. A scene applies a
// fixed cover state, waits for fonts and photos, renders, and then sets
// window.__SHOT_READY so the capture script can take the picture.
// Scene names match the files listed in shots.json; g1..g6 are extra
// cover scenes used to build a review gallery.

import { applyScene, render, ensureImages, state, syncControls } from './main.js';
import { STUDIO } from './cover.js';

const base = { title: STUDIO.name, subtitle: STUDIO.tagline };

export const SCENES = {
  '1-cover': {
    mode: 'cover',
    cfg: { ...base, size: 'portrait', layout: 'slant', grade: 'vice', treatment: 'gameart',
           photos: ['convertible', 'palmsunset', 'palmspurple', 'lifeguard'] },
  },
  '2-editor': {
    mode: 'editor',
    cfg: { ...base, size: 'portrait', layout: 'magazine', grade: 'sunset', treatment: 'heatwave',
           photos: ['lifeguard', 'beachskyline', 'convertible', 'piergold'] },
  },
  '3-cover': {
    mode: 'cover',
    cfg: { ...base, size: 'wide', layout: 'cinematic', grade: 'tealorange', treatment: 'heatwave',
           photos: ['beachskyline', 'marinadusk', 'neonrain', 'duskshore'] },
  },
  '4-editor': {
    mode: 'editor',
    cfg: { ...base, size: 'portrait', layout: 'medallion', grade: 'vice', treatment: 'duskfilm',
           photos: ['piergold', 'duskshore', 'neonrain', 'beachskyline', 'boulevard', 'lifeguard'] },
  },
  g1: {
    mode: 'cover',
    cfg: { ...base, size: 'portrait', layout: 'collage', grade: 'vice', treatment: 'gameart',
           photos: ['beachskyline', 'convertible', 'palmsunset'] },
  },
  g2: {
    mode: 'cover',
    cfg: { ...base, size: 'portrait', layout: 'slant', grade: 'neon', treatment: 'heatwave',
           photos: ['convertible', 'palmspurple', 'neonrain', 'lifeguard'] },
  },
  g3: {
    mode: 'cover',
    cfg: { ...base, size: 'square', layout: 'triptych', grade: 'sunset', treatment: 'duskfilm',
           photos: ['lifeguard', 'palmspurple', 'convertible'] },
  },
  g4: {
    mode: 'cover',
    cfg: { ...base, size: 'wide', layout: 'cinematic', grade: 'tealorange', treatment: 'gameart',
           photos: ['aerialcoast', 'marinadusk', 'neonrain', 'duskshore'] },
  },
  g5: {
    mode: 'cover',
    cfg: { ...base, size: 'portrait', layout: 'magazine', grade: 'sunset', treatment: 'heatwave',
           photos: ['lifeguard', 'beachskyline', 'convertible', 'piergold'] },
  },
  g6: {
    mode: 'cover',
    cfg: { ...base, size: 'portrait', layout: 'medallion', grade: 'vice', treatment: 'duskfilm',
           photos: ['piergold', 'duskshore', 'neonrain', 'beachskyline', 'boulevard', 'lifeguard'] },
  },
};

export async function runShot(name) {
  const scene = SCENES[name];
  if (!scene) throw new Error(`unknown shot scene: ${name}`);
  applyScene(scene.cfg);
  syncControls();
  document.body.classList.add(scene.mode === 'cover' ? 'shot-cover' : 'shot-editor');
  document.body.dataset.shot = name;
  await ensureImages(state.slots.map((s) => s.src));
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('100px Anton'),
        document.fonts.load('700 20px "Plus Jakarta Sans"'),
      ]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch (e) { /* fall back to system fonts */ }
  render();
  // Two frames so the compositor has definitely painted the canvas.
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  window.__SHOT = { name, mode: scene.mode, layout: state.layout, treatment: state.treatment };
  window.__SHOT_READY = true;
}
