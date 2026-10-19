"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import gsap from "gsap"
import { lenisRef } from "../../lib/lenis-ref"
import {
  NAV_H,
  clamp01,
  easeInOutCubic,
  easeOutExpo,
  railOccupancy,
  rulerMap,
  rulerZoom,
  type MeasuredSection,
} from "./ruler-shared"
import {
  rulerLayoutTuner,
  rulerLookTuner,
  rulerMotionTuner,
} from "./ruler-tunables"

type Pose = {
  x: number
  y: number
  rot: number
  scale: number
  alpha: number
}

type WordMetrics = {
  adv: number[]
  cum: number[]
  total: number
}

type WordRefs = {
  letters: (HTMLSpanElement | null)[]
  hit: HTMLAnchorElement | null
}

export interface RulerGeom {
  docH: number
  vh: number
  vw: number
}

export interface ScrollFlipRange {
  start: number
  end: number
}

interface HeadingFlowProps {
  sections: MeasuredSection[]
  geom: RulerGeom
}

function fallbackMetrics(labels: string[]): Record<string, WordMetrics> {
  const out: Record<string, WordMetrics> = {}
  for (const label of labels) {
    const adv = label.split("").map(() => 0.6)
    const cum: number[] = []
    let total = 0
    for (const a of adv) {
      cum.push(total)
      total += a
    }
    out[label] = { adv, cum, total }
  }
  return out
}

