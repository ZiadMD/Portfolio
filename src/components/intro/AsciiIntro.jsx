'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createIntro, TOTAL } from './introEngine.js';

/**
 * <AsciiIntro
 *    src="/desktop.jpg" eye={[0.5, 0.33]}
 *    variants={[{ media: '(max-width: 768px)', src: '/mobile.jpg', eye: [0.5, 0.30], endZoom: 1.2 }]}
 *    audioSrc="/intro.mp3"
 *    onFinish={() => setIntroDone(true)} />
 *
 * Props
 *  src          portrait image URL (default image, used when no variant matches)
 *  variants     optional list of { media, src, eye, endZoom, endCenterX, endCenterY, invert } overrides.
 *               `media` is any CSS media query; the first one that matches wins (e.g. a phone-specific photo).
 *  eye          [x, y] of the point the animation grows from, as fractions of the photo (default [0.5, 0.325])
 *  endZoom      final framing, 1 = whole photo, 1.45 = head & shoulders (default 1.45)
 *  endCenterX/Y which part of the photo ends centred, 0..1 (defaults: eye x, 0.42)
 *  invert       'auto' (default) flips tones for light-background photos; true / false to force
 *  audioSrc     optional soundtrack (the ENTER click also unlocks browser audio)
 *  onFinish     called once when the sequence ends, or right away if the image fails to load / canvas is unavailable
 *  onError      called with the error if something goes wrong (the intro then skips itself so your site is never blocked)
 *  skippable    click / Esc / Space jumps to the end (default true)
 *  debugTime    render one static frame at this time in seconds (for tuning)
 *  fadeOut      fade to black at the very end (default false)
 *  maxCells     cap on characters on screen (default 45000); lower it for weak devices
 */
