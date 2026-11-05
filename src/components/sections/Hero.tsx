"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { ICONS, PULL, ORB } from "../../data/heroIcons"
import { DESKTOP_PHOTO_SRC, MOBILE_PHOTO_SRC } from "../../data/photoSrc"
import { SKILLS } from "../../data/portfolioData"
import { lenisRef } from "../../lib/lenis-ref"
import { INTRO_REPLAY_EVENT } from "../intro/IntroGate"

interface PhotoCell {
  tx: number
  ty: number
  baseTx: number
  baseTy: number
  r: number
  co: string
  dl: number
}

interface PhotoData {
  c: PhotoCell[]
  bmp: HTMLCanvasElement | null
}

interface LogoItem {
  pts: [number, number, number, number, number][]
  arm: number
  u0: number
  j: number
  dl: number
  sz: number
  hitT: number // timeline second it reached the core, or -1
}

interface SpiralItem {
  arm: number
  u: number
  j: number
  sz: number
  br: number
  isAccent: boolean
  twinkleSpeed: number
  twinklePhase: number
}

interface OrbitItem {
  pts: [number, number, number, number, number][]
  ring: number
  th: number
  sz: number
}

/** One dot of the particle name: where it starts, where the letter is. */
interface NameDot {
  sx: number
  sy: number
  tx: number
  ty: number
  dl: number
  r: number
  acc: boolean
  sw: number
}

/*
 * Intro timeline, in seconds. One story: your name forms from dust and
 * dissolves into the galaxy, your stack is absorbed into its core, the
 * core goes silent, then bursts into your portrait and your name flies
 * back out of it. The real heading text only appears once the particle
 * name has landed, so text and particles never pull apart.
 *
 * The intro is its own screen: the rest of the portfolio (nav, ruler,
 * status line, scrolling) is held back until `end`.
 */
const TL = {
  nameIn: 0.1, // dust starts converging into the name
  nameOut: 1.5, // the whole particle name lifts off into the galaxy
  nameGone: 2.5,
  spiralIn: 1.0,
  logosIn: 1.7,
  logoGap: 0.17,
  logoDur: 1.0,
  collapse: 3.0,
  silence: 5.0, // everything freezes on one bright point
  burst: 5.32, // flash, shockwave, portrait
  returnIn: 5.62, // the name flies back out of the core
  returnDur: 0.8,
  textIn: 6.65, // real heading crossfades in over the landed particles
  textDone: 7.0,
  end: 7.25, // portfolio is revealed
  shortStart: 4.4, // return visitors start here (mid-collapse)
} as const

const INTRO_SEEN_KEY = "zs-intro-seen"
/**
 * The hero's own particle-story intro. Off: the ASCII intro
 * (components/intro/IntroGate.tsx) plays before the hero instead, and the
 * hero opens in its settled state. Set true to bring the old intro back.
 */
const HERO_INTRO = false

// Ambient floating particles using Motion
const AMBIENT_PARTICLES = Array.from({ length: 18 }).map((_, i) => ({
  id: i,
  size: i % 3 === 0 ? 3.5 : i % 2 === 0 ? 2.5 : 1.8,
  left: `${((i * 17 + 7) % 92) + 4}%`,
  top: `${((i * 23 + 11) % 78) + 12}%`,
  duration: 8 + (i % 5) * 2.5,
  delay: (i % 6) * 0.9,
  driftX: (i % 2 === 0 ? 1 : -1) * (16 + (i % 4) * 8),
  isAccent: i % 4 === 0,
}))

