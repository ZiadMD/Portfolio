"use client"

/*
 * Hero: the ASCII portrait the intro ends on, kept alive.
 *
 * The portrait is drawn by the intro's own engine (intro/introEngine.js),
 * framed by intro/framing.ts, so the intro's last frame and the hero's first
 * frame are the same picture: the hero clock starts at the intro's end
 * (TOTAL) and runs on from there (thin red rain, breathing tint, the odd
 * glitch). Hovering scrambles the glyphs under the cursor.
 *
 * It renders at FPS frames a second while the hero or the About section is
 * on screen (so it is already running when you scroll back up) and the
 * intro is not covering it. Reduced motion: one still frame.
 */

import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import { SKILLS } from "../../data/portfolioData"
import { INTRO_REPLAY_EVENT } from "../intro/IntroGate"
import { DESKTOP, MOBILE, framingFor } from "../intro/framing"
import { createIntro, TOTAL, type IntroEngine } from "../intro/introEngine.js"

/** Portrait frame rate: the glyphs only need a slow, film-like tick. */
const FPS = 15

// Live Cairo clock. Its own component so the per-second tick re-renders
// only this text, not the whole hero.
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
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const hero = heroRef.current
    const canvas = canvasRef.current
    if (!hero || !canvas) return
    const root = document.documentElement
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let engine: IntroEngine | null = null
    let built = "" // photo + size the engine was built for
    let t = TOTAL // hero clock, in intro seconds
    let last = 0
    let raf = 0
    let vis = true
    let dead = false
    const imgs = new Map<string, HTMLImageElement>()

    const load = (src: string) => {
      let img = imgs.get(src)
      if (!img) {
        img = new Image()
        img.onload = () => build()
        img.src = src
        imgs.set(src, img)
      }
      return img
    }

    /** (Re)build the engine for the hero's size and the right photo. */
    const build = () => {
      if (dead) return
      const W = hero.clientWidth
      const H = hero.clientHeight
      if (!W || !H) return
      const mobile = W < 768
      const photo = mobile ? MOBILE : DESKTOP
      const img = load(photo.src)
      if (!img.complete || !img.naturalWidth) return // onload builds
      const key = `${photo.src}|${W}x${H}`
      if (key === built) return
      try {
        engine = createIntro(canvas, img, {
          eye: photo.eye,
          ...framingFor(photo, mobile, W, H),
        })
        built = key
        engine.renderAt(t)
      } catch (e) {
        engine = null
        console.warn("[Hero] ASCII portrait unavailable:", e)
      }
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (root.dataset.introState === "playing") {
        // Under the intro: idle, and resume exactly where it ends.
        t = TOTAL
        last = now
        return
      }
      if (!engine || !vis || document.hidden) {
        last = now
        return
      }
      if (now - last < 1000 / FPS) return
      t += Math.min(0.1, (now - last) / 1000)
      last = now
      engine.renderAt(t)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return
      const r = canvas.getBoundingClientRect()
      engine?.setPointer(e.clientX - r.left, e.clientY - r.top)
    }
    const onLeave = () => engine?.setPointer(null)

    let rt = 0
    const ro = new ResizeObserver(() => {
      window.clearTimeout(rt)
      rt = window.setTimeout(build, 120)
    })
    // Keep rendering while the hero or the About section below it is on
    // screen, so it is already running when you scroll back up to it.
    const near = new Set<Element>()
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) near.add(e.target)
        else near.delete(e.target)
      }
      vis = near.size > 0
    })
    const about = document.getElementById("about")

    build()
    ro.observe(hero)
    if (!reduce) {
      io.observe(hero)
      if (about) io.observe(about)
      hero.addEventListener("pointermove", onMove)
      hero.addEventListener("pointerleave", onLeave)
      raf = requestAnimationFrame(frame)
    }

    return () => {
      dead = true
      cancelAnimationFrame(raf)
      window.clearTimeout(rt)
      ro.disconnect()
      io.disconnect()
      hero.removeEventListener("pointermove", onMove)
      hero.removeEventListener("pointerleave", onLeave)
      imgs.forEach((img) => (img.onload = null))
    }
  }, [])

  return (
    <header id="hero" data-l="~/intro" ref={heroRef}>
      <canvas id="ascii" ref={canvasRef} aria-hidden="true" />

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
          onClick={() => window.dispatchEvent(new Event(INTRO_REPLAY_EVENT))}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          <span className="lbl-replay">Replay intro</span>
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
