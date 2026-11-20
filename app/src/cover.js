// BISCAYNE Cover Studio — poster engine.
// Pure canvas 2D: multi-panel layouts, colour grades and ink treatments.
// Everything is deterministic: no Math.random, no Date, no network.

export const STUDIO = {
  name: 'BISCAYNE',
  brand: 'BISCAYNE COVER STUDIO',
  tagline: 'A VICE-COAST STORY',
  fileSlug: 'biscayne-cover',
};

export const SIZES = {
  portrait: { id: 'portrait', label: '1080 × 1350', w: 1080, h: 1350 },
  square:   { id: 'square',   label: '1080 × 1080', w: 1080, h: 1080 },
  wide:     { id: 'wide',     label: '1920 × 1080', w: 1920, h: 1080 },
};

export const GRADES = [
  { id: 'vice',      name: 'Vice' },
  { id: 'sunset',    name: 'Sunset' },
  { id: 'neon',      name: 'Neon Nights' },
  { id: 'tealorange', name: 'Teal & Orange' },
  { id: 'clean',     name: 'Clean' },
];

export const TREATMENTS = [
  { id: 'none',     name: 'Photo' },
  { id: 'gameart',  name: 'Game Art' },
  { id: 'heatwave', name: 'Heatwave' },
  { id: 'duskfilm', name: 'Dusk Film' },
];

// ---------------------------------------------------------------- layouts
// A panel is one of:
//   { shape: 'rect',   x, y, w, h }
//   { shape: 'circle', cx, cy, r }
//   { shape: 'poly',   pts: [[x, y], ...] }
// Layout definitions use fractions of the canvas; panelsFor() scales them.

const rect = (x, y, w, h) => ({ shape: 'rect', x, y, w, h });

const LAYOUT_DEFS = {
  collage: {
    name: 'Collage',
    panels: () => [
      rect(0, 0, 1, 0.62),
      rect(0, 0.62, 0.5, 0.38),
      rect(0.5, 0.62, 0.5, 0.38),
    ],
  },
  triptych: {
    name: 'Triptych',
    panels: () => [
      rect(0, 0, 1 / 3, 1),
      rect(1 / 3, 0, 1 / 3, 1),
      rect(2 / 3, 0, 1 / 3, 1),
    ],
  },
  hero: {
    name: 'Hero',
    panels: () => [rect(0, 0, 1, 1)],
  },
  cinematic: {
    name: 'Cinematic',
    panels: () => [
      rect(0, 0, 1, 0.34),
      rect(0, 0.34, 0.58, 0.66),
      rect(0.58, 0.34, 0.42, 0.33),
      rect(0.58, 0.67, 0.42, 0.33),
    ],
  },
  medallion: {
    name: 'Medallion',
    panels: () => [
      rect(0, 0, 0.34, 0.5),
      rect(0, 0.5, 0.34, 0.5),
      rect(0.66, 0, 0.34, 0.5),
      rect(0.66, 0.5, 0.34, 0.5),
      rect(0.34, 0, 0.32, 1),
      { shape: 'circle', cx: 0.5, cy: 0.46, r: 0.295 },
    ],
  },
  slant: {
    name: 'Slant Duo',
    panels: () => [
      { shape: 'poly', pts: [[0, 0], [0.62, 0], [0.38, 0.58], [0, 0.58]] },
      { shape: 'poly', pts: [[0.62, 0], [1, 0], [1, 0.58], [0.38, 0.58]] },
      rect(0, 0.58, 0.5, 0.42),
      rect(0.5, 0.58, 0.5, 0.42),
    ],
  },
  magazine: {
    name: 'Magazine Rail',
    panels: () => [
      rect(0, 0, 0.38, 1),
      rect(0.38, 0, 0.62, 0.6),
      rect(0.38, 0.6, 0.31, 0.4),
      rect(0.69, 0.6, 0.31, 0.4),
    ],
  },
};