export default function AsciiIntro({
  src, variants, eye = [0.5, 0.325], endZoom = 1.45, endCenterX, endCenterY = 0.42, invert,
  audioSrc, onFinish, onError, skippable = true, debugTime, fadeOut = false, maxCells,
  startLabel = 'ENTER', silentLabel = 'enter without sound', className, style,
}) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const rafRef = useRef(0);
  const audioRef = useRef(null);
  const t0Ref = useRef(0);
  const finishedRef = useRef(false);
  const startedRef = useRef(false);
  const lastTRef = useRef(0);
  const onFinishRef = useRef(onFinish);
  const onErrorRef = useRef(onError);
  onFinishRef.current = onFinish; onErrorRef.current = onError;
  const [phase, setPhase] = useState('loading');           // loading | ready | playing | done | error

  // ---- pick the right photo for this screen (and re-pick if the screen changes, e.g. rotating a phone)
  const [mediaTick, setMediaTick] = useState(0);
  useEffect(() => {
    if (!variants?.length || !window.matchMedia) return undefined;
    const mqs = variants.map((v) => window.matchMedia(v.media));
    const bump = () => setMediaTick((n) => n + 1);
    mqs.forEach((m) => m.addEventListener?.('change', bump));
    return () => mqs.forEach((m) => m.removeEventListener?.('change', bump));
  }, [variants]);
  const cfg = useMemo(() => {
    const base = { src, eye, endZoom, endCenterX, endCenterY, invert };
    const hit = typeof window === "undefined" ? null : variants?.find((v) => window.matchMedia?.(v.media).matches);
    return { ...base, ...(hit || {}) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, variants, mediaTick, endZoom, endCenterY, invert, JSON.stringify(eye)]);
  const cfgKey = JSON.stringify([cfg.src, cfg.eye, cfg.endZoom, cfg.endCenterX, cfg.endCenterY, cfg.invert, fadeOut, maxCells]);

  const fail = useCallback((err) => {
    console.warn('[AsciiIntro] skipped:', err);
    cancelAnimationFrame(rafRef.current);
    audioRef.current?.pause();
    setPhase('error');
    onErrorRef.current?.(err);
    if (!finishedRef.current) { finishedRef.current = true; onFinishRef.current?.(); }
  }, []);

  const tick = useCallback(() => {
    try {
      const t = (performance.now() - t0Ref.current) / 1000;
      lastTRef.current = t;
      engineRef.current.renderAt(t);
      if (t >= TOTAL && !finishedRef.current) { finishedRef.current = true; setPhase('done'); onFinishRef.current?.(); }
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) { fail(e); }
  }, [fail]);

  const begin = useCallback((withSound) => {
    if (!engineRef.current) return;
    startedRef.current = true;
    if (withSound && audioSrc) {
      const a = new Audio(audioSrc); a.preload = 'auto'; audioRef.current = a;
      a.play().catch(() => {});
    }
    t0Ref.current = performance.now();
    setPhase('playing');
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [audioSrc, tick]);

  // ---- load the photo, build the engine (re-runs if the chosen photo changes) --------------------
  useEffect(() => {
    let dead = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => { if (!dead) fail(new Error(`image failed to load: ${cfg.src}`)); };
    img.onload = () => {
      if (dead || !canvasRef.current) return;
      try {
        engineRef.current = createIntro(canvasRef.current, img, {
          eye: cfg.eye, fadeOut, endZoom: cfg.endZoom, endCenterX: cfg.endCenterX, endCenterY: cfg.endCenterY,
          invert: cfg.invert, maxCells,
        });
        if (debugTime !== undefined) { engineRef.current.renderAt(debugTime); setPhase('debug'); return; }
        if (startedRef.current) { engineRef.current.renderAt(lastTRef.current); return; }          // photo swapped mid-intro
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (reduce) { engineRef.current.renderAt(TOTAL); finishedRef.current = true; setPhase('done'); onFinishRef.current?.(); return; }
        if (!audioSrc) begin(false); else setPhase('ready');
      } catch (e) { fail(e); }
    };
    img.src = cfg.src;
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfgKey]);

  useEffect(() => () => { cancelAnimationFrame(rafRef.current); audioRef.current?.pause(); }, []);

  useEffect(() => {                                        // static debug frame
    if (debugTime !== undefined && engineRef.current) engineRef.current.renderAt(debugTime);
  }, [debugTime]);

  useEffect(() => {                                        // keep the character grid matched to the viewport
    const el = canvasRef.current; if (!el || !window.ResizeObserver) return undefined;
    const ro = new ResizeObserver(() => {
      if (!engineRef.current) return;
      try {
        engineRef.current.resize();
        engineRef.current.renderAt(debugTime !== undefined ? debugTime : lastTRef.current);
      } catch (e) { fail(e); }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [debugTime, fail]);

  const skip = useCallback(() => {
    if (!skippable || phase !== 'playing') return;
    t0Ref.current = performance.now() - (TOTAL + 0.05) * 1000;
    const a = audioRef.current;
    if (a) { const v0 = a.volume; let k = 0; const id = setInterval(() => { k += 1; a.volume = Math.max(0, v0 * (1 - k / 10)); if (k >= 10) { clearInterval(id); a.pause(); } }, 40); }
  }, [skippable, phase]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' || e.key === ' ') skip(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [skip]);

  const mono = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  const btn = {
    background: 'transparent', color: '#ff1a24', border: '1px solid #ff1a24', padding: '12px 28px',
    font: `600 14px ${mono}`, letterSpacing: '0.35em', cursor: 'pointer', textShadow: '0 0 10px #ff1a24',
  };

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%', background: '#000', ...style }}
         onClick={skip} role="img" aria-label="Animated ASCII portrait intro">
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      {phase === 'ready' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center', justifyContent: 'center' }}>
          <button style={btn} onClick={(e) => { e.stopPropagation(); begin(true); }}>[ {startLabel} ]</button>
          <button style={{ ...btn, border: 'none', fontSize: 11, opacity: 0.6, letterSpacing: '0.2em' }} onClick={(e) => { e.stopPropagation(); begin(false); }}>{silentLabel}</button>
        </div>
      )}
      {phase === 'playing' && skippable && (
        <div style={{ position: 'absolute', right: 16, bottom: 12, font: `11px ${mono}`, color: 'rgba(255,26,36,0.55)', letterSpacing: '0.2em', pointerEvents: 'none' }}>click to skip</div>
      )}
    </div>
  );
}
