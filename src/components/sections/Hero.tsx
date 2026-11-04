"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { ICONS, PULL, ORB } from "../../data/heroIcons"
import { DESKTOP_PHOTO_SRC, MOBILE_PHOTO_SRC } from "../../data/photoSrc"
import { SKILLS } from "../../data/portfolioData"

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
        dl: i * 0.21,
        sz: isMobile ? 1.45 : 1.6,
      }))

      orbits = ORB.map((k, i) => ({
        pts: sample(k),
        ring: i % 2,
        th: (i >> 1) * (6.2832 / (ORB.length / 2)) + (i % 2) * 0.5,
        sz: isMobile ? 1.5 : 1.7,
      }))
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
      if (img) buildPhoto()
    }

    function state(t: number) {
      if (t < 0.8) return { s: 1, al: (t / 0.8) * 0.8, sp: 0.35 }
      if (t < 4.8) {
        const u = (t - 0.8) / 4.0
        return { s: 1 - 0.97 * ei(u), al: 0.35 + 0.25 * u, sp: 0.35 + 4.2 * ei(u) }
      }
      if (t < 5.8) return { s: 0.03, al: 1, sp: 5.2 }
      if (t < 7.4) {
        const u = eo(clamp((t - 5.8) / 1.6))
        return { s: 0.03 + 0.97 * u, al: 1 - 0.76 * u, sp: 5.2 - 5.12 * u }
      }
      return { s: 1, al: 0.24, sp: 0.08 }
    }

    function drawSpiral(t: number, dt: number) {
      const st = state(t)
      ang += st.sp * dt
      sx!.clearRect(0, 0, W, H)

      const R = Math.min(W, H) * 0.22
      const w = wide()
      const isPostIntro = t >= 7.2
      const hasMouse = M.x > -1e3 && M.y > -1e3

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
        const tw = 0.75 + 0.25 * Math.sin(t * p.twinkleSpeed + p.twinklePhase)
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

      // Dual Shockwave Rings during transition (t: 5.8s -> 7.4s)
      if (t > 5.8 && t < 7.4) {
        const u = (t - 5.8) / 1.6
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
      if (t > 5.2) return
      const w = wide()
      const st = state(t)

      logos.forEach((L) => {
        const u = clamp((t - 0.35 - L.dl) / 1.15)
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
            const u_part = u_eff * (1 - eP * 0.95)
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
      if (t < 5.8 || !orbits.length) return
      const f = eo(clamp((t - 5.8) / 1.6))
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
      if (!ph || t < 5.8) return
      const te = t - 5.8
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
      const t = (now - T0) / 1000
      drawPhoto(t)
      drawSpiral(t, dt)
      drawLogos(t)
      drawOrbit(t, dt)

      const X = shadowCanvasRef.current
      if (X) {
        if (t < 5.8) {
          X.style.opacity = "0"
        } else if (t < 7.4) {
          const u = clamp((t - 5.8) / 1.6)
          X.style.opacity = String(u * 0.5)
        } else {
          X.style.opacity = "0.5"
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

    const resetIntro = () => {
      T0 = performance.now()
      ang = 0
      oA = 0
      oB = 0
      const X = shadowCanvasRef.current
      if (X) X.style.opacity = "0"
    }
    replayTriggerRef.current = resetIntro

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      T0 -= 20000
      const X = shadowCanvasRef.current
      if (X) X.style.opacity = "0.5"
    }

    lw = hero.clientWidth
    lh = hero.clientHeight
    layout()
    animId = requestAnimationFrame(frame)

    if (document.fonts) {
      document.fonts.ready.then(buildLogos)
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
    }
  }, [])

  const handleReplay = () => {
    if (replayTriggerRef.current) {
      replayTriggerRef.current()
    }
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
          <p className="sub">
            Software &amp; AI Engineer building deep learning models and
            production AI systems.
          </p>
        </div>
        <motion.button
          className="btn"
          id="replay"
          type="button"
          onClick={handleReplay}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          Replay intro
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
