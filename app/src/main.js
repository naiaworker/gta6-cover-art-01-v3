// BISCAYNE Cover Studio — editor UI.
// Wires the poster engine (cover.js) to the page: layout / grade /
// treatment pickers, a photo library, per-panel crop controls and a
// one-click PNG export at the full chosen size.

import {
  STUDIO, SIZES, GRADES, TREATMENTS, LAYOUTS,
  createCoverState, emptySlot, renderCover, panelsFor,
} from './cover.js';

export const SAMPLES = [
  { id: 'palmsunset',   label: 'Palms at Sunset',   src: 'samples/palmsunset.jpg' },
  { id: 'palmspurple',  label: 'Purple Palms',      src: 'samples/palmspurple.jpg' },
  { id: 'lifeguard',    label: 'Lifeguard Tower',   src: 'samples/lifeguard.jpg' },
  { id: 'duskshore',    label: 'Dusk Shore',        src: 'samples/duskshore.jpg' },
  { id: 'aerialcoast',  label: 'Aerial Coast',      src: 'samples/aerialcoast.jpg' },
  { id: 'convertible',  label: 'Convertible',       src: 'samples/convertible.jpg' },
  { id: 'marinadusk',   label: 'Marina at Dusk',    src: 'samples/marinadusk.jpg' },
  { id: 'neonrain',     label: 'Neon Rain',         src: 'samples/neonrain.jpg' },
  { id: 'piergold',     label: 'Golden Pier',       src: 'samples/piergold.jpg' },
  { id: 'beachskyline', label: 'Beach Skyline',     src: 'samples/beachskyline.jpg' },
  { id: 'boulevard',    label: 'Boulevard (kit)',   src: 'samples/boulevard.jpg' },
  { id: 'pier',         label: 'Pier (kit)',        src: 'samples/pier.jpg' },
];

const sampleSrc = (id) => {
  const s = SAMPLES.find((x) => x.id === id);
  return s ? s.src : null;
};

// Curated first assignment per layout: no photo repeats inside a cover.
const CURATED = {
  collage:   ['beachskyline', 'convertible', 'palmsunset'],
  triptych:  ['lifeguard', 'palmspurple', 'convertible'],
  hero:      ['palmsunset'],
  cinematic: ['aerialcoast', 'marinadusk', 'neonrain', 'duskshore'],
  medallion: ['piergold', 'duskshore', 'neonrain', 'beachskyline', 'boulevard', 'lifeguard'],
  slant:     ['convertible', 'palmsunset', 'palmspurple', 'lifeguard'],
  magazine:  ['lifeguard', 'beachskyline', 'convertible', 'piergold'],
};

// ------------------------------------------------------------- image cache

const imageCache = new Map();
const imagePending = new Map();

export function imgFor(src) {
  return imageCache.get(src) || null;
}

export function loadImage(src) {
  if (imageCache.has(src)) return Promise.resolve(imageCache.get(src));
  if (imagePending.has(src)) return imagePending.get(src);
  const p = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { imageCache.set(src, img); resolve(img); };
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
  imagePending.set(src, p);
  return p;
}

export async function ensureImages(srcs) {
  await Promise.all(srcs.filter(Boolean).map((s) => loadImage(s).catch(() => null)));
}

// ------------------------------------------------------------- state

export const state = createCoverState();
export let selectedPanel = 0;

function layoutCount(id) {
  const l = LAYOUTS.find((x) => x.id === id);
  return l ? l.count : 3;
}

export function applyLayout(id, keepPhotos) {
  const prev = state.slots.map((s) => s.src);
  state.layout = id;
  const n = layoutCount(id);
  const curated = CURATED[id] || [];
  state.slots = [];
  for (let i = 0; i < n; i++) {
    let src = null;
    if (keepPhotos && prev[i]) src = prev[i];
    else if (curated[i]) src = sampleSrc(curated[i]);
    state.slots.push(emptySlot(src));
  }
  if (selectedPanel >= n) selectedPanel = 0;
}