// Live Cairo clock. Its own component so the per-second tick re-renders
// only this text, not the whole hero and its animated particles.
function CairoClock() {
  const [time, setTime] = useState<string>("--:--:--")
  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString("en-GB", { timeZone: "Africa/Cairo" }),
      )
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])
  return <time id="clk">{time}</time>
}

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null)
  const photoCanvasRef = useRef<HTMLCanvasElement>(null)
  const spiralCanvasRef = useRef<HTMLCanvasElement>(null)
  const shadowCanvasRef = useRef<HTMLCanvasElement>(null)
  const replayTriggerRef = useRef<(() => void) | null>(null)
  const skipTriggerRef = useRef<(() => void) | null>(null)
  const progressRef = useRef<HTMLSpanElement>(null)
  const reduceMotion = useReducedMotion()

  // Canvas particle simulations
  useEffect(() => {
    const hero = heroRef.current
    const P = photoCanvasRef.current
    const S = spiralCanvasRef.current
    if (!hero || !P || !S) return

    const px = P.getContext("2d")
    const sx = S.getContext("2d")
    if (!px || !sx) return

    const INK = "#ecebe7"
    const INKRGB = "236,235,231"
    const GRY = "#a9a9ad"

    const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
    const ei = (k: number) => k * k * k
    const eo = (k: number) => 1 - Math.pow(1 - k, 4)

    const rnd = (() => {
      let s = 7
      return () => (s = (s * 16807) % 2147483647) / 2147483647
    })()

    let W = 0
    let H = 0
    let D = 1
    let cx = 0
    let cy = 0
    let sc = 0
    let img: HTMLImageElement | null = null
    let ph: PhotoData | null = null
    let logos: LogoItem[] = []
    let sp: SpiralItem[] = []
    let orbits: OrbitItem[] = []

    let ang = 0
    let oA = 0
    let oB = 0
    let T0 = performance.now()
    let vis = true
    const M = { x: -1e4, y: -1e4 }

    // Intro playback state
    let nameDots: NameDot[] = []
    let charge = 0 // 0..1, grows as each logo is absorbed into the core
    let startT = 0 // timeline position playback began at (0 or TL.shortStart)
    let playingNow = false
    let frozenT: number | null = null // dev inspection only
    const h1El = hero.querySelector<HTMLElement>(".cap h1")
    const opCache = new Map<HTMLElement, number>()
    const setOp = (el: HTMLElement | null, v: number, lift = 0) => {
      if (!el) return
      const r = Math.round(v * 1000) / 1000
      if (opCache.get(el) === r) return
      opCache.set(el, r)
      el.style.opacity = String(r)
      el.style.transform = lift && r < 1 ? `translateY(${(1 - r) * lift}px)` : ""
    }

    // Organic aspect ratio: preserves spiral shape without extreme pancake stretching
    const wide = () => (W > H ? Math.min(1.22, 1 + (W / H - 1) * 0.18) : 1)

    function sample(k: string): [number, number, number, number, number][] {
      if (!ICONS[k]) return []
      const c = document.createElement("canvas")
      const g = c.getContext("2d")
      if (!g) return []
      c.width = c.height = 72
      g.fillStyle = "#ecebe7"
      g.scale(3, 3)
      g.fill(new Path2D(ICONS[k].p))

      const d = g.getImageData(0, 0, 72, 72).data
      const pts: [number, number, number, number, number][] = []
      for (let y = 0; y < 72; y += 3) {
        for (let x = 0; x < 72; x += 3) {
          if (d[(y * 72 + x) * 4 + 3] > 140) {
            const pX = x - 36
            const pY = y - 36
            const dist = Math.hypot(pX, pY)
            const angle = Math.atan2(pY, pX)
            const tear = (Math.sin(angle * 3 + dist * 0.15) + 1) * 0.5
            pts.push([pX, pY, dist, angle, tear])
          }
        }
      }
      return pts
    }

    const desktopImg = new Image()
    const mobileImg = new Image()

    function getPreferredImg(width: number): HTMLImageElement | null {
      const isMobile = width < 768
      const preferred = isMobile ? mobileImg : desktopImg
      if (preferred.complete && preferred.naturalWidth > 0) return preferred
      const fallback = isMobile ? desktopImg : mobileImg
      if (fallback.complete && fallback.naturalWidth > 0) return fallback
      return null
    }

    function buildSpiral() {
      sp = []
      const isMobile = W < 768
      const N = isMobile ? 2600 : 3800
      for (let i = 0; i < N; i++) {
        const u = 0.02 + 0.98 * rnd()
        // ~12% vibrant red-orange stardust embers
        const isAccent = rnd() < 0.12
        sp.push({
          arm: i % 4,
          u,
          j: (rnd() - 0.5) * 0.45 * (0.2 + u),
          sz:
            (rnd() < 0.12 ? 1.6 : rnd() < 0.35 ? 1.1 : 0.75) *
            (isMobile ? 0.9 : 1),
          br: 0.35 + 0.65 * rnd(),
          isAccent,
          twinkleSpeed: 1.5 + rnd() * 3.5,
          twinklePhase: rnd() * 6.28,
        })
      }
    }

    function buildLogos() {
      const isMobile = W < 768
      logos = PULL.map((k, i) => ({
        pts: sample(k),
        arm: i % 4,
        u0: 0.78 + (i % 3) * 0.06,
        j: (((i * 1.618) % 1) - 0.5) * 0.25,
        dl: i * TL.logoGap,
        sz: isMobile ? 1.45 : 1.6,
        hitT: -1,
      }))

      orbits = ORB.map((k, i) => ({
        pts: sample(k),
        ring: i % 2,
        th: (i >> 1) * (6.2832 / (ORB.length / 2)) + (i % 2) * 0.5,
        sz: isMobile ? 1.5 : 1.7,
      }))
    }

    /**
     * Sample the real <h1> text, in its computed font, at its exact place in
     * the hero, so the particle name lands where the heading text appears.
     * Multi-line headings fall back to a plain fade (no particle name).
     */
    function buildName() {
      nameDots = []
      if (!h1El || !hero) return
      const cs = getComputedStyle(h1El)
      const F = parseFloat(cs.fontSize)
      const lineH = parseFloat(cs.lineHeight) || F
      const hr = hero.getBoundingClientRect()
      const r = h1El.getBoundingClientRect()
      if (!F || r.width < 10 || r.height > lineH * 1.6) return

      const text = (h1El.textContent || "").trim()
      const pad = Math.ceil(F * 0.3)
      const cw = Math.ceil(r.width + pad * 2)
      const ch = Math.ceil(lineH + pad * 2)
      const c = document.createElement("canvas")
      c.width = cw
      c.height = ch
      const g = c.getContext("2d", { willReadFrequently: true })
      if (!g) return
      g.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
      if ("letterSpacing" in g) {
        ;(g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
          cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing
      }
      g.textBaseline = "alphabetic"
      g.fillStyle = "#fff"
      const m = g.measureText(text)
      const asc = m.fontBoundingBoxAscent || F * 0.8
      const desc = m.fontBoundingBoxDescent || F * 0.2
      // CSS puts a single line's glyph box in the middle of the line box.
      const base = pad + (lineH - (asc + desc)) / 2 + asc
      g.fillText(text, pad, base)

      const d = g.getImageData(0, 0, cw, ch).data
      const step = Math.max(2, Math.round(F / 28))
      const ox = r.left - hr.left - pad
      const oy = r.top - hr.top - pad
      for (let y = 0; y < ch; y += step) {
        for (let x = 0; x < cw; x += step) {
          if (d[(y * cw + x) * 4 + 3] < 128) continue
          const tx = ox + x
          const ty = oy + y
          // Start as dust scattered over the hero, biased toward the top.
          const sx = rnd() * W
          const sy = rnd() * H * 0.85
          nameDots.push({
            sx,
            sy,
            tx,
            ty,
            // Left-to-right sweep plus a little jitter.
            dl: ((tx - (r.left - hr.left)) / r.width) * 0.38 + rnd() * 0.08,
            r: step * (0.38 + rnd() * 0.12),
            acc: rnd() < 0.07,
            sw: (rnd() - 0.5) * 2.4,
          })
        }
      }
    }

    function buildPhoto() {
      if (!img || !img.naturalWidth || !img.naturalHeight) return
      const isMobile = W < 768
      const ia = img.naturalWidth / img.naturalHeight

      let hh: number
      let cell: number
      let cols: number
      let rows: number
      let ox: number
      let oy: number

      if (isMobile) {
        // Mobile sizing: target visible width <= 86% of viewport, max 380px
        const maxVisibleW = Math.min(W * 0.86, 380)
        const maxVisibleH = H * 0.65
        let targetVisibleH = maxVisibleW / 0.843
        if (targetVisibleH > maxVisibleH) {
          targetVisibleH = maxVisibleH
        }
        hh = targetVisibleH / 0.9514
        // High-resolution mobile density (cell ~3.2px)
        rows = Math.min(136, Math.max(96, Math.round(hh / 3.2)))
        cell = hh / rows
        cols = Math.round((hh * ia) / cell)
        ox = cx - (cols * cell) / 2
        oy = H - 38 - rows * cell
      } else {
        // Desktop sizing: target visible height <= 82% of viewport, max 820px
        const targetVisibleH = Math.min(H * 0.82, 820)
        const maxVisibleW = W * 0.78
        const visibleW = targetVisibleH * 1.077
        const effectiveVisibleH =
          visibleW > maxVisibleW ? maxVisibleW / 1.077 : targetVisibleH
        hh = effectiveVisibleH / 0.9505
        // High-resolution desktop density (cell ~3.8px) - more than 3X point density
        rows = Math.min(196, Math.max(140, Math.round(hh / 3.8)))
        cell = hh / rows
        cols = Math.round((hh * ia) / cell)
        ox = cx - (cols * cell) * (1414 / 2752)
        oy = H - rows * cell
      }

      const c = document.createElement("canvas")
      c.width = cols
      c.height = rows
      const g = c.getContext("2d")
      if (!g) return
      g.imageSmoothingEnabled = true
      g.imageSmoothingQuality = "high"
      g.drawImage(img, 0, 0, cols, rows)

      const d = g.getImageData(0, 0, cols, rows).data
      const cells: PhotoCell[] = []

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4
          if (d[i + 3] < 80) continue
          if (rnd() > clamp((rows - 1 - y) / (rows * 0.10))) continue

          const tx = ox + x * cell + cell / 2
          const ty = oy + y * cell + cell / 2
          const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255
          cells.push({
            tx,
            ty,
            baseTx: tx,
            baseTy: ty,
            r: cell * (0.36 + 0.18 * lum),
            co: `rgb(${d[i]},${d[i + 1]},${d[i + 2]})`,
            dl: (Math.hypot(tx - cx, ty - cy) / (W * 0.6)) * 0.7 + rnd() * 0.2,
          })
        }
      }

      // Pre-bake high-resolution bitmap with full devicePixelRatio D for buttery 120fps post-intro rendering
      const b = document.createElement("canvas")
      b.width = W * D
      b.height = H * D
      const bg = b.getContext("2d")
      if (bg) {
        bg.scale(D, D)
        for (let j = 0; j < cells.length; j++) {
          const cellItem = cells[j]
          bg.fillStyle = cellItem.co
          bg.beginPath()
          bg.arc(cellItem.baseTx, cellItem.baseTy, cellItem.r, 0, 6.283)
          bg.fill()
        }
      }

      ph = { c: cells, bmp: b }
      drawShadowSilhouette(ox, oy, cols, rows, cell)
    }

    function drawShadowSilhouette(
      ox: number,
      oy: number,
      cols: number,
      rows: number,
      cell: number,
    ) {
      const X = shadowCanvasRef.current
      if (!X || !img || !img.naturalWidth || !img.naturalHeight) return
      const xx = X.getContext("2d")
      if (!xx) return

      xx.clearRect(0, 0, W, H)
      const renderW = cols * cell
      const renderH = rows * cell
      if (renderW <= 0 || renderH <= 0) return

      xx.save()
      xx.imageSmoothingEnabled = true
      xx.imageSmoothingQuality = "high"
      xx.drawImage(img, ox, oy, renderW, renderH)
      xx.globalCompositeOperation = "source-in"
      xx.fillStyle = "#09090a"
      xx.fillRect(ox, oy, renderW, renderH)
      xx.restore()
    }

    function layout() {
      if (!hero) return
      const r = hero.getBoundingClientRect()
      W = r.width
      H = r.height
      D = Math.min(window.devicePixelRatio || 1, 2)

      P!.width = W * D
      P!.height = H * D
      S!.width = W * D
      S!.height = H * D

      px!.setTransform(D, 0, 0, D, 0, 0)
      sx!.setTransform(D, 0, 0, D, 0, 0)

      const X = shadowCanvasRef.current
      if (X) {
        X.width = W * D
        X.height = H * D
        const xx = X.getContext("2d")
        if (xx) xx.setTransform(D, 0, 0, D, 0, 0)
      }

      const isMobile = W < 768
      const targetImg = getPreferredImg(W)
      if (targetImg) {
        img = targetImg
      }

      // Center the spiral origin cleanly in the upper-middle hero viewport
      cx = W / 2
      cy = isMobile ? H * 0.44 : H * 0.48
      sc = isMobile ? Math.min(W * 0.9, H * 0.46) : Math.min(W, H) * 0.54

      buildSpiral()
      buildLogos()
      buildName()
      if (img) buildPhoto()
    }

    /**
     * Galaxy state over the timeline: s = radius scale, al = brightness,
     * sp = rotation speed. Dark while the name forms, then it fades in,
     * collapses with accelerating spin, stops dead (the silence), and
     * bursts back out.
     */
    function state(t: number) {
      if (t < TL.spiralIn) return { s: 1, al: 0, sp: 0.35 }
      if (t < TL.collapse) {
        const u = clamp((t - TL.spiralIn) / 1.0)
        return { s: 1, al: 0.5 * u, sp: 0.35 }
      }
      if (t < TL.silence) {
        const u = (t - TL.collapse) / (TL.silence - TL.collapse)
        return { s: 1 - 0.97 * ei(u), al: 0.5 + 0.5 * u, sp: 0.35 + 4.8 * ei(u) }
      }
      if (t < TL.burst) {
        // The silence: no rotation, the core draws in a touch tighter.
        const u = (t - TL.silence) / (TL.burst - TL.silence)
        return { s: 0.03 - 0.012 * eo(u), al: 1, sp: 0 }
      }
      if (t < TL.burst + 1.6) {
        const u = eo(clamp((t - TL.burst) / 1.6))
        return { s: 0.018 + 0.982 * u, al: 1 - 0.76 * u, sp: 6 - 5.92 * u }
      }
      return { s: 1, al: 0.24, sp: 0.08 }
    }

    /** The core: a point the stack is absorbed into, brighter with each logo. */
    function drawCore(t: number) {
      if (t < TL.logosIn || t > TL.burst + 0.15) return
      let pulse = 0
      for (const L of logos) {
        if (L.hitT >= 0 && t >= L.hitT) pulse += Math.exp(-(t - L.hitT) * 7)
      }
      const silent = t >= TL.silence && t < TL.burst
      // In the silence the core holds full charge with a faint tremor.
      const k = silent ? 1 : charge
      const tremor = silent ? 1 + 0.08 * Math.sin(t * 90) : 1
      const base = (1.5 + 5 * k + 4 * Math.min(1, pulse)) * tremor
      const fade = t > TL.burst ? 1 - (t - TL.burst) / 0.15 : 1

      sx!.fillStyle = "#ff4a3d"
      sx!.globalAlpha = (0.12 + 0.18 * k) * fade
      sx!.beginPath()
      sx!.arc(cx, cy, base * 3.2, 0, 6.283)
      sx!.fill()
      sx!.globalAlpha = (0.35 + 0.4 * k) * fade
      sx!.beginPath()
      sx!.arc(cx, cy, base * 1.7, 0, 6.283)
      sx!.fill()
      sx!.fillStyle = INK
      sx!.globalAlpha = Math.min(1, 0.6 + 0.4 * k + 0.3 * pulse) * fade
      sx!.beginPath()
      sx!.arc(cx, cy, base, 0, 6.283)
      sx!.fill()
      sx!.globalAlpha = 1
    }

    function drawSpiral(t: number, dt: number) {
      const st = state(t)
      ang += st.sp * dt
      sx!.clearRect(0, 0, W, H)

      const R = Math.min(W, H) * 0.22
      const w = wide()
      const isPostIntro = t >= TL.burst + 1.4
      const hasMouse = M.x > -1e3 && M.y > -1e3
      // Twinkle freezes during the silence so the stillness is total.
      const tt = t >= TL.silence && t < TL.burst ? TL.silence : t

      // Gentle mouse parallax tilt for cosmic depth
      const parallaxX = isPostIntro && hasMouse ? (M.x - cx) * 0.025 : 0
      const parallaxY = isPostIntro && hasMouse ? (M.y - cy) * 0.025 : 0

      for (let i = 0; i < sp.length; i++) {
        const p = sp[i]
        const a = p.arm * 1.5708 + p.u * 5.2 + p.j + ang
        const r = p.u * sc * st.s
        let x = cx + Math.cos(a) * r * w + parallaxX * (1 - p.u * 0.5)
        let y = cy + Math.sin(a) * r + parallaxY * (1 - p.u * 0.5)

        // Dynamic star twinkling
        const tw = 0.75 + 0.25 * Math.sin(tt * p.twinkleSpeed + p.twinklePhase)
        const al =
          Math.min(1, st.al * 1.5) * (0.28 + 0.72 * (1 - p.u * 0.6)) * p.br * tw
        const s = p.sz * (0.55 + (1 - p.u) * 0.9)

        if (hasMouse && st.s > 0.4) {
          const dx = x - M.x
          const dy = y - M.y
          const d = Math.hypot(dx, dy)
          if (d < R && d > 0) {
            const f = (1 - d / R) * 26
            x += (dx / d) * f
            y += (dy / d) * f
          }
        }

        sx!.globalAlpha = al
        sx!.fillStyle = p.isAccent ? "#ff4a3d" : INK
        sx!.beginPath()
        sx!.arc(x, y, s, 0, 6.283)
        sx!.fill()
      }
      sx!.globalAlpha = 1

      drawCore(t)

      // Dual shockwave rings from the burst
      if (t > TL.burst && t < TL.burst + 1.6) {
        const u = (t - TL.burst) / 1.6
        const maxR = Math.max(W, H) * 0.75

        // Primary starlight shockwave ring
        sx!.strokeStyle = `rgba(${INKRGB},${(1 - u) * 0.7})`
        sx!.lineWidth = 1.8
        sx!.beginPath()
        sx!.arc(cx, cy, u * maxR, 0, 6.283)
        sx!.stroke()

        // Secondary ember shockwave ring
        if (u > 0.12) {
          const u2 = (u - 0.12) / 0.88
          sx!.strokeStyle = `rgba(255, 74, 61, ${(1 - u2) * 0.45})`
          sx!.lineWidth = 1.2
          sx!.beginPath()
          sx!.arc(cx, cy, u2 * maxR * 0.85, 0, 6.283)
          sx!.stroke()
        }
      }
    }

    function drawLogos(t: number) {
      // Each logo that has reached the core counts toward its charge.
      let hits = 0
      for (const L of logos) {
        const u = (t - TL.logosIn - L.dl) / TL.logoDur
        if (u >= 0.92) {
          if (L.hitT < 0) L.hitT = TL.logosIn + L.dl + 0.92 * TL.logoDur
          hits++
        }
      }
      charge = logos.length ? hits / logos.length : 0

      if (t > TL.silence) return
      const w = wide()
      const st = state(t)

      logos.forEach((L) => {
        const u = clamp((t - TL.logosIn - L.dl) / TL.logoDur)
        if (u <= 0 || u >= 1) return
        const e = Math.pow(u, 1.85)
        const u_eff = L.u0 * (1 - e)
        const r = u_eff * sc * st.s
        const a = L.arm * 1.5708 + u_eff * 5.2 + L.j + ang
        const lx = cx + Math.cos(a) * r * w
        const ly = cy + Math.sin(a) * r
        const k = (1 - e * 0.92) * 1.15
        const ks = k * L.sz
        const rot = ang + e * 3
        const co = Math.cos(rot)
        const si = Math.sin(rot)
        const logoAlpha = clamp(u / 0.18)

        L.pts.forEach((q, j) => {
          const tearThreshold = 0.15 + q[4] * 0.45
          let x: number, y: number, rad: number, al: number, dis: boolean
          if (u < tearThreshold) {
            x = lx + (q[0] * co - q[1] * si) * ks
            y = ly + (q[0] * si + q[1] * co) * ks
            rad = 0.8 + 1.5 * k
            al = logoAlpha
            dis = false
          } else {
            const peel = clamp((u - tearThreshold) / (1 - tearThreshold))
            const eP = Math.pow(peel, 1.7)
            // Torn particles spiral all the way into the core.
            const u_part = u_eff * (1 - eP)
            const partR = u_part * sc * st.s + q[2] * ks * (1 - peel)
            const partAngle =
              L.arm * 1.5708 +
              u_part * 5.2 +
              L.j +
              ang +
              peel * 2.2 +
              q[3] * 0.3
            const sxX = cx + Math.cos(partAngle) * partR * w
            const sxY = cy + Math.sin(partAngle) * partR
            const inX = lx + (q[0] * co - q[1] * si) * ks
            const inY = ly + (q[0] * si + q[1] * co) * ks
            x = inX * (1 - peel) + sxX * peel
            y = inY * (1 - peel) + sxY * peel
            rad = (0.8 + 1.5 * k) * (1 - peel * 0.45)
            al = logoAlpha * (1 - Math.pow(peel, 3))
            dis = peel > 0.35 && (j * 7 + ((t * 24) | 0)) % 4 < peel * 6
          }
          if (al > 0.02) {
            sx!.globalAlpha = al
            sx!.fillStyle = dis ? GRY : INK
            sx!.beginPath()
            sx!.arc(x, y, dis ? rad * 0.7 : rad, 0, 6.283)
            sx!.fill()
          }
        })
      })
      sx!.globalAlpha = 1
    }

    function drawOrbit(t: number, dt: number) {
      if (t < TL.burst || !orbits.length) return
      const f = eo(clamp((t - TL.burst) / 1.6))
      const w = wide()
      const R = Math.min(W, H) * 0.18
      oA += 0.2 * dt
      oB += 0.14 * dt
      sx!.fillStyle = INK
      sx!.globalAlpha = 0.5 * f

      orbits.forEach((L) => {
        const th = L.ring ? L.th - oB : L.th + oA
        const rr = (L.ring ? 0.72 : 0.5) * sc * f
        const lx = cx + Math.cos(th) * rr * w
        const ly = cy + Math.sin(th) * rr
        const k = L.sz * 0.5
        sx!.beginPath()
        for (const q of L.pts) {
          let x = lx + q[0] * k
          let y = ly + q[1] * k
          const dx = x - M.x
          const dy = y - M.y
          const d = Math.hypot(dx, dy)
          if (d < R) {
            const g = 1 - d / R
            x += (dx / (d + 1)) * g * 26
            y += (dy / (d + 1)) * g * 26
          }
          sx!.moveTo(x + 0.9, y)
          sx!.arc(x, y, 0.9, 0, 6.283)
        }
        sx!.fill()
      })
      sx!.globalAlpha = 1
    }

    function drawPhoto(t: number) {
      px!.clearRect(0, 0, W, H)
      if (!ph || t < TL.burst) return
      const te = t - TL.burst
      const isIntro = te < 1.8

      if (isIntro) {
        // Coalescing intro phase
        for (let i = 0; i < ph.c.length; i++) {
          const c = ph.c[i]
          const k = clamp((te - c.dl) / 0.85)
          if (k <= 0) continue
          const e = eo(k)
          const rt = (1 - e) * 1.8
          const co = Math.cos(rt)
          const si = Math.sin(rt)
          const ux = (c.baseTx - cx) * e
          const uy = (c.baseTy - cy) * e
          const curX = cx + ux * co - uy * si
          const curY = cy + ux * si + uy * co
          px!.globalAlpha = k
          px!.fillStyle = c.co
          px!.beginPath()
          px!.arc(curX, curY, c.r, 0, 6.283)
          px!.fill()
        }
        px!.globalAlpha = 1
      } else {
        // LIVING PORTRAIT (After intro ends)
        // High-resolution pre-rendered crisp bitmap with subtle organic breathing wave
        const breathY = Math.sin(t * 1.4) * 0.35
        if (ph.bmp) {
          px!.drawImage(ph.bmp, 0, breathY, W, H)
        } else {
          for (let i = 0; i < ph.c.length; i++) {
            const c = ph.c[i]
            px!.fillStyle = c.co
            px!.beginPath()
            px!.arc(c.baseTx, c.baseTy + breathY, c.r, 0, 6.283)
            px!.fill()
          }
        }
      }
    }

    /**
     * The particle name: dust converges into the letters (left-to-right
     * sweep), holds, then lifts off and is pulled into the galaxy's core
     * while the real heading text fades in underneath.
     */
    function drawName(t: number) {
      if (!nameDots.length) return
      const opening = t >= TL.nameIn && t <= TL.nameGone && startT === 0
      const returning = t >= TL.returnIn && t <= TL.textDone
      if (!opening && !returning) return

      if (returning) {
        // The name flies back out of the core with a swirl and lands on the
        // letters; once landed it holds still and fades as the real text
        // fades in on exactly the same spot.
        const fade = 1 - clamp((t - TL.textIn) / (TL.textDone - TL.textIn))
        for (let i = 0; i < nameDots.length; i++) {
          const n = nameDots[i]
          const k = clamp((t - TL.returnIn - n.dl * 0.4) / TL.returnDur)
          if (k <= 0) continue
          const e = eo(k)
          const dx = n.tx - cx
          const dy = n.ty - cy
          const rot = (1 - e) * (1.6 + n.sw * 0.3)
          const x = cx + (dx * Math.cos(rot) - dy * Math.sin(rot)) * e
          const y = cy + (dx * Math.sin(rot) + dy * Math.cos(rot)) * e
          const a = (0.3 + 0.7 * e) * fade
          if (a <= 0.02) continue
          px!.globalAlpha = a
          px!.fillStyle = n.acc ? "#ff4a3d" : INK
          px!.fillRect(x - n.r, y - n.r, n.r * 2, n.r * 2)
        }
        px!.globalAlpha = 1
        return
      }

      for (let i = 0; i < nameDots.length; i++) {
        const n = nameDots[i]
        let x: number
        let y: number
        let a: number
        if (t < TL.nameOut + n.dl * 0.6) {
          // Converge from dust onto the letter.
          const k = clamp((t - TL.nameIn - n.dl) / 0.55)
          if (k <= 0) continue
          const e = eo(k)
          // A slight curve so the dust sweeps in rather than sliding straight.
          const bend = (1 - e) * n.sw * 40
          x = n.sx + (n.tx - n.sx) * e + bend
          y = n.sy + (n.ty - n.sy) * e - bend * 0.4
          a = 0.25 + 0.75 * e
        } else {
          // Lift off into the core with a swirl.
          const k = clamp((t - TL.nameOut - n.dl * 0.6) / 0.9)
          const e = ei(k)
          const dx = n.tx - cx
          const dy = n.ty - cy
          const rot = e * (1.4 + n.sw * 0.3)
          const s = 1 - e
          x = cx + (dx * Math.cos(rot) - dy * Math.sin(rot)) * s
          y = cy + (dx * Math.sin(rot) + dy * Math.cos(rot)) * s
          a = 1 - k * k
        }
        if (a <= 0.02) continue
        px!.globalAlpha = a
        px!.fillStyle = n.acc ? "#ff4a3d" : INK
        px!.fillRect(x - n.r, y - n.r, n.r * 2, n.r * 2)
      }
      px!.globalAlpha = 1
    }

    /** A brief, low flash at the burst (kept faint; one pulse only). */
    function drawFlash(t: number) {
      if (t < TL.burst || t > TL.burst + 0.35) return
      const k = (t - TL.burst) / 0.35
      px!.fillStyle = `rgba(${INKRGB},${0.16 * (1 - k) * (1 - k)})`
      px!.fillRect(0, 0, W, H)
    }

    /**
     * Heading opacity, driven by the timeline: hidden until the particle
     * name has landed at the end, then crossfaded in on the same spot.
     * (The rest of the page chrome is held back by the html intro state.)
     */
    function drawCopy(t: number) {
      if (!playingNow && t >= TL.end) {
        setOp(h1El, 1)
        return
      }
      setOp(h1El, clamp((t - TL.textIn) / (TL.textDone - TL.textIn)))
    }

    /** Hold the portfolio back while the intro plays; reveal it after. */
    function setIntroScreen(on: boolean) {
      const root = document.documentElement
      if (on) {
        root.dataset.introState = "playing"
        window.scrollTo(0, 0)
        lenisRef.current?.stop()
      } else {
        delete root.dataset.introState
        lenisRef.current?.start()
      }
    }

    let last = performance.now()
    let animId = 0
    function frame(now: number) {
      animId = requestAnimationFrame(frame)
      if (!vis) {
        last = now
        return
      }
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const t = frozenT ?? (now - T0) / 1000
      drawPhoto(t)
      drawName(t)
      drawFlash(t)
      drawSpiral(t, dt)
      drawLogos(t)
      drawOrbit(t, dt)
      drawCopy(t)

      const X = shadowCanvasRef.current
      if (X) {
        if (t < TL.burst) {
          X.style.opacity = "0"
        } else if (t < TL.burst + 1.6) {
          const u = clamp((t - TL.burst) / 1.6)
          X.style.opacity = String(u * 0.5)
        } else {
          X.style.opacity = "0.5"
        }
      }

      if (playingNow) {
        const p = clamp((t - startT) / (TL.end - startT))
        if (progressRef.current) {
          progressRef.current.style.transform = `scaleX(${p})`
        }
        if (t >= TL.end) {
          playingNow = false
          setIntroScreen(false)
          try {
            localStorage.setItem(INTRO_SEEN_KEY, "1")
          } catch {
            /* storage blocked: the full intro simply plays again next time */
          }
        }
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect()
      M.x = e.clientX - r.left
      M.y = e.clientY - r.top
    }
    const onPointerLeave = () => {
      M.x = M.y = -1e4
    }

    hero.addEventListener("pointermove", onPointerMove)
    hero.addEventListener("pointerleave", onPointerLeave)

    const observer = new IntersectionObserver((entries) => {
      vis = entries[0].isIntersecting
    })
    observer.observe(hero)

    let rt: NodeJS.Timeout | number
    let lw = 0
    let lh = 0
    const onResize = () => {
      clearTimeout(rt)
      rt = setTimeout(() => {
        if (!hero) return
        const cw = hero.clientWidth
        const ch = hero.clientHeight
        const crossedBreakpoint = (cw < 768) !== (lw < 768)
        if (
          crossedBreakpoint ||
          Math.abs(cw - lw) > 15 ||
          Math.abs(ch - lh) > 15 ||
          !lw
        ) {
          lw = cw
          lh = ch
          layout()
        }
      }, 80)
    }
    window.addEventListener("resize", onResize)

    // ResizeObserver tracks hero dimension changes accurately
    const ro = new ResizeObserver(() => {
      onResize()
    })
    ro.observe(hero)

    const onImgLoad = () => {
      if (!hero) return
      const preferred = getPreferredImg(W || hero.clientWidth)
      if (preferred && preferred !== img) {
        img = preferred
        layout()
      } else if (preferred && !ph) {
        img = preferred
        buildPhoto()
      }
    }
    desktopImg.onload = onImgLoad
    mobileImg.onload = onImgLoad
    desktopImg.src = DESKTOP_PHOTO_SRC
    mobileImg.src = MOBILE_PHOTO_SRC

    /** Play the timeline from `from` seconds (0 = full cut). */
    const startPlayback = (from: number) => {
      T0 = performance.now() - from * 1000
      startT = from
      ang = 0
      oA = 0
      oB = 0
      charge = 0
      logos.forEach((L) => (L.hitT = -1))
      opCache.clear()
      playingNow = true
      setIntroScreen(true)
      if (progressRef.current) progressRef.current.style.transform = "scaleX(0)"
      const X = shadowCanvasRef.current
      if (X) X.style.opacity = "0"
    }
    replayTriggerRef.current = () => startPlayback(0)

    // Dev-only: freeze the timeline at a second to inspect a frame,
    // e.g. __intro.freeze(1.1); __intro.freeze(null) resumes.
    if (process.env.NODE_ENV !== "production") {
      ;(window as unknown as { __intro: object }).__intro = {
        freeze: (s: number | null) => {
          frozenT = s
          startT = 0 // inspect the first-visit cut
          opCache.clear()
          if (s === null) startPlayback(0)
        },
      }
    }
    skipTriggerRef.current = () => {
      // Jump to the settled end; the frame loop then finishes playback.
      T0 = performance.now() - TL.end * 1000
    }

    const reduceMotionNow = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
    let seen = false
    try {
      seen = !!localStorage.getItem(INTRO_SEEN_KEY)
    } catch {
      /* storage blocked: treat as a first visit */
    }

    if (reduceMotionNow || !HERO_INTRO) {
      // Settled state straight away, no playback.
      T0 -= 20000
      const X = shadowCanvasRef.current
      if (X) X.style.opacity = "0.5"
    } else {
      // Return visitors get the short cut: collapse, silence, burst.
      startPlayback(seen ? TL.shortStart : 0)
    }

    // From here on the timeline owns the heading's visibility. Apply the
    // first frame's opacities before releasing the CSS pre-hide, so the
    // heading never flashes in and out (see globals.css, "intro pre-hide").
    drawCopy((performance.now() - T0) / 1000)
    hero.dataset.intro = "on"
    // Tell the pre-paint failsafe in layout.tsx that the intro is live.
    document.documentElement.classList.add("intro-live")
    if (reduceMotionNow) setIntroScreen(false)

    lw = hero.clientWidth
    lh = hero.clientHeight
    layout()
    animId = requestAnimationFrame(frame)

    if (document.fonts) {
      document.fonts.ready.then(() => {
        buildLogos()
        buildName() // re-measure with the real display font
      })
    }

    return () => {
      cancelAnimationFrame(animId)
      observer.disconnect()
      ro.disconnect()
      window.removeEventListener("resize", onResize)
      hero.removeEventListener("pointermove", onPointerMove)
      hero.removeEventListener("pointerleave", onPointerLeave)
      desktopImg.onload = null
      mobileImg.onload = null
      // Never leave the page locked behind the intro screen.
      if (HERO_INTRO) delete document.documentElement.dataset.introState
    }
  }, [])

  const handleIntroButton = () => {
    if (!HERO_INTRO) {
      window.dispatchEvent(new Event(INTRO_REPLAY_EVENT))
      return
    }
    if (document.documentElement.dataset.introState === "playing")
      skipTriggerRef.current?.()
    else replayTriggerRef.current?.()
  }

  return (
    <header id="hero" data-l="~/intro" ref={heroRef}>
      <div className="grid" />
      <canvas id="spiral" ref={spiralCanvasRef} aria-hidden="true" />
      <canvas id="photo-shadow" ref={shadowCanvasRef} aria-hidden="true" />
      <div className="veil" />
      <canvas id="photo" ref={photoCanvasRef} aria-hidden="true" />

      {/* Floating Motion ambient particle effect (skipped for reduced motion) */}
      <div className="hero-particles" aria-hidden="true">
        {!reduceMotion && AMBIENT_PARTICLES.map((p) => (
          <motion.span
            key={p.id}
            className={`hero-particle ${p.isAccent ? "accent" : ""}`}
            style={{
              width: p.size,
              height: p.size,
              left: p.left,
              top: p.top,
            }}
            animate={{
              y: [0, -45, -90, -140],
              x: [0, p.driftX * 0.5, p.driftX, p.driftX * 1.2],
              opacity: [0, p.isAccent ? 0.85 : 0.6, p.isAccent ? 0.95 : 0.7, 0],
              scale: [0.8, 1.2, 1, 0.6],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="hud st">
        <span className="beacon-dot" aria-hidden="true" />
        <span>
          Available remote · Ismailia, EG · <CairoClock />
        </span>
      </div>

      <span className="cx" style={{ left: 16, top: 72 }} aria-hidden="true">
        +
      </span>
      <span className="cx" style={{ right: 16, top: 72 }} aria-hidden="true">
        +
      </span>

      <div className="cap">
        <div>
          <h1>Ziad M. Sheashaa</h1>
        </div>
        <motion.button
          className="btn"
          id="replay"
          type="button"
          onClick={handleIntroButton}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          <span className="lbl-skip">Skip intro</span>
          <span className="lbl-replay">Replay intro</span>
          <span className="intro-progress" ref={progressRef} aria-hidden="true" />
        </motion.button>
      </div>

      <div className="mq mqh" aria-hidden="true">
        <div>
          {SKILLS.concat(SKILLS).map((skill, idx) => (
            <span key={idx}>{skill}</span>
          ))}
        </div>
      </div>
    </header>
  )
}
