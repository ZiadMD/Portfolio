/**
 * introEngine.js — framework-agnostic ASCII intro renderer (canvas 2D, no dependencies).
 *
 * Story: 10 red nodes pop in -> every node links to every other -> they morph into a talking
 * sound-wave -> the wave glitches, panics and tries to escape -> your portrait spreads out from
 * the eye, catches it and locks it in, under red matrix rain.
 *
 * Everything is math on one still photo. A direct port of the Python reference.
 */

// ------------------------------------------------------------------ timeline (seconds) ----
export const TIMELINE = {
  nodesIn: [0.3, 1.5],
  links: [1.6, 3.2],
  morph: 3.7,
  talk: 4.7,
  glitch: [5.6, 7.0],
  escape: [6.5, 8.0],
  portrait: 7.2,          // portrait scene local time 0
  portraitLen: 7.5,
};
export const TOTAL = TIMELINE.portrait + TIMELINE.portraitLen;          // 14.7 s

const T_MORPH = TIMELINE.morph, T_GL0 = TIMELINE.glitch[0], T_GL1 = TIMELINE.glitch[1];
const T_ESC0 = TIMELINE.escape[0], T_ESC1 = TIMELINE.escape[1];
const T_P0 = TIMELINE.portrait, SECS_P = TIMELINE.portraitLen;

const SYL = [[4.7, .20, .7], [5.0, .16, .5], [5.25, .26, .9], [5.7, .18, .6], [5.95, .18, .7], [6.2, .28, 1.0], [6.5, .3, 1.2]];
const PORT_EVENTS = [[1.2, .25], [2.6, .25], [4.2, .3], [5.6, .3], [6.9, .4]];

// ------------------------------------------------------------------------- constants -------
const CW = 6, CH = 12, SS = 2;                                  // glyph cell (px) + supersampling
const RAMP = ' .:-=+*#%@';
const RAINSET = '0123456789ABCDEFXYZ<>{}[]()/\\|=+*:;#$%&@?!';
const NR = RAMP.length, NRN = RAINSET.length;
const RED = [1.0, 0.07, 0.10], HEADC = [1.0, 0.80, 0.80];
const NN = 10, NS = 96;                                         // nodes, wave samples
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const SM = (a, b, x) => { const q = clamp((x - a) / (b - a)); return q * q * (3 - 2 * q); };

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------------ glyph atlas -------------
let GLYPHS = null;       // Uint8Array(nGlyph * CW*CH) coverage masks
function buildGlyphs(fontFamily) {
  if (GLYPHS) return GLYPHS;
  const c = document.createElement('canvas'); c.width = CW; c.height = CH;
  const g = c.getContext('2d', { willReadFrequently: true });
  const mask = (ch) => {
    g.clearRect(0, 0, CW, CH);
    g.fillStyle = '#fff'; g.font = `10px ${fontFamily}`; g.textBaseline = 'top';
    g.fillText(ch, 0, 0);
    const d = g.getImageData(0, 0, CW, CH).data, m = new Uint8Array(CW * CH);
    for (let i = 0; i < CW * CH; i++) m[i] = d[i * 4 + 3];
    return m;
  };
  const ramp = [...RAMP].map(mask);
  const ink = ramp.map((m) => m.reduce((a, b) => a + b, 0));
  const order = ink.map((_, i) => i).sort((a, b) => ink[a] - ink[b]);          // dark -> bright by real ink
  const all = [...order.map((i) => ramp[i]), ...[...RAINSET].map(mask)];
  GLYPHS = new Uint8Array(all.length * CW * CH);
  all.forEach((m, i) => GLYPHS.set(m, i * CW * CH));
  return GLYPHS;
}

// ---------------------------------------------------------------------- CLAHE ---------------
function clahe(src, cols, rows, out, tilesX = 8, tilesY = 8, clipLimit = 2.0) {
  const tw = cols / tilesX, th = rows / tilesY;
  const lut = new Uint8Array(tilesX * tilesY * 256), hist = new Int32Array(256);
  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      hist.fill(0);
      const x0 = Math.floor(tx * tw), x1 = Math.floor((tx + 1) * tw);
      const y0 = Math.floor(ty * th), y1 = Math.floor((ty + 1) * th);
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) hist[src[y * cols + x]]++;
      const area = Math.max(1, (x1 - x0) * (y1 - y0));
      const clip = Math.max(1, Math.floor((clipLimit * area) / 256));
      let excess = 0;
      for (let i = 0; i < 256; i++) if (hist[i] > clip) { excess += hist[i] - clip; hist[i] = clip; }
      const add = Math.floor(excess / 256); let rem = excess - add * 256;
      for (let i = 0; i < 256; i++) hist[i] += add;
      if (rem > 0) { const step = Math.max(1, Math.floor(256 / rem)); for (let i = 0; i < 256 && rem > 0; i += step) { hist[i]++; rem--; } }
      let sum = 0; const o = (ty * tilesX + tx) * 256, sc = 255 / area;
      for (let i = 0; i < 256; i++) { sum += hist[i]; lut[o + i] = Math.min(255, Math.round(sum * sc)); }
    }
  }
  for (let y = 0; y < rows; y++) {
    const fy = (y + 0.5) / th - 0.5, yA = Math.floor(fy), wy = fy - yA;
    const ya = clamp(yA, 0, tilesY - 1), yb = clamp(yA + 1, 0, tilesY - 1);
    for (let x = 0; x < cols; x++) {
      const fx = (x + 0.5) / tw - 0.5, xA = Math.floor(fx), wx = fx - xA;
      const xa = clamp(xA, 0, tilesX - 1), xb = clamp(xA + 1, 0, tilesX - 1);
      const v = src[y * cols + x];
      const a = lut[(ya * tilesX + xa) * 256 + v], b = lut[(ya * tilesX + xb) * 256 + v];
      const c = lut[(yb * tilesX + xa) * 256 + v], d = lut[(yb * tilesX + xb) * 256 + v];
      out[y * cols + x] = (a * (1 - wx) + b * wx) * (1 - wy) + (c * (1 - wx) + d * wx) * wy;
    }
  }
}