export function applyScene(cfg) {
  state.size = cfg.size || 'portrait';
  state.grade = cfg.grade || state.grade;
  state.treatment = cfg.treatment || state.treatment;
  if (cfg.title !== undefined) state.title = cfg.title;
  if (cfg.subtitle !== undefined) state.subtitle = cfg.subtitle;
  applyLayout(cfg.layout || 'collage', false);
  (cfg.photos || []).forEach((id, i) => {
    if (state.slots[i]) state.slots[i] = emptySlot(sampleSrc(id) || id);
  });
  selectedPanel = 0;
}

// ------------------------------------------------------------- rendering

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
let renderQueued = false;

export function render() {
  const size = SIZES[state.size] || SIZES.portrait;
  if (canvas.width !== size.w) canvas.width = size.w;
  if (canvas.height !== size.h) canvas.height = size.h;
  renderCover(ctx, state, imgFor);
  markSelected();
}

export function scheduleRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => { renderQueued = false; render(); });
}

async function renderWithLoads() {
  await ensureImages(state.slots.map((s) => s.src));
  render();
}

function markSelected() {
  const label = document.getElementById('panelLabel');
  if (label) label.textContent = `Panel ${selectedPanel + 1} of ${state.slots.length}`;
  const zoom = document.getElementById('zoomRange');
  const slot = state.slots[selectedPanel] || emptySlot(null);
  if (zoom) {
    zoom.value = slot.zoom;
    document.getElementById('panXRange').value = slot.offX;
    document.getElementById('panYRange').value = slot.offY;
  }
  document.querySelectorAll('.photo-thumb').forEach((el) => {
    el.classList.toggle('in-use', state.slots.some((s) => s.src === el.dataset.src));
  });
}

// ------------------------------------------------------------- controls

function buttonGroup(containerId, items, current, onPick) {
  const box = document.getElementById(containerId);
  box.innerHTML = '';
  for (const item of items) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = item.name || item.label;
    b.dataset.id = item.id;
    if (item.id === current) b.classList.add('active');
    b.addEventListener('click', () => onPick(item.id));
    box.appendChild(b);
  }
}

function refreshGroups() {
  buttonGroup('layoutList', LAYOUTS, state.layout, (id) => {
    applyLayout(id, false);
    selectedPanel = 0;
    refreshGroups();
    renderWithLoads();
  });
  buttonGroup('treatmentList', TREATMENTS, state.treatment, (id) => {
    state.treatment = id;
    refreshGroups();
    scheduleRender();
  });
  buttonGroup('sizeControl',
    Object.values(SIZES).map((s) => ({ id: s.id, name: s.label })),
    state.size,
    (id) => { state.size = id; refreshGroups(); renderWithLoads(); });
  const grade = document.getElementById('gradeSelect');
  grade.value = state.grade;
}

// Re-sync every control with the current state (used after a scene
// applies a whole new state, e.g. the screenshot scenes in shots.js).
export function syncControls() {
  refreshGroups();
  document.getElementById('titleInput').value = state.title;
  document.getElementById('subtitleInput').value = state.subtitle;
  markSelected();
}

function buildPhotoStrip() {
  const strip = document.getElementById('photoStrip');
  strip.innerHTML = '';
  for (const s of SAMPLES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'photo-thumb';
    b.dataset.src = s.src;
    b.title = s.label;
    const img = document.createElement('img');
    img.src = s.src;
    img.alt = s.label;
    const cap = document.createElement('span');
    cap.textContent = s.label;
    b.appendChild(img);
    b.appendChild(cap);
    b.addEventListener('click', () => {
      if (!state.slots[selectedPanel]) state.slots[selectedPanel] = emptySlot(null);
      state.slots[selectedPanel].src = s.src;
      renderWithLoads();
      if (selectedPanel < state.slots.length - 1) {
        selectedPanel++;
        markSelected();
      }
    });
    strip.appendChild(b);
  }
}

