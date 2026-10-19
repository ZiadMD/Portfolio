"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import gsap from "gsap"
import { lenisRef } from "../../lib/lenis-ref"
import HeadingFlow from "./heading-flow"
import {
  clamp01,
  easeOutExpo,
  railOccupancy,
  rulerMap,
  rulerZoom,
  type MeasuredSection,
  type RulerSide,
} from "./ruler-shared"
import {
  rulerLayoutTuner,
  rulerLookTuner,
  rulerMotionTuner,
} from "./ruler-tunables"

export const HERO_SECTION_ID = "hero"

export const RULER_SECTIONS = [
  { id: HERO_SECTION_ID, label: "ZIAD" },
  { id: "about", label: "ABOUT" },
  { id: "experience", label: "EXPERIENCE" },
  { id: "work", label: "WORK" },
  { id: "contact", label: "CONTACT" },
]

export interface TickItem {
  pct: number
  docY: number
  major: boolean
  alpha: number
}

export default function ScrollRuler() {
  const [geom, setGeom] = useState({ docH: 0, vh: 0, vw: 0 })
  const [sections, setSections] = useState<MeasuredSection[]>([])

  const railRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const needleRef = useRef<HTMLDivElement>(null)
  const readoutRef = useRef<HTMLSpanElement>(null)
  const ghostLineRef = useRef<HTMLDivElement>(null)
  const bracketRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([])
  const tickRowRefs = useRef<(HTMLDivElement | null)[]>([])
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([])
  const digitRefs = useRef<(HTMLSpanElement | null)[]>([])

  const fs = useRef({
    vel: 0,
    lastY: 0,
    introDone: false,
    prevDigits: [-1, -1, -1],
    prevPct: -1,
    readoutAbove: false,
    geom: { docH: 0, vh: 0, vw: 0 },
    zoomIntent: false,
    zoomTimer: 0,
    zoomWrote: false,
    ghostActive: false,
    ghostY: 0,
    dragStartY: 0,
    dragMoved: 0,
  })
  fs.current.geom = geom

  const layout = rulerLayoutTuner.read()
  const look = rulerLookTuner.read()
  const side: RulerSide = layout.side >= 0.5 ? "right" : "left"

  useEffect(() => {
    const st = fs.current
    return () => {
      window.clearTimeout(st.zoomTimer)
      rulerZoom.target = 0
      rulerZoom.p = 0
      rulerZoom.dragging = false
    }
  }, [])

  useEffect(() => {
    const measure = () => {
      const next = {
        docH: Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight,
        ),
        vh: window.innerHeight,
        vw: window.innerWidth,
      }
      setGeom((prev) =>
        prev.docH === next.docH && prev.vh === next.vh && prev.vw === next.vw
          ? prev
          : next,
      )
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(document.body)
    window.addEventListener("resize", measure)
    document.fonts?.ready.then(measure).catch(() => {})
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [])

  useEffect(() => {
    if (!geom.docH) return
    const out: MeasuredSection[] = []
    for (const s of RULER_SECTIONS) {
      const el = document.getElementById(s.id)
      if (!el) continue
      const rect = el.getBoundingClientRect()
      const isHero = s.id === HERO_SECTION_ID
      const anchor = rect.top + window.scrollY
      out.push({
        id: s.id,
        label: s.label,
        index: out.length,
        anchor,
        bottom: rect.bottom + window.scrollY,
        isHero,
      })
    }
    setSections(out)
  }, [geom])

  const ticks = useMemo(() => {
    const docH = geom.docH || 4000
    const out: TickItem[] = []
    for (let p = 0; p <= 100 + 1e-6; p += layout.minorPct) {
      const pct = Math.round(p * 100) / 100
      const major = Math.abs(pct % layout.labelPct) < 1e-6
      out.push({
        pct,
        docY: (pct / 100) * docH,
        major,
        alpha: major ? look.majorAlpha : look.minorAlpha,
      })
    }
    lineRefs.current.length = out.length
    tickRowRefs.current.length = out.length
    labelRefs.current.length = out.length
    return out
  }, [geom.docH, layout, look])

  useEffect(() => {
    const els = lineRefs.current.filter((el): el is HTMLSpanElement => !!el)
    if (!els.length) return

    gsap.set(els, { scaleX: 0, opacity: 0 })
    const mt = rulerMotionTuner.read()
    const tl = gsap.timeline()
    tl.to(els, {
      scaleX: 1,
      opacity: (i: number) => ticks[i]?.alpha ?? 0.3,
      duration: mt.introDur,
      stagger: mt.introStagger,
      ease: "power3.out",
      overwrite: true,
      onComplete: () => {
        fs.current.introDone = true
      },
    })

    return () => {
      tl.kill()
      fs.current.introDone = true
    }
  }, [ticks])

  useEffect(() => {
    const tick = (_time: number, deltaMs: number) => {
      const st = fs.current
      const docH = st.geom.docH || document.documentElement.scrollHeight || 4000
      const vh = window.innerHeight || st.geom.vh || 900
      const dt = Math.min(deltaMs / 1000, 0.1) || 0.016
      const scrollY = window.scrollY
      const maxScroll = Math.max(1, docH - vh)
      const progress = clamp01(scrollY / maxScroll)

      const raw = (scrollY - st.lastY) / dt
      st.lastY = scrollY
      st.vel += (raw - st.vel) * (1 - Math.exp(-6 * dt))

      const map = rulerMap(vh, rulerLayoutTuner.read().edgePad)
      const drift = map.drift(progress)
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(0, ${-scrollY + drift}px, 0)`
      }

      const lk = rulerLookTuner.read()
      const ny = map.base + progress * map.span
      if (needleRef.current) {
        needleRef.current.style.transform = `translate3d(0, ${ny}px, 0)`
        needleRef.current.style.opacity = String(
          clamp01(progress / Math.max(0.001, lk.needleFadePct / 100)),
        )
      }
      const above = ny > vh - 26
      if (readoutRef.current && above !== st.readoutAbove) {
        st.readoutAbove = above
        readoutRef.current.style.top = above ? "-14px" : "4px"
      }

      const pct = Math.round(progress * 100)
      if (pct !== st.prevPct) {
        st.prevPct = pct
        railRef.current?.setAttribute("aria-valuenow", String(pct))
        const str = String(pct).padStart(3, "0")
        for (let c = 0; c < 3; c++) {
          const d = str.charCodeAt(c) - 48
          if (d !== st.prevDigits[c]) {
            st.prevDigits[c] = d
            const col = digitRefs.current[c]
            if (col) col.style.transform = `translateY(${-d}em)`
          }
        }
      }

      const mt = rulerMotionTuner.read()
      rulerZoom.target = st.zoomIntent || rulerZoom.dragging ? 1 : 0
      rulerZoom.p +=
        (rulerZoom.target - rulerZoom.p) * (1 - Math.exp(-mt.zoomLerp * dt))
      if (rulerZoom.target === 0 && rulerZoom.p < 0.0005) rulerZoom.p = 0
      if (rulerZoom.target === 1 && rulerZoom.p > 0.9995) rulerZoom.p = 1
      const z = rulerZoom.p

      if (bracketRef.current) {
        const b = bracketRef.current
        b.style.transform = `translate3d(0, ${
          map.base + (scrollY / docH) * map.span
        }px, 0)`
        b.style.height = `${(vh / docH) * map.span}px`
        b.style.opacity = String(z)
      }

      if (ghostLineRef.current) {
        const g = ghostLineRef.current
        if (st.ghostActive) {
          g.style.transform = `translate3d(0, ${st.ghostY}px, 0)`
          g.style.opacity = String(lk.ghostAlpha * (0.2 + 0.8 * z))
        } else {
          g.style.opacity = "0"
        }
      }

      if (st.introDone && ticks.length) {
        const needleDocY = progress * docH
        const velNorm = clamp01(Math.abs(st.vel) / 3000)
        const writeZoom = z > 0 || st.zoomWrote
        const spans = railOccupancy.spans
        for (let i = 0; i < ticks.length; i++) {
          const liveY = ticks[i].docY - scrollY + drift
          const compactY = map.base + (ticks[i].pct / 100) * map.span
          if (writeZoom) {
            const row = tickRowRefs.current[i]
            if (row) {
              row.style.transform =
                z > 0 ? `translate3d(0, ${z * (compactY - liveY)}px, 0)` : ""
            }
          }

          const lab = labelRefs.current[i]
          if (lab) {
            const y = liveY + z * (compactY - liveY)
            let fade = 1
            if (lk.yieldPad > 0 && z < 1) {
              for (const spn of spans) {
                const d =
                  y < spn.top
                    ? spn.top - y
                    : y > spn.bottom
                      ? y - spn.bottom
                      : 0
                if (d < lk.yieldPad) {
                  const f = 1 - spn.k * (1 - d / lk.yieldPad)
                  if (f < fade) fade = f
                }
              }
            }
            lab.style.opacity = String(
              lk.labelAlpha * (1 - (1 - fade) * (1 - z)),
            )
          }

          const el = lineRefs.current[i]
          if (!el) continue
          const dist = Math.abs(ticks[i].docY - needleDocY)
          if (dist < mt.velRadius && mt.velRadius > 0) {
            const t = 1 - dist / mt.velRadius
            const boost = velNorm * t * t
            el.style.transform = `scaleX(${1 + mt.velMax * boost})`
            el.style.opacity = String(Math.min(1, ticks[i].alpha + 0.6 * boost))
          } else {
            el.style.transform = "scaleX(1)"
            el.style.opacity = String(ticks[i].alpha)
          }
        }
        st.zoomWrote = z > 0
      }
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
    }
  }, [ticks])

  const scheduleZoom = (on: boolean) => {
    const st = fs.current
    window.clearTimeout(st.zoomTimer)
    const mt = rulerMotionTuner.read()
    st.zoomTimer = window.setTimeout(
      () => {
        st.zoomIntent = on
      },
      on ? mt.zoomInDelay : mt.zoomOutDelay,
    )
  }

  const railPointerEnter = () => scheduleZoom(true)
  const railPointerLeave = () => {
    fs.current.ghostActive = false
    if (!rulerZoom.dragging) scheduleZoom(false)
  }

  const railPointerMove = (e: React.PointerEvent) => {
    const vh = window.innerHeight
    const map = rulerMap(vh, layout.edgePad)
    const y = Math.max(map.base, Math.min(map.base + map.span, e.clientY))
    const p = clamp01((y - map.base) / map.span)
    const st = fs.current
    st.ghostActive = true
    st.ghostY = y

    if (rulerZoom.dragging) {
      st.dragMoved = Math.max(st.dragMoved, Math.abs(e.clientY - st.dragStartY))
      const docH = geom.docH || document.documentElement.scrollHeight
      const targetY = p * Math.max(1, docH - vh)
      const lenis = lenisRef.current
      if (lenis) {
        lenis.scrollTo(targetY, { lerp: rulerMotionTuner.read().dragLerp })
      } else {
        window.scrollTo({ top: targetY })
      }
    }
  }

  const railClick = (e: React.MouseEvent) => {
    if (fs.current.dragMoved > 4) return
    const vh = window.innerHeight
    const docH = geom.docH || document.documentElement.scrollHeight
    const map = rulerMap(vh, layout.edgePad)
    const p = clamp01((e.clientY - map.base) / map.span)
    const target = p * Math.max(1, docH - vh)
    const lenis = lenisRef.current
    const mt = rulerMotionTuner.read()
    if (lenis) {
      const dist = Math.abs(target - window.scrollY)
      lenis.scrollTo(target, {
        duration: mt.jumpDur * (0.4 + 0.6 * Math.min(1, dist / (vh * 2.5))),
        easing: easeOutExpo,
      })
    } else {
      window.scrollTo({ top: target, behavior: "smooth" })
    }
  }

  const railPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    const st = fs.current
    st.dragStartY = e.clientY
    st.dragMoved = 0
    rulerZoom.dragging = true
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const railPointerUp = (e: React.PointerEvent) => {
    if (!rulerZoom.dragging) return
    rulerZoom.dragging = false
    const rect = railRef.current?.getBoundingClientRect()
    const inside =
      !!rect &&
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    if (!inside) {
      fs.current.ghostActive = false
      scheduleZoom(false)
    }
  }

  return (
    <>
      <aside
        id="ruler"
        ref={railRef}
        role="scrollbar"
        aria-controls="main"
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
        aria-label="Page position"
        onClick={railClick}
      >
        <div
          id="frost"
          style={{
            maskImage: frostMask(look.frostSolid, look.frostGamma),
            WebkitMaskImage: frostMask(look.frostSolid, look.frostGamma),
          }}
        />

        <div
          id="rulerTrack"
          ref={trackRef}
          aria-hidden
          style={{ height: geom.docH || "100%" }}
        >
          {ticks.map((t, i) => (
            <div
              key={t.pct}
              ref={(el) => {
                tickRowRefs.current[i] = el
              }}
              className="tick-row"
              style={{ top: t.docY }}
            >
              <span
                ref={(el) => {
                  lineRefs.current[i] = el
                }}
                className="tick-line"
                style={{
                  width: t.major ? look.majorLen : look.minorLen,
                  opacity: t.alpha,
                }}
              />
              {t.major && (
                <span
                  ref={(el) => {
                    labelRefs.current[i] = el
                  }}
                  className="tick-label"
                  style={{ opacity: look.labelAlpha }}
                >
                  {t.pct}
                </span>
              )}
            </div>
          ))}
        </div>

        <div id="bracket" ref={bracketRef} aria-hidden>
          <div className="bracket-fill" />
          <span className="bracket-edge top" />
          <span className="bracket-edge bottom" />
        </div>

        <div id="needle" ref={needleRef} aria-hidden>
          <span className="needle-line" />
          <span id="readout" ref={readoutRef}>
            <span className="ruler-digits">
              {[0, 1, 2].map((c) => (
                <span
                  key={c}
                  ref={(el) => {
                    digitRefs.current[c] = el
                  }}
                  className="ruler-digit-col"
                >
                  {"0123456789".split("").map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </span>
              ))}
            </span>
            <span className="pct-sign">%</span>
          </span>
        </div>

        <div id="ghostLine" ref={ghostLineRef} aria-hidden />

        <div
          id="hit"
          onPointerEnter={railPointerEnter}
          onPointerLeave={railPointerLeave}
          onPointerMove={railPointerMove}
          onPointerDown={railPointerDown}
          onPointerUp={railPointerUp}
          onPointerCancel={railPointerUp}
        />
      </aside>

      <HeadingFlow sections={sections} geom={geom} />
    </>
  )
}

function frostMask(solid: number, gamma: number): string {
  const stops = [`black ${solid.toFixed(0)}%`]
  const steps = 8
  for (let k = 1; k < steps; k++) {
    const x = k / steps
    const a = Math.pow(1 - x, gamma)
    const pos = solid + x * (100 - solid)
    stops.push(`rgba(0,0,0,${a.toFixed(3)}) ${pos.toFixed(1)}%`)
  }
  stops.push("transparent 100%")
  return `linear-gradient(to left, ${stops.join(", ")})`
}