export default function HeadingFlow({ sections, geom }: HeadingFlowProps) {
  const [metrics, setMetrics] = useState<Record<string, WordMetrics>>(() =>
    fallbackMetrics(sections.map((s) => s.label)),
  )
  const wordRefs = useRef<WordRefs[]>([])
  const topPoolRef = useRef<HTMLDivElement>(null)
  const bottomPoolRef = useRef<HTMLDivElement>(null)

  const hoverWi = useRef(-1)
  const hoverK = useMemo(
    () => new Float32Array(sections.length),
    [sections.length],
  )
  const pressUntil = useMemo(
    () => new Float32Array(sections.length),
    [sections.length],
  )
  const fs = useRef({
    lastY: 0,
    vel: 0,
    snapSince: null as number | null,
    snapping: false,
    armed: true,
    jumping: false,
  })

  const layout = rulerLayoutTuner.read()
  const pools = rulerLookTuner.read()
  const labelsKey = sections.map((s) => s.label).join("|")

  useEffect(() => {
    if (!sections.length) return
    let cancelled = false
    const run = () => {
      if (cancelled) return
      setMetrics(measureLabels(sections.map((s) => s.label)))
    }
    const ready = document.fonts?.ready
    if (ready) ready.then(run).catch(run)
    else run()
    return () => {
      cancelled = true
    }
  }, [labelsKey, sections])

  useEffect(() => {
    if (!sections.length) return

    const tick = (_time: number, deltaMs: number) => {
      const st = fs.current
      const lay = rulerLayoutTuner.read()
      const mt = rulerMotionTuner.read()
      const lk = rulerLookTuner.read()
      const docH = geom.docH || document.documentElement.scrollHeight || 4000
      const vh = window.innerHeight || geom.vh || 900
      const vw = window.innerWidth || geom.vw || 1280
      const dt = Math.min(deltaMs / 1000, 0.1) || 0.016

      const scrollY = window.scrollY
      const maxScroll = Math.max(1, docH - vh)
      const progress = clamp01(scrollY / maxScroll)
      const map = rulerMap(vh, lay.edgePad)
      const drift = map.drift(progress)

      const raw = (scrollY - st.lastY) / dt
      st.lastY = scrollY
      st.vel += (raw - st.vel) * (1 - Math.exp(-6 * dt))

      const T = (lay.thresholdPct / 100) * vh
      const yTopLine = NAV_H + lay.topPad
      const yQueueLine = vh - lay.queuePad
      const hp = lay.headingPx
      const rs = lay.ridingPx / hp
      const qs = lay.queuePx / hp
      const railCenterX = vw - lay.railW / 2
      const zoomE = easeInOutCubic(rulerZoom.p)

      const phases = sections.map((s, wi) => {
        const m = metrics[s.label]
        const rideLen = (m?.total ?? 0) * hp * rs
        const v = s.anchor - scrollY + drift
        let flipP: number
        let detachP = 0
        let scrollFlip: ScrollFlipRange | null = null

        if (wi === 0) {
          flipP = 1
          detachP = 1
        } else {
          flipP = clamp01((T + mt.flipZone - v) / mt.flipZone)
          if (s.anchor - maxScroll > T) {
            const endStart = Math.min(s.bottom - vh, maxScroll - 24)
            const zone = Math.max(24, maxScroll - endStart)
            flipP = Math.max(flipP, clamp01((scrollY - endStart) / zone))
            scrollFlip = { start: endStart, end: maxScroll }
          }
        }
        return { v, rideLen, flipP, scrollFlip, detachP, yq: yQueueLine }
      })

      {
        let below = 0
        for (let wi = sections.length - 1; wi >= 0; wi--) {
          if (wi === 0) continue
          const ph = phases[wi]
          ph.yq = yQueueLine - lay.queueSlot * below
          ph.detachP = clamp01(
            (ph.yq + mt.detachZone - (ph.v + ph.rideLen)) / mt.detachZone,
          )
          below += 1 - ph.detachP
        }
      }

      railOccupancy.spans.length = 0

      let stackedCount = 0
      let flipShift = 0
      for (const p of phases) {
        if (p.flipP >= 1) stackedCount++
        else if (p.flipP > 0) flipShift += p.flipP
      }

      let topK = 0
      let botK = 0
      for (let wi = 0; wi < phases.length; wi++) {
        if (phases[wi].flipP > topK) topK = phases[wi].flipP
        if (wi > 0) {
          const q = 1 - phases[wi].detachP
          if (q > botK) botK = q
        }
      }

      let poolW = 260
      for (const s of sections) {
        const m = metrics[s.label]
        if (m) poolW = Math.max(poolW, m.total * lay.headingPx)
      }
      poolW += lay.railW + lay.textPad + pools.poolPad
      const n = sections.length
      const topPoolH =
        NAV_H +
        lay.topPad +
        Math.max(0, n - 1) * lay.queueSlot +
        lay.currentGap +
        lay.headingPx +
        pools.poolPad
      const bottomPoolH = lay.queuePad + n * lay.queueSlot + pools.poolPad

      if (topPoolRef.current) {
        topPoolRef.current.style.width = `${poolW}px`
        topPoolRef.current.style.height = `${topPoolH}px`
        topPoolRef.current.style.opacity = String(
          (pools.poolAlpha * topK).toFixed(3),
        )
      }
      if (bottomPoolRef.current) {
        bottomPoolRef.current.style.width = `${poolW}px`
        bottomPoolRef.current.style.height = `${bottomPoolH}px`
        bottomPoolRef.current.style.opacity = String(
          (pools.poolAlpha * botK).toFixed(3),
        )
      }

      const horizPose = (
        m: WordMetrics,
        i: number,
        yLine: number,
        s: number,
        alpha: number,
      ): Pose => {
        const along = (m.cum[i] + m.adv[i] / 2) * hp * s
        const inward = lay.railW + lay.textPad + (m.total * hp * s - along)
        return {
          x: vw - inward,
          y: yLine,
          rot: 0,
          scale: s,
          alpha,
        }
      }

      const ridePose = (m: WordMetrics, i: number, top: number): Pose => ({
        x: railCenterX,
        y: top + (m.total - m.cum[i] - m.adv[i] / 2) * hp * rs,
        rot: -90,
        scale: rs,
        alpha: lk.queueAlpha,
      })

      for (let wi = 0; wi < sections.length; wi++) {
        const s = sections[wi]
        const m = metrics[s.label]
        const refs = wordRefs.current[wi]
        if (!m || !refs) continue

        const { v, rideLen, flipP, detachP, yq } = phases[wi]
        const letterCount = m.adv.length

        let p: number
        let from: (i: number) => Pose
        let to: (i: number) => Pose
        let reverseStagger = false

        if (flipP > 0) {
          p = flipP
          reverseStagger = true
          from = (i) => ridePose(m, i, v)
          if (flipP >= 1) {
            const demote = wi === stackedCount - 1 ? flipShift : 1
            const y =
              yTopLine + wi * lay.queueSlot + lay.currentGap * (1 - demote)
            const scale = 1 - (1 - qs) * demote
            const alpha = 1 - (1 - lk.queueAlpha) * demote
            to = (i) => horizPose(m, i, y, scale, alpha)
          } else {
            to = (i) =>
              horizPose(
                m,
                i,
                yTopLine + wi * lay.queueSlot + lay.currentGap,
                1,
                1,
              )
          }
        } else if (detachP < 1) {
          p = detachP
          reverseStagger = true
          const vForm = yq - rideLen
          to = (i) => ridePose(m, i, vForm)
          from = (i) => horizPose(m, i, yq, qs, lk.queueAlpha)
        } else {
          p = 1
          from = to = (i) => ridePose(m, i, v)
        }

        const sf = mt.stagger
        const span = 1 + (letterCount - 1) * sf
        const mapY = map.base + (s.anchor / docH) * map.span

        const hk = (hoverK[wi] +=
          ((hoverWi.current === wi ? 1 : 0) - hoverK[wi]) *
          (1 - Math.exp(-dt / 0.08)))
        const pk = clamp01((pressUntil[wi] - performance.now()) / 350)

        let minX = Infinity
        let maxX = -Infinity
        let minY = Infinity
        let maxY = -Infinity
        let maxAlpha = 0

        for (let i = 0; i < letterCount; i++) {
          const el = refs.letters[i]
          if (!el) continue
          const si = reverseStagger ? letterCount - 1 - i : i
          const pi = clamp01(p * span - si * sf)
          const e = easeInOutCubic(pi)
          const a = from(i)
          const b = to(i)
          const cx = (a.x + b.x) / 2 - mt.arc
          const cy = (a.y + b.y) / 2
          const u = 1 - e
          let x = u * u * a.x + 2 * u * e * cx + e * e * b.x
          let y = u * u * a.y + 2 * u * e * cy + e * e * b.y
          let rot = a.rot + (b.rot - a.rot) * e
          let scale = a.scale + (b.scale - a.scale) * e
          let alpha = a.alpha + (b.alpha - a.alpha) * e

          if (zoomE > 0) {
            const mp = horizPose(m, i, mapY, qs, lk.mapAlpha)
            x += (mp.x - x) * zoomE
            y += (mp.y - y) * zoomE
            rot *= 1 - zoomE
            scale += (mp.scale - scale) * zoomE
            alpha += (mp.alpha - alpha) * zoomE
          }

          el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) translate(-50%, -50%) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`
          const aEff = alpha + (1 - alpha) * hk
          el.style.opacity = aEff < 0.02 ? "0" : "1"
          if (aEff >= 0.995) {
            el.style.color = "var(--fg)"
          } else {
            el.style.color = `color-mix(in srgb, var(--fg) ${(clamp01(aEff) * 100).toFixed(1)}%, var(--bg))`
          }
          if (pk > 0.01) {
            el.style.color = `color-mix(in srgb, var(--acc) ${(pk * 70).toFixed(0)}%, ${el.style.color})`
          }

          if (alpha > maxAlpha) maxAlpha = alpha
          const wHalf = (m.adv[i] * hp * scale) / 2 + 2
          const hHalf = (hp * scale) / 2 + 2
          const vertical = Math.abs(rot) > 45
          const xHalf = vertical ? hHalf : wHalf
          const yHalf = vertical ? wHalf : hHalf
          if (x - xHalf < minX) minX = x - xHalf
          if (x + xHalf > maxX) maxX = x + xHalf
          if (y - yHalf < minY) minY = y - yHalf
          if (y + yHalf > maxY) maxY = y + yHalf
        }

        const onRail = wi === 0 ? 0 : detachP * (1 - flipP)
        if (onRail > 0.02) {
          railOccupancy.spans.push({ top: v, bottom: v + rideLen, k: onRail })
        }

        if (refs.hit && isFinite(minX)) {
          refs.hit.style.left = `${minX - 2}px`
          refs.hit.style.top = `${minY - 2}px`
          refs.hit.style.width = `${maxX - minX + 4}px`
          refs.hit.style.height = `${maxY - minY + 4}px`
          refs.hit.style.pointerEvents = maxAlpha > 0.05 ? "auto" : "none"
        }
      }

      let activeIdx = 0
      for (let i = 0; i < phases.length; i++) {
        if (phases[i].flipP >= 0.5) activeIdx = i
      }
      const activeId = sections[activeIdx]?.id
      if (activeId) {
        const navLinks = document.querySelectorAll(".nl a")
        navLinks.forEach((a) => {
          const href = a.getAttribute("href")
          a.classList.toggle("on", href === `#${activeId}`)
        })
      }

      const lenis = lenisRef.current
      const now = performance.now()
      const midIdx = phases.findIndex(
        (ph) => ph.flipP > 0.04 && ph.flipP < 0.96,
      )
      if (rulerZoom.dragging) st.armed = true
      if (st.snapping) {
        if (midIdx < 0) st.snapping = false
      } else if (
        midIdx >= 0 &&
        st.armed &&
        !st.jumping &&
        Math.abs(st.vel) < 30 &&
        lenis &&
        !rulerZoom.dragging &&
        rulerZoom.p < 0.3
      ) {
        if (st.snapSince === null) {
          st.snapSince = now
        } else if (now - st.snapSince > mt.snapDelay) {
          const ph = phases[midIdx]
          const sMid = sections[midIdx]
          let raw: number
          if (ph.scrollFlip) {
            raw =
              ph.flipP >= 0.5 ? ph.scrollFlip.end + 4 : ph.scrollFlip.start - 4
          } else {
            const vTarget = ph.flipP >= 0.5 ? T - 4 : T + mt.flipZone + 4
            raw = sMid.anchor + drift - vTarget
          }
          const target = Math.max(0, Math.min(maxScroll, raw))
          st.snapping = true
          st.armed = false
          st.snapSince = null
          lenis.scrollTo(target, {
            duration: mt.snapDur,
            easing: easeInOutCubic,
            onComplete: () => {
              st.snapping = false
            },
          })
        }
      } else {
        st.snapSince = null
      }
    }

    const rearm = () => {
      fs.current.armed = true
    }
    window.addEventListener("wheel", rearm, { passive: true })
    window.addEventListener("touchmove", rearm, { passive: true })
    window.addEventListener("keydown", rearm)

    gsap.ticker.add(tick)
    return () => {
      window.removeEventListener("wheel", rearm)
      window.removeEventListener("touchmove", rearm)
      window.removeEventListener("keydown", rearm)
      gsap.ticker.remove(tick)
    }
  }, [metrics, sections, geom])

  const jump = (s: MeasuredSection, wi: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    pressUntil[wi] = performance.now() + 350
    fs.current.armed = false
    fs.current.jumping = true
    const lenis = lenisRef.current
    const el = document.getElementById(s.id)
    const target =
      s.isHero || wi === 0
        ? 0
        : el
          ? Math.max(0, el.getBoundingClientRect().top + window.scrollY - NAV_H)
          : s.anchor - NAV_H
    if (lenis) {
      lenis.scrollTo(target, {
        duration: rulerMotionTuner.read().jumpDur,
        easing: easeOutExpo,
        onComplete: () => {
          fs.current.jumping = false
        },
      })
    } else {
      window.scrollTo({ top: target, behavior: "smooth" })
      fs.current.jumping = false
    }
  }

  return (
    <>
      <div id="topPool" ref={topPoolRef} aria-hidden />
      <div id="bottomPool" ref={bottomPoolRef} aria-hidden />

      <div id="headingFlow" aria-hidden>
        {sections.map((s, wi) => {
          const refs = (wordRefs.current[wi] ??= {
            letters: [],
            hit: null,
          })
          return s.label.split("").map((ch, li) => (
            <span
              key={`${s.id}-${li}`}
              ref={(el) => {
                refs.letters[li] = el
              }}
              className="hf-letter"
              style={{
                fontSize: layout.headingPx,
              }}
            >
              {ch}
            </span>
          ))
        })}
      </div>

      <div id="headingHits">
        {sections.map((s, wi) => {
          const refs = (wordRefs.current[wi] ??= {
            letters: [],
            hit: null,
          })
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              ref={(el) => {
                refs.hit = el
              }}
              onClick={jump(s, wi)}
              onPointerEnter={() => {
                hoverWi.current = wi
              }}
              onPointerLeave={() => {
                if (hoverWi.current === wi) hoverWi.current = -1
              }}
              aria-label={`Jump to ${s.label}`}
              className="hf-hit"
            />
          )
        })}
      </div>
    </>
  )
}

function measureLabels(labels: string[]): Record<string, WordMetrics> {
  const probe = document.createElement("div")
  probe.style.cssText =
    "position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre;font-family:var(--disp);font-size:100px;font-weight:700;line-height:1;"
  document.body.appendChild(probe)

  const out: Record<string, WordMetrics> = {}
  for (const label of labels) {
    probe.textContent = ""
    const spans = label.split("").map((ch) => {
      const span = document.createElement("span")
      span.textContent = ch
      probe.appendChild(span)
      return span
    })
    const adv = spans.map((sp) => sp.getBoundingClientRect().width / 100)
    const cum: number[] = []
    let total = 0
    for (const a of adv) {
      cum.push(total)
      total += a
    }
    out[label] = { adv, cum, total }
  }

  probe.remove()
  return out
}