export const LAYOUTS = Object.entries(LAYOUT_DEFS).map(([id, def]) => ({
  id,
  name: def.name,
  count: def.panels().length,
}));

export function panelsFor(layoutId, w, h) {
  const def = LAYOUT_DEFS[layoutId] || LAYOUT_DEFS.collage;
  return def.panels().map((p) => {
    if (p.shape === 'rect') return { shape: 'rect', x: p.x * w, y: p.y * h, w: p.w * w, h: p.h * h };
    if (p.shape === 'circle') return { shape: 'circle', cx: p.cx * w, cy: p.cy * h, r: p.r * w };
    return { shape: 'poly', pts: p.pts.map(([x, y]) => [x * w, y * h]) };
  });
}

function panelPath(ctx, p) {
  ctx.beginPath();
  if (p.shape === 'rect') ctx.rect(p.x, p.y, p.w, p.h);
  else if (p.shape === 'circle') ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
  else {
    ctx.moveTo(p.pts[0][0], p.pts[0][1]);
    for (let i = 1; i < p.pts.length; i++) ctx.lineTo(p.pts[i][0], p.pts[i][1]);
    ctx.closePath();
  }
}

function panelBBox(p) {
  if (p.shape === 'rect') return [p.x, p.y, p.w, p.h];
  if (p.shape === 'circle') return [p.cx - p.r, p.cy - p.r, p.r * 2, p.r * 2];
  const xs = p.pts.map((q) => q[0]);
  const ys = p.pts.map((q) => q[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  return [x0, y0, Math.max(...xs) - x0, Math.max(...ys) - y0];
}

// ---------------------------------------------------------------- state

export function createCoverState() {
  return {
    size: 'portrait',
    layout: 'collage',
    grade: 'vice',
    treatment: 'gameart',
    title: STUDIO.name,
    subtitle: STUDIO.tagline,
    slots: [],
  };
}

export function emptySlot(src) {
  return { src: src || null, zoom: 1, offX: 0, offY: 0 };
}

// ---------------------------------------------------------------- photos

// Draw an image so it covers the box. The vertical window starts
// HEAD_SAFE_FOCAL of the way down the overflow, so subjects near the
// top of the frame (faces, towers, signs) are not sliced off.
export const HEAD_SAFE_FOCAL = 0.42;

export function drawPhotoCover(ctx, img, x, y, w, h, slot) {
  const zoom = slot && slot.zoom ? slot.zoom : 1;
  const scale = Math.max(w / img.width, h / img.height) * zoom;
  const dw = img.width * scale;
  const dh = img.height * scale;
  const offX = slot ? slot.offX || 0 : 0;
  const offY = slot ? slot.offY || 0 : 0;
  const dx = x + (w - dw) / 2 + offX * w;
  const dy = y + (h - dh) * HEAD_SAFE_FOCAL + offY * h;
  ctx.drawImage(img, dx, dy, dw, dh);
}

// ---------------------------------------------------------------- pixel work

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function applyGrade(d, grade) {
  let sat = 1.08, con = 1.04;
  let mr = 1, mg = 1, mb = 1;
  let shR = 0, shG = 0, shB = 0, hiR = 0, hiG = 0, hiB = 0;
  if (grade === 'vice') {
    sat = 1.3; con = 1.06;
    shR = -6; shG = 12; shB = 16; hiR = 16; hiG = -2; hiB = 10;
  } else if (grade === 'sunset') {
    sat = 1.18; con = 1.03; mr = 1.14; mg = 0.97; mb = 0.78;
    shR = 12; shG = 4; shB = -8; hiR = 10; hiG = 2; hiB = -6;
  } else if (grade === 'neon') {
    sat = 1.55; con = 1.13;
    shR = 8; shG = -6; shB = 22; hiR = 18; hiG = 4; hiB = -4;
  } else if (grade === 'tealorange') {
    sat = 1.16; con = 1.07;
    shR = -12; shG = 13; shB = 15; hiR = 15; hiG = 6; hiB = -11;
  }
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2];
    const lum = luminance(r, g, b);
    r = lum + (r - lum) * sat;
    g = lum + (g - lum) * sat;
    b = lum + (b - lum) * sat;
    r = ((r / 255 - 0.5) * con + 0.5) * 255;
    g = ((g / 255 - 0.5) * con + 0.5) * 255;
    b = ((b / 255 - 0.5) * con + 0.5) * 255;
    const t = lum / 255;
    r = r * mr + shR * (1 - t) + hiR * t;
    g = g * mg + shG * (1 - t) + hiG * t;
    b = b * mb + shB * (1 - t) + hiB * t;
    d[i] = r; d[i + 1] = g; d[i + 2] = b;
  }
}