// Point-in-panel hit test so clicking the poster selects that panel.
function panelAt(px, py) {
  const size = SIZES[state.size] || SIZES.portrait;
  const panels = panelsFor(state.layout, size.w, size.h);
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (p.shape === 'rect' && px >= p.x && px <= p.x + p.w && py >= p.y && py <= p.y + p.h) return i;
    if (p.shape === 'circle') {
      const dx = px - p.cx, dy = py - p.cy;
      if (dx * dx + dy * dy <= p.r * p.r) return i;
    }
    if (p.shape === 'poly') {
      let inside = false;
      for (let a = 0, b = p.pts.length - 1; a < p.pts.length; b = a++) {
        const [ax, ay] = p.pts[a];
        const [bx, by] = p.pts[b];
        if ((ay > py) !== (by > py) && px < ((bx - ax) * (py - ay)) / (by - ay) + ax) inside = !inside;
      }
      if (inside) return i;
    }
  }
  return -1;
}

function wireControls() {
  document.getElementById('gradeSelect').addEventListener('change', (e) => {
    state.grade = e.target.value;
    scheduleRender();
  });
  document.getElementById('titleInput').addEventListener('input', (e) => {
    state.title = e.target.value;
    scheduleRender();
  });
  document.getElementById('subtitleInput').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    scheduleRender();
  });
  const bindRange = (id, key, scale) => {
    document.getElementById(id).addEventListener('input', (e) => {
      const slot = state.slots[selectedPanel];
      if (!slot) return;
      slot[key] = parseFloat(e.target.value) * scale;
      scheduleRender();
    });
  };
  bindRange('zoomRange', 'zoom', 1);
  bindRange('panXRange', 'offX', 1);
  bindRange('panYRange', 'offY', 1);
  document.getElementById('shuffleBtn').addEventListener('click', () => {
    const ids = state.slots.map((s) => s.src);
    ids.push(ids.shift());
    state.slots.forEach((s, i) => { s.src = ids[i]; });
    renderWithLoads();
  });
  document.getElementById('exportBtn').addEventListener('click', exportPng);
  document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    loadImage(url).then(() => {
      if (!state.slots[selectedPanel]) state.slots[selectedPanel] = emptySlot(null);
      state.slots[selectedPanel].src = url;
      render();
    });
  });
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    const px = (e.clientX - r.left) * (canvas.width / r.width);
    const py = (e.clientY - r.top) * (canvas.height / r.height);
    const idx = panelAt(px, py);
    if (idx >= 0) {
      selectedPanel = idx;
      markSelected();
    }
  });
}

function exportPng() {
  const size = SIZES[state.size] || SIZES.portrait;
  const off = document.createElement('canvas');
  off.width = size.w; off.height = size.h;
  renderCover(off.getContext('2d'), state, imgFor);
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${STUDIO.fileSlug}-${state.layout}-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }, 'image/png');
}

// ------------------------------------------------------------- boot

async function boot() {
  const grade = document.getElementById('gradeSelect');
  for (const g of GRADES) {
    const o = document.createElement('option');
    o.value = g.id;
    o.textContent = g.name;
    grade.appendChild(o);
  }
  document.getElementById('titleInput').value = state.title;
  document.getElementById('subtitleInput').value = state.subtitle;
  applyLayout(state.layout, false);
  buildPhotoStrip();
  wireControls();
  refreshGroups();
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('100px Anton'),
        document.fonts.load('700 20px "Plus Jakarta Sans"'),
      ]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch (e) { /* fonts fall back gracefully */ }
  await ensureImages(SAMPLES.map((s) => s.src));
  render();

  const params = new URLSearchParams(location.search);
  if (params.has('shot')) {
    const shots = await import('./shots.js');
    await shots.runShot(params.get('shot'));
  }
}

boot();