// ======================================================================= ENGINE ============
export function createIntro(canvas, image, opts = {}) {
  const eye = opts.eye || [0.5, 0.325];                    // eye position in the photo (0..1)
  const fontFamily = opts.fontFamily || 'ui-monospace, SFMono-Regular, Menlo, Consolas, "DejaVu Sans Mono", monospace';
  const fadeOut = !!opts.fadeOut;
  const endZoom = opts.endZoom ?? 1.45, endCenterY = opts.endCenterY ?? 0.42;   // final framing (1 = whole photo)
  const endCenterX = opts.endCenterX ?? eye[0];                                       // keep the subject centred sideways

  // ---- source photo: shrink huge images once so every frame stays cheap ---------------------------
  let sw = image.naturalWidth || image.width, sh = image.naturalHeight || image.height;
  if (!sw || !sh) throw new Error('AsciiIntro: the image has no size (did it load?)');
  let source = image;
  const maxSide = opts.maxImageSide || 1600;
  if (Math.max(sw, sh) > maxSide) {
    const k = maxSide / Math.max(sw, sh), c = document.createElement('canvas');
    c.width = Math.round(sw * k); c.height = Math.round(sh * k);
    c.getContext('2d').drawImage(image, 0, 0, c.width, c.height);
    source = c; sw = c.width; sh = c.height;
  }
  // ---- light-background photos: invert the tones so the background stays black ---------------------
  let invert = opts.invert === true;
  if (opts.invert === undefined || opts.invert === 'auto') {
    try {
      const probe = document.createElement('canvas'); probe.width = probe.height = 24;
      const pg = probe.getContext('2d', { willReadFrequently: true }); pg.drawImage(source, 0, 0, 24, 24);
      const d = pg.getImageData(0, 0, 24, 24).data; let sum = 0, cnt = 0;
      for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) {
        if (x > 1 && x < 22 && y > 1 && y < 22) continue;                              // border ring only
        const o = (y * 24 + x) * 4; sum += (0.299 * d[o] + 0.587 * d[o + 1] + 0.114 * d[o + 2]) / 255; cnt++;
      }
      invert = sum / cnt > 0.6;
    } catch { invert = false; }
  }
  const glyphs = buildGlyphs(fontFamily);
  const GSZ = CW * CH, blank = new Uint8Array(glyphs.length / GSZ);         // glyphs with no ink (space)
  for (let g = 0; g < blank.length; g++) { let s = 0; for (let k = 0; k < GSZ; k++) s += glyphs[g * GSZ + k]; blank[g] = s ? 0 : 1; }
  const ctx = canvas.getContext('2d');

  // offscreen canvases (re-sized in layout())
  const ac = document.createElement('canvas');             // network, cell resolution x SS (becomes characters)
  const actx = ac.getContext('2d', { willReadFrequently: true });
  const pc = document.createElement('canvas');             // photo samples, cell resolution x SS
  const pctx = pc.getContext('2d', { willReadFrequently: true });
  const bl1 = document.createElement('canvas'), bl2 = document.createElement('canvas');
  const b1 = bl1.getContext('2d'), b2 = bl2.getContext('2d');

  let cols = 0, rows = 0, N = 0, W = 0, H = 0, DIAG = 0;
  let cellRand, cellChars, RL, RS, RO, RA;
  let gi, cr, cg, cb, pg, pr, pgc, pb, shown, front, lis, bR, headR, lum8, lumEq;
  let sR, sG, sB, sampledT = -1e9;                          // sampled photo colours, and when
  let bI, bRc, bGc, bBc, baseSettled = false;               // portrait glyph + colour per cell, before rain
  let imgData, buf32;
  let NODE, TA, PHI, RR, LK, TL, SLOT, order;

  function layout() {
    const vw = Math.max(2, canvas.clientWidth), vh = Math.max(2, canvas.clientHeight);
    let cellH = Math.max(opts.minCell || 9, vh / (opts.rowsForHeight || 100));
    let r = Math.round(vh / cellH), c = Math.round(vw / (cellH / 2));
    while (r * c > (opts.maxCells || 45000)) { cellH *= 1.08; r = Math.round(vh / cellH); c = Math.round(vw / (cellH / 2)); }
    cols = Math.max(40, c); rows = Math.max(20, r); N = cols * rows;
    W = cols * CW; H = rows * CH; DIAG = Math.hypot(W, H);
    canvas.width = W; canvas.height = H;
    ac.width = pc.width = cols * SS; ac.height = pc.height = rows * SS;
    bl1.width = Math.max(2, Math.round(cols / 3)); bl1.height = Math.max(2, Math.round(rows / 3));
    bl2.width = Math.max(2, Math.round(cols / 8)); bl2.height = Math.max(2, Math.round(rows / 8));

    const rnd = mulberry32(11);
    cellRand = new Float32Array(N); cellChars = new Int16Array(N);
    for (let i = 0; i < N; i++) { cellRand[i] = rnd(); cellChars[i] = Math.floor(rnd() * NRN); }
    RL = [new Float32Array(cols), new Float32Array(cols)]; RS = [new Float32Array(cols), new Float32Array(cols)];
    RO = [new Float32Array(cols), new Float32Array(cols)]; RA = [new Uint8Array(cols), new Uint8Array(cols)];
    for (let k = 0; k < 2; k++) for (let i = 0; i < cols; i++) {
      RL[k][i] = 8 + Math.floor(rnd() * 22); RS[k][i] = 12 + rnd() * 30; RO[k][i] = rnd() * (rows + 30);
      RA[k][i] = rnd() < (k ? 0.5 : 0.75) ? 1 : 0;
    }
    gi = new Int16Array(N); cr = new Float32Array(N); cg = new Float32Array(N); cb = new Float32Array(N);
    pg = new Int16Array(N); pr = new Float32Array(N); pgc = new Float32Array(N); pb = new Float32Array(N);
    shown = new Uint8Array(N); front = new Uint8Array(N); lis = new Float32Array(N);
    bR = new Float32Array(N); headR = new Uint8Array(N); lum8 = new Uint8Array(N); lumEq = new Float32Array(N);
    sR = new Float32Array(N); sG = new Float32Array(N); sB = new Float32Array(N); sampledT = -1e9;
    bI = new Int16Array(N); bRc = new Float32Array(N); bGc = new Float32Array(N); bBc = new Float32Array(N); baseSettled = false;
    imgData = ctx.createImageData(W, H); buf32 = new Uint32Array(imgData.data.buffer);

    // ---- network: 10 random nodes (seeded), everything linked to everything --------------
    const rn = mulberry32(21);
    const pts = []; let sep = 0.16 * H, tries = 0;
    while (pts.length < NN) {
      const p = [(0.20 + 0.60 * rn()) * W, (0.28 + 0.44 * rn()) * H];
      if (pts.every((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) > sep)) pts.push(p);
      if (++tries > 3000) { sep *= 0.9; tries = 0; }
    }
    NODE = pts;
    order = Array.from({ length: NN }, (_, i) => i).sort(() => rn() - 0.5);
    TA = new Float32Array(NN); order.forEach((node, k) => { TA[node] = 0.3 + k * 0.12 + rn() * 0.05; });
    PHI = Float32Array.from({ length: NN }, () => rn() * 6.28); RR = Float32Array.from({ length: NN }, () => rn());
    const pairs = []; for (let i = 0; i < NN; i++) for (let j = i + 1; j < NN; j++) pairs.push([i, j]);
    for (let i = pairs.length - 1; i > 0; i--) { const j = Math.floor(rn() * (i + 1)); [pairs[i], pairs[j]] = [pairs[j], pairs[i]]; }
    LK = pairs; TL = pairs.map((_, k) => TIMELINE.links[0] + (TIMELINE.links[1] - TIMELINE.links[0]) * k / pairs.length);
    const rank = NODE.map((p, i) => i).sort((a, b) => NODE[a][0] - NODE[b][0]);
    SLOT = new Float32Array(NN); rank.forEach((node, k) => { SLOT[node] = (k + 0.5) / NN; });
  }

  // ------------------------------------------------------------------ speech + wave -----
  function speechEnv(t) {
    let e = 0;
    for (const [t0, d, h] of SYL) if (t >= t0 && t <= t0 + d) e = Math.max(e, h * Math.sin(Math.PI * (t - t0) / d) ** 2);
    e += 0.07 * SM(T_MORPH, T_MORPH + 0.8, t);
    if (t > T_ESC0) e = Math.max(e, 1.25 + 0.3 * Math.sin(40 * t));
    return e;
  }
  function waveY(xn, t, E) {
    const pat = 0.6 * Math.sin(2 * Math.PI * 5 * xn - 14 * t) + 0.4 * Math.sin(2 * Math.PI * 11 * xn + 9 * t);
    return H / 2 - 0.30 * H * E * pat * Math.sin(Math.PI * xn) ** 0.7;
  }
  function positions(t, fi) {
    const E = speechEnv(t), mline = SM(T_MORPH, T_MORPH + 0.9, t);
    const m = new Float32Array(NN), Pn = [], Ps = [];
    for (let i = 0; i < NN; i++) {
      m[i] = SM(T_MORPH + 0.3 * RR[i], T_MORPH + 0.8 + 0.3 * RR[i], t);
      const wx = W * (0.07 + 0.86 * SLOT[i]), wy = waveY(SLOT[i], t, E);
      Pn.push([NODE[i][0] * (1 - m[i]) + wx * m[i], NODE[i][1] * (1 - m[i]) + wy * m[i]]);
    }
    for (let i = 0; i < NS; i++) { const xn = i / (NS - 1); Ps.push([W * (0.07 + 0.86 * xn), waveY(xn, t, E)]); }
    const gj = SM(T_GL0, T_GL1, t) * 0.9;
    if (gj > 0) {
      const nr = mulberry32(fi * 5 + 2);
      for (let i = 0; i < NS; i++) Ps[i][1] += gj * (nr() - 0.5) * 120 * mline;
      for (let i = 0; i < NN; i++) Pn[i][1] += gj * (nr() - 0.5) * 120 * m[i];
    }
    if (t > T_ESC0) {                                        // the wave shatters and everything runs
      const k = 0.9 * DIAG * SM(T_ESC0, T_ESC1, t) ** 2;
      const fly = (P, ang) => {
        const dx = P[0] - W / 2, dy = P[1] - H / 2, n = Math.hypot(dx, dy) + 1e-3;
        P[0] += (dx / n + 0.6 * Math.cos(ang)) * k; P[1] += (dy / n + 0.6 * Math.sin(ang)) * k;
      };
      Ps.forEach((P, i) => fly(P, i * 2.4)); Pn.forEach((P, i) => fly(P, PHI[i] * 5));
    }
    return { Pn, Ps, m, mline };
  }

  // ----------------------------------------------------------------- the network scene ---
  function buildScene(t, fi) {
    const { Pn, Ps, m, mline } = positions(t, fi);
    const lines = [], dots = [];                             // lines: [x1,y1,x2,y2,w,alpha]  dots: [x,y,r,alpha]
    const chainF = 1 - SM(T_ESC0, T_ESC0 + 0.5, t);
    LK.forEach(([a, b], j) => {
      const g = clamp((t - TL[j]) / 0.35);
      const la = g * (1 - (m[a] + m[b]) / 2) * chainF;
      if (la > 0.02) lines.push([Pn[a][0], Pn[a][1], Pn[a][0] + (Pn[b][0] - Pn[a][0]) * g, Pn[a][1] + (Pn[b][1] - Pn[a][1]) * g, 2, 0.55 * la]);
    });
    if (mline * chainF > 0.02) {
      for (let i = 0; i < NS - 1; i++) lines.push([Ps[i][0], Ps[i][1], Ps[i + 1][0], Ps[i + 1][1], 3, 0.9 * mline * chainF]);
      for (let i = 0; i < NS; i++) lines.push([Ps[i][0], H / 2, Ps[i][0], Ps[i][1], 1, 0.40 * mline * chainF]);
    }
    if (t > T_ESC0) {
      const prev = positions(t - 0.07, fi);
      const k = SM(T_ESC0, T_ESC0 + 0.5, t) * (1 - SM(T_ESC1 + 0.2, T_ESC1 + 1.0, t));
      const trail = (P, Q, spark) => P.forEach((p, i) => {
        if (p[0] > -50 && p[0] < W + 50 && p[1] > -50 && p[1] < H + 50) {
          lines.push([p[0], p[1], Q[i][0], Q[i][1], 2, 0.8 * k]);
          if (spark) dots.push([p[0], p[1], 2, k]);
        }
      });
      trail(Ps, prev.Ps, true); trail(Pn, prev.Pn, false);
    }
    for (let i = 0; i < NN; i++) {
      const da = SM(TA[i], TA[i] + 0.25, t) * (0.75 + 0.25 * Math.sin(6 * t + PHI[i]));
      if (da > 0.03 && Pn[i][0] > -10 && Pn[i][0] < W + 10 && Pn[i][1] > -10 && Pn[i][1] < H + 10)
        dots.push([Pn[i][0], Pn[i][1], 4 + 4 * da, Math.min(1, da)]);
    }
    return { lines, dots };
  }
  // glow: false = white source lines; true = the red glow strokes; 'halo' = the glow's blur source,
  // in the colour the glow's soft halo had (rgba(255,40,50,0.9) x the stroke's alpha)
  function drawScene(g, sc, glow) {
    const halo = glow === 'halo';
    g.lineCap = 'round';
    for (const [x1, y1, x2, y2, w, a] of sc.lines) {
      g.strokeStyle = halo ? `rgba(255,40,50,${a * 0.28 * 0.9})` : glow ? `rgba(255,50,60,${a * 0.28})` : `rgba(255,255,255,${a})`;
      g.lineWidth = glow ? w * 1.2 : w;
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    }
    for (const [x, y, r, a] of sc.dots) {
      g.fillStyle = halo ? `rgba(255,40,50,${a * 0.6 * 0.9})` : glow ? `rgba(255,60,70,${a * 0.6})` : `rgba(255,255,255,${a})`;
      g.beginPath(); g.arc(x, y, glow ? r * 1.4 : r, 0, 6.2832); g.fill();
    }
  }

  // ---- soft glow: the network is painted once onto a small layer, blurred once, and added on top.
  // (It used canvas shadowBlur, which blurs every line separately: up to ~190 blurs a frame.)
  const GLOW_DIV = 4, GLOW_SIGMA = 9;                      // layer scale; blur, in canvas pixels
  const canFilter = (() => { try { const t = document.createElement('canvas').getContext('2d'); t.filter = 'blur(1px)'; return t.filter === 'blur(1px)'; } catch { return false; } })();
  const gl1 = document.createElement('canvas'), gl2 = document.createElement('canvas');
  const g1 = gl1.getContext('2d'), g2 = gl2.getContext('2d');
  function drawGlow(sc, alpha) {
    const w = Math.max(2, Math.ceil(W / GLOW_DIV)), h = Math.max(2, Math.ceil(H / GLOW_DIV));
    if (gl1.width !== w || gl1.height !== h) { gl1.width = gl2.width = w; gl1.height = gl2.height = h; }
    g1.setTransform(1, 0, 0, 1, 0, 0); g1.globalCompositeOperation = 'source-over'; g1.clearRect(0, 0, w, h);
    g1.globalCompositeOperation = 'lighter';
    g1.setTransform(1 / GLOW_DIV, 0, 0, 1 / GLOW_DIV, 0, 0);
    drawScene(g1, sc, 'halo');
    let soft = gl1;
    g2.setTransform(1, 0, 0, 1, 0, 0); g2.globalCompositeOperation = 'source-over'; g2.clearRect(0, 0, w, h);
    if (canFilter) {
      g2.filter = `blur(${GLOW_SIGMA / GLOW_DIV}px)`; g2.drawImage(gl1, 0, 0); g2.filter = 'none'; soft = gl2;
    } else {
      // no canvas filter (older Safari): shrink further and let the upscale smooth it
      const k = 3, ws = Math.max(1, Math.round(w / k)), hs = Math.max(1, Math.round(h / k));
      g2.drawImage(gl1, 0, 0, ws, hs);
      g2.globalCompositeOperation = 'copy'; g2.drawImage(gl2, 0, 0, ws, hs, 0, 0, w, h); soft = gl2;
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = true; ctx.drawImage(soft, 0, 0, w * GLOW_DIV, h * GLOW_DIV);
    drawScene(ctx, sc, true);                               // the crisp red strokes on top, as before
    ctx.restore();
  }

  // ---- chromatic split on glitch frames: red shifted right, blue left, done by the canvas.
  let rgbR = null, rgbB = null;
  function splitRGB(sp) {
    if (!rgbR) { rgbR = document.createElement('canvas'); rgbB = document.createElement('canvas'); }
    for (const [cv, col] of [[rgbR, '#f00'], [rgbB, '#00f']]) {
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
      const g = cv.getContext('2d');
      g.globalCompositeOperation = 'copy'; g.drawImage(canvas, 0, 0);
      g.globalCompositeOperation = 'multiply'; g.fillStyle = col; g.fillRect(0, 0, W, H);
    }
    ctx.save();
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#0f0'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(rgbR, sp, 0); ctx.drawImage(rgbB, -sp, 0);
    ctx.restore();
  }

  // ------------------------------------------------------------------- rain -------------
  function rainField(t) {
    bR.fill(0); headR.fill(0);
    for (let k = 0; k < 2; k++) for (let c = 0; c < cols; c++) {
      if (!RA[k][c]) continue;
      const L = RL[k][c], pos = (RO[k][c] + RS[k][c] * t) % (rows + L);
      const r0 = Math.max(0, Math.ceil(pos - L + 1e-6)), r1 = Math.min(rows - 1, Math.floor(pos));
      for (let r = r0; r <= r1; r++) {
        const dist = pos - r; if (dist < 0 || dist >= L) continue;
        const i = r * cols + c, v = Math.exp(-dist / (L * 0.45));
        if (v > bR[i]) bR[i] = v;
        if (dist < 1) headR[i] = 1;
      }
    }
  }
  const rainGlyph = (i, t) => NR + (headR[i] ? (cellChars[i] * 3 + Math.floor(t * 30)) % NRN : (cellChars[i] + Math.floor(t * 9 + cellRand[i] * 11)) % NRN);

  // ----------------------------------------------------------------- portrait layer ------
  const imgAspect = sw / sh;
  function portraitLayer(tp, t) {
    const p = tp / SECS_P, k = SM(0.02, 0.62, p), zoom = endZoom + 1.9 * (1 - k);
    const cxn = eye[0] + (endCenterX - eye[0]) * k, cyn = eye[1] + (endCenterY - eye[1]) * k + 0.003 * Math.sin(tp * 1.1);
    const fit = Math.min(H / sh, W / sw);
    const dh = sh * fit * zoom, dw = dh * imgAspect;
    const dx = W / 2 - cxn * dw, dy = H / 2 - cyn * dh;
    // Once the story is over (the hero keeps rendering past TOTAL) the portrait is held still: the photo
    // is sampled and its glyphs worked out once, and only the rain over it moves.
    const settled = t > TOTAL;
    const fresh = !settled || sampledT < 0;
    if (fresh) { samplePhoto(tp, dx, dy, dw, dh); sampledT = t; }
    if (fresh || !baseSettled) portraitBase(tp, p, cxn, cyn, dw, dh, settled);
    portraitRain(t, p);
  }
  function samplePhoto(tp, dx, dy, dw, dh) {
    pctx.setTransform(1, 0, 0, 1, 0, 0); pctx.fillStyle = invert ? '#fff' : '#000'; pctx.fillRect(0, 0, pc.width, pc.height);
    pctx.setTransform(SS / CW, 0, 0, SS / CH, 0, 0); pctx.imageSmoothingQuality = 'high';
    pctx.drawImage(source, dx, dy, dw, dh);
    // cheap bloom: a blurred copy (downscale -> upscale) added on top
    pctx.setTransform(1, 0, 0, 1, 0, 0);
    b1.drawImage(pc, 0, 0, bl1.width, bl1.height); b2.drawImage(pc, 0, 0, bl2.width, bl2.height);
    pctx.globalCompositeOperation = 'lighter';
    pctx.globalAlpha = 0.20; pctx.drawImage(bl1, 0, 0, pc.width, pc.height);
    pctx.globalAlpha = 0.12; pctx.drawImage(bl2, 0, 0, pc.width, pc.height);
    pctx.globalAlpha = 1; pctx.globalCompositeOperation = 'source-over';
    const d = pctx.getImageData(0, 0, pc.width, pc.height).data, pw = pc.width;
    const pulse = 0.5 + 0.5 * Math.sin(tp * 2 * Math.PI * 0.9), rb = 0.2 + 0.45 * pulse;
    const cellsR = sR, cellsG = sG, cellsB = sB;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      let R = 0, G = 0, B = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const o = ((r * SS + sy) * pw + c * SS + sx) * 4; R += d[o]; G += d[o + 1]; B += d[o + 2];
      }
      R /= 255 * SS * SS; G /= 255 * SS * SS; B /= 255 * SS * SS;
      if (invert) { R = 1 - R; G = 1 - G; B = 1 - B; }
      const red = clamp(R - 0.5 * (G + B)); R += red * RED[0] * rb; G += red * RED[1] * rb; B += red * RED[2] * rb;
      const i = r * cols + c;
      cellsR[i] = clamp(R) ** 0.9; cellsG[i] = clamp(G) ** 0.9; cellsB[i] = clamp(B) ** 0.9;
      lum8[i] = Math.round(clamp(0.299 * cellsR[i] + 0.587 * cellsG[i] + 0.114 * cellsB[i]) * 255);
    }
    clahe(lum8, cols, rows, lumEq);
  }
  // each cell's portrait glyph and colour (before rain), and whether it is revealed yet
  function portraitBase(tp, p, cxn, cyn, dw, dh, settled) {
    const cellsR = sR, cellsG = sG, cellsB = sB;

    // radial reveal from the eye (settled: everything is revealed, the front has gone)
    const ex = W / 2 + (eye[0] - cxn) * dw, ey = H / 2 + (eye[1] - cyn) * dh;
    const Rr = 1.25 * DIAG * SM(0.04, 0.58, p);
    const tint2 = 0.55 * (1 - SM(0.30, 0.85, p));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      let heat = 0;
      if (settled) { shown[i] = 1; front[i] = 0; }
      else {
        const cx_ = (c + 0.5) * CW - ex, cy_ = (r + 0.5) * CH - ey;
        const dd = Math.hypot(cx_, cy_) + (cellRand[i] - 0.5) * 70 + 22 * Math.sin(Math.atan2(cy_, cx_) * 9 + tp * 4);
        shown[i] = dd < Rr ? 1 : 0;
        front[i] = (Math.abs(dd - Rr) < 12 && p > 0.04 && Rr < 1.2 * DIAG) ? 1 : 0;
        if (!shown[i]) continue;
        heat = clamp(1 - (Rr - dd) / 260);
      }
      let lum = clamp((lumEq[i] / 255 - 0.05) / 0.95) ** 1.6;
      lum = clamp(lum + (cellRand[i] - 0.5) * 0.04);
      const idx = Math.min(NR - 1, Math.floor(lum * (NR - 1)));
      let R = clamp(cellsR[i] * 1.4) * 0.82 + lum * 0.18, G = clamp(cellsG[i] * 1.4) * 0.82 + lum * 0.18, B = clamp(cellsB[i] * 1.4) * 0.82 + lum * 0.18;
      R = R * (1 - tint2) + lum * 1.0 * tint2; G = G * (1 - tint2) + lum * 0.18 * tint2; B = B * (1 - tint2) + lum * 0.2 * tint2;
      const hk = heat * (0.35 + lum) * 0.7; R = clamp(R + hk * RED[0]); G = clamp(G + hk * RED[1]); B = clamp(B + hk * RED[2]);
      bI[i] = idx; bRc[i] = R; bGc[i] = G; bBc[i] = B;
    }
    baseSettled = settled;
  }
  // rain falls over the face and thins out
  function portraitRain(t, p) {
    const rainIn = 0.50 * (1 - SM(0.45, 0.95, p)) + 0.10;
    for (let i = 0; i < N; i++) {
      if (!shown[i]) continue;
      const bb = bR[i], hd = headR[i];
      const over = (bb * rainIn > 0.30 && cellRand[i] < 0.8) || (hd && cellRand[i] < rainIn + 0.2);
      const rc0 = hd ? HEADC[0] : bb * RED[0], rc1 = hd ? HEADC[1] : bb * RED[1], rc2 = hd ? HEADC[2] : bb * RED[2];
      if (over) { pg[i] = rainGlyph(i, t); pr[i] = rc0; pgc[i] = rc1; pb[i] = rc2; }
      else { pg[i] = bI[i]; pr[i] = bRc[i] + rc0 * 0.25 * rainIn; pgc[i] = bGc[i] + rc1 * 0.25 * rainIn; pb[i] = bBc[i] + rc2 * 0.25 * rainIn; }
    }
  }

  // ------------------------------------------------------------------- glitches -----------
  function glitchStrength(t, fi) {
    let s = 0;
    const ramp = SM(T_GL0, T_GL1, t);
    if (ramp > 0 && t < T_P0 + 0.6) s = Math.max(s, ramp * (0.25 + 0.75 * mulberry32(fi * 3 + 1)()));
    s = Math.max(s, 1 - Math.abs(t - T_P0) / 0.35);
    for (const [t0, dd] of PORT_EVENTS) s = Math.max(s, 1 - Math.abs(t - (T_P0 + t0)) / dd);
    // stray glitches: frequent during the story, rare once it has settled (the hero keeps rendering past TOTAL)
    if (mulberry32(fi * 13 + 5)() < (t > TOTAL ? 0.008 : 0.06)) s = Math.max(s, 0.3);
    return clamp(s);
  }
  function rollRows(r0, h, sh) {
    const tmp = new Float32Array(cols), tg = new Int16Array(cols);
    for (let r = r0; r < Math.min(rows, r0 + h); r++) {
      const o = r * cols;
      for (const arr of [cr, cg, cb]) { for (let c = 0; c < cols; c++) tmp[(c + sh + cols * 8) % cols] = arr[o + c]; arr.set(tmp, o); }
      for (let c = 0; c < cols; c++) tg[(c + sh + cols * 8) % cols] = gi[o + c]; gi.set(tg, o);
    }
  }

  // ----------------------------------------------------------------------- frame ---------
  function renderAt(t) {
    if (!cols) layout();
    const fi = Math.floor(t * 24);
    const tp = t - T_P0;

    // 1) network -> characters (long gone once the escape trails have faded)
    const scene = t < T_ESC1 + 1.5 ? buildScene(t, fi) : null;
    if (scene) {
      actx.setTransform(1, 0, 0, 1, 0, 0); actx.fillStyle = '#000'; actx.fillRect(0, 0, ac.width, ac.height);
      actx.setTransform(SS / CW, 0, 0, SS / CH, 0, 0);
      drawScene(actx, scene, false);
      const ad = actx.getImageData(0, 0, ac.width, ac.height).data, aw = ac.width;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        let s = 0;
        for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) s += ad[((r * SS + sy) * aw + c * SS + sx) * 4];
        lis[r * cols + c] = clamp(s / (255 * SS * SS) * 3.0) ** 0.75;
      }
    } else lis.fill(0);

    // 2) rain + portrait
    rainField(t);
    const gate = SM(T_P0 - 1.0, T_P0, t);
    if (tp >= 0) portraitLayer(tp, t);

    // 3) merge layers
    for (let i = 0; i < N; i++) {
      let g = 0, R = 0, G = 0, B = 0;
      const li = lis[i];
      if (li > 0.01) {
        g = Math.min(NR - 1, Math.floor(li * (NR - 1)));
        const wh = clamp((li - 0.78) * 4), base = 0.25 + 0.75 * li;
        R = RED[0] * base * (1 - wh) + HEADC[0] * wh; G = RED[1] * base * (1 - wh) + HEADC[1] * wh; B = RED[2] * base * (1 - wh) + HEADC[2] * wh;
      }
      const bb = bR[i], hd = headR[i];
      if (((bb * gate > 0.04) || (hd && gate > 0.4 && cellRand[i] < gate)) && li < 0.3) {
        g = rainGlyph(i, t); const mu = Math.max(gate, 0.05);
        R = (hd ? HEADC[0] : bb * RED[0]) * mu; G = (hd ? HEADC[1] : bb * RED[1]) * mu; B = (hd ? HEADC[2] : bb * RED[2]) * mu;
      }
      if (tp >= 0 && shown[i]) { g = pg[i]; R = pr[i]; G = pgc[i]; B = pb[i]; }
      if (tp >= 0 && front[i]) { g = NR + (cellChars[i] + fi) % NRN; R = 1; G = 0.9; B = 0.9; }
      gi[i] = g; cr[i] = R; cg[i] = G; cb[i] = B;
    }

    // 4) pointer lens (setPointer; used by the hero): cells near the cursor scramble into hot glyphs
    ptr.k = ptr.on ? Math.min(1, ptr.k + 0.3) : Math.max(0, ptr.k - 0.12);
    if (ptr.k > 0.01) {
      const ks = W / Math.max(1, canvas.clientWidth);
      const px = ptr.x * ks, py = ptr.y * (H / Math.max(1, canvas.clientHeight)), R = ptr.r * ks;
      const c0 = Math.max(0, Math.floor((px - R) / CW)), c1 = Math.min(cols - 1, Math.ceil((px + R) / CW));
      const r0 = Math.max(0, Math.floor((py - R) / CH)), r1 = Math.min(rows - 1, Math.ceil((py + R) / CH));
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const d = Math.hypot((c + 0.5) * CW - px, (r + 0.5) * CH - py);
        if (d >= R) continue;
        const i = r * cols + c, f = (1 - d / R) * ptr.k;
        if (cellRand[i] > f * 1.15) continue;
        const v = Math.max(cr[i], cg[i], cb[i]), hot = f * f;
        gi[i] = NR + (cellChars[i] + fi * 2 + c) % NRN;
        cr[i] = Math.max(v, 0.35 + 0.65 * f); cg[i] = RED[1] + 0.7 * hot; cb[i] = RED[2] + 0.7 * hot;
      }
    }

    // 5) glitches
    const s = glitchStrength(t, fi);
    if (s > 0) {
      const gr = mulberry32(fi * 7 + 1), ri = (a, b) => a + Math.floor(gr() * (b - a));
      const nb = 3 + Math.floor(9 * s);
      for (let q = 0; q < nb; q++) rollRows(ri(0, rows - 1), ri(1, 2 + Math.floor(7 * s)), ri(-(2 + Math.floor(28 * s)), 3 + Math.floor(28 * s)));
      const nbl = 1 + Math.floor(5 * s);
      for (let q = 0; q < nbl; q++) {
        const h = ri(2, 7), w = ri(6, 32), r0 = ri(0, rows - h), c0 = ri(0, Math.max(1, cols - w));
        for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w && c < cols; c++) {
          const i = r * cols + c, k = 0.5 + 0.5 * gr();
          gi[i] = NR + ri(0, NRN); cr[i] = RED[0] * k; cg[i] = RED[1] * k; cb[i] = RED[2] * k;
        }
      }
    }

    // 6) blit characters -> pixels (+ scanlines, RGB split, fade)
    const flick = s > 0.2 ? 1 + 0.35 * s * (mulberry32(fi)() - 0.3) : 1;
    const fade = SM(0, 0.25, t) * (fadeOut ? 1 - SM(TOTAL - 0.6, TOTAL, t) : 1) * flick * 255;
    buf32.fill(0xFF000000);
    const gsz = CW * CH;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c, R = cr[i] * fade, G = cg[i] * fade, B = cb[i] * fade;
      if (R + G + B < 4 || blank[gi[i]]) continue;
      const base = gi[i] * gsz;
      for (let ky = 0; ky < CH; ky++) {
        const sl = (ky & 1) ? 1 : 0.93, o = (r * CH + ky) * W + c * CW;
        for (let kx = 0; kx < CW; kx++) {
          const m = glyphs[base + ky * CW + kx]; if (!m) continue;
          const k = (m / 255) * sl, rr = Math.min(255, R * k) | 0, gg = Math.min(255, G * k) | 0, bb = Math.min(255, B * k) | 0;
          buf32[o + kx] = 0xFF000000 | (bb << 16) | (gg << 8) | rr;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
    if (s > 0.2) splitRGB(1 + Math.floor(7 * s));          // chromatic split on glitch frames

    // 7) soft red glow over the live network
    const gk = 1 - SM(T_P0, T_P0 + 1.5, t);
    if (gk > 0.01 && scene) drawGlow(scene, gk);
  }

  // pointer lens state: css px over the canvas, radius in css px, k eases in/out
  const ptr = { x: 0, y: 0, r: opts.pointerRadius || 70, on: false, k: 0 };

  layout();
  return {
    renderAt,
    resize() { layout(); },
    /** Cursor position in css px over the canvas, or null when it leaves. */
    setPointer(x, y) {
      if (x == null) { ptr.on = false; return; }
      ptr.x = x; ptr.y = y; ptr.on = true;
    },
    get size() { return { cols, rows, W, H }; },
  };
}