function posterize(d, levels) {
  const step = 255 / (levels - 1);
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.round(d[i] / step) * step;
    d[i + 1] = Math.round(d[i + 1] / step) * step;
    d[i + 2] = Math.round(d[i + 2] / step) * step;
  }
}

// Sobel edge ink: darken pixels along strong luminance edges toward ink.
function edgeInk(d, w, h, strength, ink) {
  const gray = new Float32Array(w * h);
  for (let p = 0, i = 0; p < w * h; p++, i += 4) gray[p] = luminance(d[i], d[i + 1], d[i + 2]);
  const out = new Uint8ClampedArray(d);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      const gx = -gray[p - w - 1] - 2 * gray[p - 1] - gray[p + w - 1]
                 + gray[p - w + 1] + 2 * gray[p + 1] + gray[p + w + 1];
      const gy = -gray[p - w - 1] - 2 * gray[p - w] - gray[p - w + 1]
                 + gray[p + w - 1] + 2 * gray[p + w] + gray[p + w + 1];
      const mag = Math.min(1, Math.abs(gx) + Math.abs(gy)) / 255;
      const f = Math.max(0, (mag - 0.18) / 0.82) * strength;
      if (f > 0) {
        const i = p * 4;
        out[i] = d[i] * (1 - f) + ink[0] * f;
        out[i + 1] = d[i + 1] * (1 - f) + ink[1] * f;
        out[i + 2] = d[i + 2] * (1 - f) + ink[2] * f;
      }
    }
  }
  d.set(out);
}

// Heatwave ramp: deep indigo -> magenta -> orange -> amber, by luminance.
const HEAT_STOPS = [
  [0.0, 34, 16, 66],
  [0.32, 128, 36, 128],
  [0.55, 210, 52, 116],
  [0.78, 246, 110, 58],
  [1.0, 255, 205, 100],
];

function heatRamp(t) {
  for (let s = 1; s < HEAT_STOPS.length; s++) {
    if (t <= HEAT_STOPS[s][0]) {
      const [t0, r0, g0, b0] = HEAT_STOPS[s - 1];
      const [t1, r1, g1, b1] = HEAT_STOPS[s];
      const f = (t - t0) / (t1 - t0);
      return [r0 + (r1 - r0) * f, g0 + (g1 - g0) * f, b0 + (b1 - b0) * f];
    }
  }
  return [255, 199, 92];
}

