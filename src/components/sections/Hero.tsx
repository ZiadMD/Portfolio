"use client"

// Live Cairo clock

// Canvas particle simulations
/* <div className="hud st">
        <i />
        Available remote · Ismailia, EG · <span id="clk">{cairoTime}</span>
      </div>

      <span className="cx" style={{ left: 12, top: 60 }}>
        +
      </span>
      <span className="cx" style={{ right: 12, top: 60 }}>
        +
      </span> */

import { useEffect, useRef, useState } from "react"
import { ICONS, PULL, ORB } from "../../data/heroIcons"
import { DESKTOP_PHOTO_SRC, MOBILE_PHOTO_SRC } from "../../data/photoSrc"
import { SKILLS } from "../../data/portfolioData"

interface PhotoCell {
  tx: number
  ty: number
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
}

interface OrbitItem {
  pts: [number, number, number, number, number][]
  ring: number
  th: number
  sz: number
}

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null)
  const photoCanvasRef = useRef<HTMLCanvasElement>(null)
  const spiralCanvasRef = useRef<HTMLCanvasElement>(null)
  const [cairoTime, setCairoTime] = useState<string>("--:--:--")
  useEffect(() => {
    const updateTime = () => {
      setCairoTime(
        new Date().toLocaleTimeString("en-GB", { timeZone: "Africa/Cairo" }),
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])
  useEffect(() => {
    const hero = heroRef.current
    const P = photoCanvasRef.current
    const S = spiralCanvasRef.current
    if (!hero || !P || !S) return

    const px = P.getContext("2d")
    const sx = S.getContext("2d")
    if (!px || !sx) return

    let INK = "#fff"
    let INKRGB = "255,255,255"
    let GRY = "#a9a9ad"

    const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
    const ei = (k: number) => k * k * k
    const eo = (k: number) => 1 - Math.pow(1 - k, 4)

    const updateColors = () => {
      const isLight = document.documentElement.dataset.theme === "light"
      INK = isLight ? "#17171a" : "#fff"
      INKRGB = isLight ? "23,23,26" : "255,255,255"
      GRY = isLight ? "#6d6e72" : "#a9a9ad"
    }
    updateColors()

    const onThemeChange = () => {
      updateColors()
    }
    window.addEventListener("zs-theme-change", onThemeChange)

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

    const wide = () => (W > H ? 1.45 : 1)

    function sample(k: string): [number, number, number, number, number][] {
      if (!ICONS[k]) return []
      const c = document.createElement("canvas")
      const g = c.getContext("2d")
      if (!g) return []
      c.width = c.height = 72
      g.fillStyle = "#fff"
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
      const N = W < 768 ? 2200 : 4000
      for (let i = 0; i < N; i++) {
        const u = 0.02 + 0.98 * rnd()
        sp.push({
          arm: i % 4,
          u,
          j: (rnd() - 0.5) * 0.45 * (0.25 + u),
          sz: rnd() < 0.15 ? 1.6 : rnd() < 0.4 ? 1.1 : 0.75,
          br: 0.35 + 0.65 * rnd(),
        })
      }
    }

    function buildLogos() {
      logos = PULL.map((k, i) => ({
        pts: sample(k),
        arm: i % 4,
        u0: 0.78 + (i % 3) * 0.06,
        j: (((i * 1.618) % 1) - 0.5) * 0.25,
        dl: i * 0.21,
        sz: 1.6,
      }))

      orbits = ORB.map((k, i) => ({
        pts: sample(k),
        ring: i % 2,
        th: (i >> 1) * (6.2832 / (ORB.length / 2)) + (i % 2) * 0.5,
        sz: 1.7,
      }))
    }

    function buildPhoto() {
      if (!img || !img.naturalWidth || !img.naturalHeight) return
      const isMobile = W < 768
      const rowsN = isMobile ? 72 : 100
      const ia = img.naturalWidth / img.naturalHeight
      const hh = Math.min(H * 0.86, (W * 0.95) / ia)
      const cell = hh / rowsN
      const cols = Math.round((hh * ia) / cell)
      const rows = rowsN

      const c = document.createElement("canvas")
      c.width = cols
      c.height = rows
      const g = c.getContext("2d")
      if (!g) return
      g.drawImage(img, 0, 0, cols, rows)

      const d = g.getImageData(0, 0, cols, rows).data
      const ox = cx - (cols * cell) / 2
      const oy = H - rows * cell
      const cells: {
        tx: number
        ty: number
        r: number
        co: string
        dl: number
      }[] = []

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4
          if (d[i + 3] < 90) continue
          if (rnd() > clamp((rows - 1 - y) / (rows * 0.14))) continue

          const tx = ox + x * cell + cell / 2
          const ty = oy + y * cell + cell / 2
          const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255
          cells.push({
            tx,
            ty,
            r: cell * (0.34 + 0.14 * lum),
            co: `rgb(${d[i]},${d[i + 1]},${d[i + 2]})`,
            dl: (Math.hypot(tx - cx, ty - cy) / (W * 0.6)) * 0.7 + rnd() * 0.2,
          })
        }
      }
      ph = { c: cells, bmp: null }
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

      const isMobile = W < 768
      const targetImg = getPreferredImg(W)
      if (targetImg) {
        img = targetImg
      }

      cx = W / 2
      const ia =
        img && img.naturalWidth && img.naturalHeight
          ? img.naturalWidth / img.naturalHeight
          : isMobile
            ? 0.805
            : 1.79
      const hh = Math.min(H * 0.86, (W * 0.95) / ia)
      cy = H - hh * 0.5
      sc = Math.min(W, H) * 0.58

      buildSpiral()
      buildLogos()
      if (img) buildPhoto()
    }

    function state(t: number) {
      if (t < 0.8) return { s: 1, al: (t / 0.8) * 0.8, sp: 0.35 }
      if (t < 5.2) {
        const u = (t - 0.8) / 4.4
        return { s: 1 - 0.97 * ei(u), al: 0.35, sp: 0.35 + 4 * ei(u) }
      }
      if (t < 6.2) return { s: 0.03, al: 1, sp: 5 }
      if (t < 7.6) {
        const u = eo(clamp((t - 6.2) / 1.4))
        return { s: 0.03 + 0.97 * u, al: 1 - 0.78 * u, sp: 5 - 4.88 * u }
      }
      return { s: 1, al: 0.22, sp: 0.12 }
    }

    function drawSpiral(t: number, dt: number) {
      const st = state(t)
      ang += st.sp * dt
      sx!.clearRect(0, 0, W, H)
      sx!.fillStyle = INK

      const R = Math.min(W, H) * 0.2
      const w = wide()
      for (let i = 0; i < sp.length; i++) {
        const p = sp[i]
        const a = p.arm * 1.5708 + p.u * 5.2 + p.j + ang
        const r = p.u * sc * st.s
        let x = cx + Math.cos(a) * r * w
        let y = cy + Math.sin(a) * r
        const al =
          Math.min(1, st.al * 1.5) * (0.25 + 0.75 * (1 - p.u * 0.6)) * p.br
        const s = p.sz * (0.55 + (1 - p.u) * 0.9)
        const dx = x - M.x
        const dy = y - M.y
        const d = Math.hypot(dx, dy)

        if (d < R && st.s > 0.5) {
          const f = 1 - d / R
          x += (dx / (d + 1)) * f * 30
          y += (dy / (d + 1)) * f * 30
        }

        sx!.globalAlpha = al
        sx!.beginPath()
        sx!.arc(x, y, s, 0, 6.283)
        sx!.fill()
      }
      sx!.globalAlpha = 1

      if (t > 6.2 && t < 7.6) {
        const u = (t - 6.2) / 1.4
        sx!.strokeStyle = `rgba(${INKRGB},${(1 - u) * 0.7})`
        sx!.lineWidth = 1.5
        sx!.beginPath()
        sx!.arc(cx, cy, u * Math.max(W, H) * 0.7, 0, 7)
        sx!.stroke()
      }
    }

    function drawLogos(t: number) {
      if (t > 5.0) return
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
      if (t < 6.2 || !orbits.length) return
      const f = eo(clamp((t - 6.2) / 1.6))
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
      if (!ph || t < 6.2) return
      const te = t - 6.2
      if (ph.bmp) {
        px!.drawImage(ph.bmp, 0, 0, W, H)
        return
      }
      for (const c of ph.c) {
        const k = clamp((te - c.dl) / 0.9)
        if (k <= 0) continue
        const e = eo(k)
        const rt = (1 - e) * 1.8
        const co = Math.cos(rt)
        const si = Math.sin(rt)
        const ux = (c.tx - cx) * e
        const uy = (c.ty - cy) * e
        px!.globalAlpha = k
        px!.fillStyle = c.co
        px!.beginPath()
        px!.arc(cx + ux * co - uy * si, cy + ux * si + uy * co, c.r, 0, 6.283)
        px!.fill()
      }
      px!.globalAlpha = 1

      if (te > 2.4) {
        const b = document.createElement("canvas")
        b.width = W * D
        b.height = H * D
        const g = b.getContext("2d")
        if (g) {
          g.scale(D, D)
          for (const c of ph.c) {
            g.fillStyle = c.co
            g.beginPath()
            g.arc(c.tx, c.ty, c.r, 0, 6.283)
            g.fill()
          }
          ph.bmp = b
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
    const onResize = () => {
      clearTimeout(rt)
      rt = setTimeout(() => {
        const cw = hero.clientWidth
        const crossedBreakpoint = cw < 768 !== lw < 768
        if (crossedBreakpoint || Math.abs(cw - lw) > 20 || !lw) {
          lw = cw
          layout()
        }
      }, 100)
    }
    window.addEventListener("resize", onResize)

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

    const replayBtn = hero.querySelector<HTMLButtonElement>("#replay")
    const onReplay = () => {
      T0 = performance.now()
      ang = 0
      if (ph) ph.bmp = null
    }
    if (replayBtn) replayBtn.addEventListener("click", onReplay)

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      T0 -= 20000
    }

    lw = hero.clientWidth
    layout()
    animId = requestAnimationFrame(frame)

    if (document.fonts) {
      document.fonts.ready.then(buildLogos)
    }

    return () => {
      cancelAnimationFrame(animId)
      observer.disconnect()
      window.removeEventListener("resize", onResize)
      window.removeEventListener("zs-theme-change", onThemeChange)
      hero.removeEventListener("pointermove", onPointerMove)
      hero.removeEventListener("pointerleave", onPointerLeave)
      desktopImg.onload = null
      mobileImg.onload = null
      if (replayBtn) replayBtn.removeEventListener("click", onReplay)
    }
  }, [])

  return (
    <header id="hero" data-l="~/intro" ref={heroRef}>
      <div className="grid" />
      <canvas id="spiral" ref={spiralCanvasRef} aria-hidden="true" />
      <div className="veil" />
      <canvas id="photo" ref={photoCanvasRef} aria-hidden="true" />

      {}

      <div className="cap">
        <div>
          <p className="eye">Software &amp; AI Engineer</p>
          <h1>
            Ziad M. <em>Sheashaa</em>
          </h1>
        </div>
        <button className="btn" id="replay" type="button">
          replay intro ↻
        </button>
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