function applyHeatwave(d, w, h) {
  for (let i = 0; i < d.length; i += 4) {
    const t = luminance(d[i], d[i + 1], d[i + 2]) / 255;
    const [r, g, b] = heatRamp(t);
    d[i] = r; d[i + 1] = g; d[i + 2] = b;
  }
  // Halftone dot screen on a fixed grid: cell averages set the dot radius,
  // pixels inside a dot are pulled toward deep ink.
  const cell = 9;
  const cols = Math.ceil(w / cell);
  const rows = Math.ceil(h / cell);
  const avg = new Float32Array(cols * rows);
  const cnt = new Float32Array(cols * rows);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = (Math.floor(y / cell)) * cols + Math.floor(x / cell);
      const i = (y * w + x) * 4;
      avg[c] += luminance(d[i], d[i + 1], d[i + 2]);
      cnt[c]++;
    }
  }
  for (let c = 0; c < avg.length; c++) avg[c] /= Math.max(1, cnt[c]) * 255;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cx = Math.floor(x / cell), cy = Math.floor(y / cell);
      const a = avg[cy * cols + cx];
      const radius = (cell / 2) * Math.sqrt(Math.max(0, 1 - a * 0.94));
      const dx = x - (cx * cell + cell / 2);
      const dy = y - (cy * cell + cell / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const edge = Math.max(0, Math.min(1, (dist - radius) / 1.6));
      const f = 0.5 * (1 - edge);
      if (f > 0) {
        const i = (y * w + x) * 4;
        d[i] = d[i] * (1 - f) + 20 * f;
        d[i + 1] = d[i + 1] * (1 - f) + 8 * f;
        d[i + 2] = d[i + 2] * (1 - f) + 40 * f;
      }
    }
  }
}

// Integer coordinate hash for Dusk Film grain: stable for every (x, y).
function hashNoise(x, y) {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (((n ^ (n >>> 16)) >>> 0) / 4294967295) * 2 - 1;
}

function applyDuskFilm(d, w, h) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      let r = d[i], g = d[i + 1], b = d[i + 2];
      const lum = luminance(r, g, b);
      // gentle fade toward luminance
      r += (lum - r) * 0.16;
      g += (lum - g) * 0.16;
      b += (lum - b) * 0.16;
      // lifted warm blacks
      r = r * 0.9 + 26;
      g = g * 0.9 + 19;
      b = b * 0.9 + 13;
      const n = hashNoise(x, y) * 11;
      d[i] = r + n; d[i + 1] = g + n; d[i + 2] = b + n;
    }
  }
}

function stylize(ctx, w, h, grade, treatment) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  applyGrade(d, grade);
  if (treatment === 'gameart') {
    posterize(d, 7);
    edgeInk(d, w, h, 0.85, [16, 11, 14]);
  } else if (treatment === 'heatwave') {
    applyHeatwave(d, w, h);
    edgeInk(d, w, h, 0.35, [14, 5, 30]);
  } else if (treatment === 'duskfilm') {
    applyDuskFilm(d, w, h);
  }
  ctx.putImageData(img, 0, 0);
}

// ---------------------------------------------------------------- render

function placeholder(ctx, x, y, w, h, label) {
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, '#2b2140');
  grad.addColorStop(0.55, '#7a2d5e');
  grad.addColorStop(1, '#e8703a');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `600 ${Math.max(13, Math.round(w * 0.045))}px 'Plus Jakarta Sans', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2);
}

// Renders the whole cover onto ctx at (0, 0) with the state's canvas size.
// imgFor(src) must return a loaded HTMLImageElement or null.
export function renderCover(ctx, state, imgFor) {
  const size = SIZES[state.size] || SIZES.portrait;
  const W = size.w, H = size.h;
  ctx.fillStyle = '#0d0b12';
  ctx.fillRect(0, 0, W, H);
  const panels = panelsFor(state.layout, W, H);
  const scratch = document.createElement('canvas');
  scratch.width = W; scratch.height = H;
  const sctx = scratch.getContext('2d');

  panels.forEach((panel, idx) => {
    const [bx, by, bw, bh] = panelBBox(panel);
    const pc = document.createElement('canvas');
    pc.width = Math.max(2, Math.round(bw));
    pc.height = Math.max(2, Math.round(bh));
    const pctx = pc.getContext('2d');
    const slot = state.slots[idx] || emptySlot(null);
    const img = slot.src ? imgFor(slot.src) : null;
    if (img) drawPhotoCover(pctx, img, 0, 0, pc.width, pc.height, slot);
    else placeholder(pctx, 0, 0, pc.width, pc.height, 'ADD PHOTO');
    stylize(pctx, pc.width, pc.height, state.grade, state.treatment);
    sctx.save();
    panelPath(sctx, panel);
    sctx.clip();
    sctx.drawImage(pc, bx, by);
    sctx.restore();
  });

  ctx.drawImage(scratch, 0, 0);

  // Keylines between panels and a frame around the whole poster.
  const key = Math.max(3, Math.round(W * 0.0055));
  ctx.strokeStyle = '#f2ede4';
  ctx.lineWidth = key;
  for (const panel of panels) {
    panelPath(ctx, panel);
    ctx.stroke();
  }
  ctx.strokeStyle = '#0d0b12';
  ctx.lineWidth = key * 2.4;
  ctx.strokeRect(0, 0, W, H);

  drawCaption(ctx, state, W, H);
}

function drawCaption(ctx, state, W, H) {
  const title = (state.title || '').trim() || STUDIO.name;
  const subtitle = (state.subtitle || '').trim();
  if (state.layout === 'hero') {
    // Solid billing band along the bottom.
    const bandH = Math.round(H * 0.17);
    ctx.fillStyle = 'rgba(13, 9, 20, 0.92)';
    ctx.fillRect(0, H - bandH, W, bandH);
    ctx.fillStyle = '#ffcf7d';
    ctx.fillRect(0, H - bandH, W, Math.max(3, Math.round(H * 0.006)));
    captionText(ctx, title, subtitle, W * 0.055, H - bandH + bandH * 0.24, W * 0.89, bandH * 0.52);
    return;
  }
  // Scrim from the top, title block over it.
  const scrimH = H * 0.34;
  const grad = ctx.createLinearGradient(0, 0, 0, scrimH);
  grad.addColorStop(0, 'rgba(10, 6, 18, 0.62)');
  grad.addColorStop(1, 'rgba(10, 6, 18, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, scrimH);
  captionText(ctx, title, subtitle, W * 0.055, H * 0.045, W * 0.89, H * 0.105);
}

function captionText(ctx, title, subtitle, x, y, maxW, titleH) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  let size = titleH * 1.55;
  ctx.font = `${size}px Anton, 'Plus Jakarta Sans', sans-serif`;
  while (ctx.measureText(title).width > maxW && size > 18) {
    size *= 0.94;
    ctx.font = `${size}px Anton, 'Plus Jakarta Sans', sans-serif`;
  }
  ctx.save();
  ctx.shadowColor = 'rgba(8, 4, 14, 0.85)';
  ctx.shadowBlur = size * 0.16;
  ctx.shadowOffsetY = size * 0.045;
  const grad = ctx.createLinearGradient(0, y, 0, y + size);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.62, '#ffe9c4');
  grad.addColorStop(1, '#ffb35c');
  ctx.fillStyle = grad;
  ctx.fillText(title, x, y);
  ctx.restore();
  if (subtitle) {
    const sub = subtitle.toUpperCase();
    let ss = Math.max(13, size * 0.21);
    ctx.font = `700 ${ss}px 'Plus Jakarta Sans', sans-serif`;
    while (ctx.measureText(sub).width > maxW && ss > 9) {
      ss *= 0.94;
      ctx.font = `700 ${ss}px 'Plus Jakarta Sans', sans-serif`;
    }
    try { ctx.letterSpacing = `${Math.round(ss * 0.34)}px`; } catch (e) { /* older canvas */ }
    ctx.fillStyle = '#ffd9ec';
    ctx.shadowColor = 'rgba(8, 4, 14, 0.8)';
    ctx.shadowBlur = ss * 0.5;
    ctx.fillText(sub, x, y + size * 1.08);
    ctx.shadowBlur = 0;
    try { ctx.letterSpacing = '0px'; } catch (e) { /* older canvas */ }
  }
}
