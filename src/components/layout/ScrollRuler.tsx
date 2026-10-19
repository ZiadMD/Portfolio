"use client"

// Measure labels

// --- HeadingFlow ---

import { useEffect, useRef } from "react"
import Lenis from "lenis"

const NAV_H = 52

const TUNABLES = {
  edgePad: 12,
  railW: 60,
  minorPct: 1,
  labelPct: 5,
  headingPx: 32,
  ridingPx: 20,
  queuePx: 16,
  topPad: 28,
  currentGap: 26,
  queueSlot: 20,
  queuePad: 36,
  textPad: 0,
  flipZone: 200,
  detachZone: 240,
  stagger: 0.16,
  arc: 28,
  jumpDur: 1.25,
  velRadius: 180,
  velMax: 0.6,
  zoomInDelay: 150,
  zoomOutDelay: 150,
  zoomLerp: 10,
  dragLerp: 0.18,
  minorAlpha: 0.4,
  majorAlpha: 0.8,
  labelAlpha: 0.5,
  minorLen: 10,
  majorLen: 20,
  ghostAlpha: 1.0,
  queueAlpha: 0.35,
  yieldPad: 24,
  needleFadePct: 3,
  mapAlpha: 0.85,
  poolAlpha: 1.0,
  poolPad: 64,
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const easeInOutCubic = (t: number) =>
  t <
  0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2
const easeOutExpo = (t: number) =>
  t >=
  1
    ? 1
    : 1 -
      Math.pow(
        2,
        -10 *
          t,
      )

function rulerMap(vh: number, pad: number) {
  const base =
    NAV_H +
    pad
  return {
    base,
    span: Math.max(1, vh - NAV_H - 2 * pad),
    drift: (p: number) => base - p * (NAV_H + 2 * pad),
  }
}

function frostMask(solid: number, gamma: number) {
  const stops = [`black ${solid.toFixed(0)}%`]
  const steps = 8
  for (
    let k = 1;
    k <
    steps;
    k++
  ) {
    const x =
      k /
      steps
    const a = Math.pow(
      1 -
        x,
      gamma,
    )
    const pos = solid + x * (100 - solid)
    stops.push(`rgba(0,0,0,${a.toFixed(3)}) ${pos.toFixed(1)}%`)
  }
  stops.push("transparent 100%")
  return `linear-gradient(to left, ${stops.join(", ")})`
}

interface LabelMetric {
  adv: number[];
  cum: number[];
  total: number;
}

interface LetterPose {
  x: number;
  y: number;
  rot: number;
  scale: number;
  alpha: number;
}

interface TickItem {
  pct: number;
  major: boolean;
  docY: number;
}

interface OccupancySpan {
  top: number;
  bottom: number;
  k: number;
}

const RULER_SECTIONS = [
  { id: "hero", label: "ZIAD", isHero: true },
  { id: "about", label: "ABOUT", isHero: false },
  { id: "experience", label: "EXPERIENCE", isHero: false },
  { id: "work", label: "WORK", isHero: false },
  { id: "contact", label: "CONTACT", isHero: false },
]

interface ScrollRulerProps {
  lenisRef: React.MutableRefObject<Lenis | null>
  onActiveSectionChange?: (sectionId: string) => void
}

export default function ScrollRuler({
  lenisRef,
  onActiveSectionChange,
}: ScrollRulerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = containerRef.current
    if (!root) return

    const rulerEl = root.querySelector<HTMLElement>("#ruler")
    const frostEl = root.querySelector<HTMLElement>("#frost")
    const rulerTrack = root.querySelector<HTMLElement>("#rulerTrack")
    const bracketEl = root.querySelector<HTMLElement>("#bracket")
    const ghostLine = root.querySelector<HTMLElement>("#ghostLine")
    const needleEl = root.querySelector<HTMLElement>("#needle")
    const readoutEl = root.querySelector<HTMLElement>("#readout")
    const hitEl = root.querySelector<HTMLElement>("#hit")
    const topPool = root.querySelector<HTMLElement>("#topPool")
    const bottomPool = root.querySelector<HTMLElement>("#bottomPool")
    const headingFlow = root.querySelector<HTMLElement>("#headingFlow")
    const headingHits = root.querySelector<HTMLElement>("#headingHits")
    const barEl = root.querySelector<HTMLElement>("#bar")
    const digitCols = Array.from(
      root.querySelectorAll<HTMLElement>(".ruler-digit-col"),
    )

    if (
      !rulerEl ||
      !rulerTrack ||
      !bracketEl ||
      !ghostLine ||
      !needleEl ||
      !readoutEl ||
      !hitEl ||
      !headingFlow ||
      !headingHits
    ) {
      return
    }

    if (frostEl) {
      const mask = frostMask(40, 2.2)
      frostEl.style.maskImage = mask
      frostEl.style.webkitMaskImage = mask
    }
    function measureLabels(labels: string[]) {
      const probe = document.createElement("div")
      probe.style.cssText =
        "position:fixed;left:-9999px;top:0;visibility:hidden;white-space:pre;font-family:var(--disp);font-size:100px;font-weight:700;line-height:1;pointer-events:none;"
      document.body.appendChild(probe)
      const out: Record<string, LabelMetric> = {}

      for (const label of labels) {
        probe.textContent = ""
        const spans = label.split("").map((ch) => {
          const s = document.createElement("span")
          s.textContent = ch
          probe.appendChild(s)
          return s
        })
        const adv = spans.map(
          (s) =>
            s.getBoundingClientRect().width /
            100,
        )
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

    let metrics = measureLabels(RULER_SECTIONS.map((s) => s.label))
    if (document.fonts) {
      document.fonts.ready.then(() => {
        metrics = measureLabels(RULER_SECTIONS.map((s) => s.label))
        updatePoolSizes()
      })
    }

    function updatePoolSizes() {
      let poolW = 260
      for (const s of RULER_SECTIONS) {
        const m = metrics[s.label]
        if (m)
          poolW = Math.max(
            poolW,
            m.total *
              TUNABLES.headingPx,
          )
      }
      poolW += TUNABLES.railW + TUNABLES.textPad + TUNABLES.poolPad
      const n = RULER_SECTIONS.length
      const topPoolH =
        NAV_H +
        TUNABLES.topPad +
        Math.max(
          0,
          n -
            1,
        ) *
          TUNABLES.queueSlot +
        TUNABLES.currentGap +
        TUNABLES.headingPx +
        TUNABLES.poolPad
      const bottomPoolH =
        TUNABLES.queuePad + n * TUNABLES.queueSlot + TUNABLES.poolPad

      if (topPool) {
        topPool.style.width =
          poolW +
          "px"
        topPool.style.height =
          topPoolH +
          "px"
      }
      if (bottomPool) {
        bottomPool.style.width =
          poolW +
          "px"
        bottomPool.style.height =
          bottomPoolH +
          "px"
      }
    }
    updatePoolSizes()

    headingFlow.innerHTML = ""
    headingHits.innerHTML = ""
    const wordLetters: HTMLElement[][] = []
    const wordHits: HTMLElement[] = []
    const hoverK = new Float32Array(RULER_SECTIONS.length)
    let hoverWi = -1

    RULER_SECTIONS.forEach((s, wi) => {
      const letters: HTMLElement[] = []
      s.label.split("").forEach((ch) => {
        const span = document.createElement("span")
        span.className = "hf-letter"
        span.textContent = ch
        span.style.fontSize =
          TUNABLES.headingPx +
          "px"
        headingFlow.appendChild(span)
        letters.push(span)
      })
      wordLetters.push(letters)

      const hit = document.createElement("a")
      hit.className = "hf-hit"
      hit.href =
        "#" +
        s.id
      hit.setAttribute(
        "aria-label",
        "Jump to " +
          s.label,
      )
      hit.addEventListener("click", (e) => {
        e.preventDefault()
        e.stopPropagation()
        jumpToSection(wi)
      })
      hit.addEventListener("pointerenter", () => {
        hoverWi = wi
      })
      hit.addEventListener("pointerleave", () => {
        if (
          hoverWi ===
          wi
        )
          hoverWi = -1
      })
      headingHits.appendChild(hit)
      wordHits.push(hit)
    })

    const tickRoster: TickItem[] = [];
    for (
      let p = 0;
      p <=
      100.001;
      p += TUNABLES.minorPct
    ) {
      const pct =
        Math.round(
          p *
            100,
        ) /
        100
      const major =
        Math.abs(
          pct %
            TUNABLES.labelPct,
        ) <
        1e-5
      tickRoster.push({ pct, major, docY: 0 })
    }

    let tickRows: HTMLElement[] = []
    let tickLines: HTMLElement[] = []
    let tickLabels: (HTMLElement | null)[] = []
    let lastDocH = 0

    function rebuildTicks(docH: number) {
      if (
        docH ===
          lastDocH &&
        tickRows.length
      )
        return
      lastDocH = docH
      rulerTrack!.innerHTML = ""
      rulerTrack!.style.height =
        docH +
        "px"
      tickRows = []
      tickLines = []
      tickLabels = []

      for (
        let i = 0;
        i <
        tickRoster.length;
        i++
      ) {
        const t = tickRoster[i]
        t.docY = (t.pct / 100) * docH

        const row = document.createElement("div")
        row.className = "tick-row"
        row.style.top =
          t.docY +
          "px"

        const line = document.createElement("span")
        line.className = "tick-line"
        line.style.width =
          (t.major ? TUNABLES.majorLen : TUNABLES.minorLen) +
          "px"
        line.style.opacity = String(
          t.major ? TUNABLES.majorAlpha : TUNABLES.minorAlpha,
        )
        row.appendChild(line)

        let lab: HTMLElement | null = null
        if (t.major) {
          lab = document.createElement("span")
          lab.className = "tick-label"
          lab.textContent = String(t.pct)
          row.appendChild(lab)
        }

        rulerTrack!.appendChild(row)
        tickRows.push(row)
        tickLines.push(line)
        tickLabels.push(lab)
      }
    }

    function jumpToProgress(clientY: number) {
      const vh = window.innerHeight
      const docH = document.documentElement.scrollHeight
      const map = rulerMap(vh, TUNABLES.edgePad)
      const p = clamp01((clientY - map.base) / map.span)
      const target =
        p *
        Math.max(
          1,
          docH -
            vh,
        )
      const lenis = lenisRef.current
      if (lenis) {
        const dist = Math.abs(
          target -
            window.scrollY,
        )
        lenis.scrollTo(target, {
          duration:
            TUNABLES.jumpDur * (0.4 + 0.6 * Math.min(1, dist / (vh * 2.5))),
          easing: easeOutExpo,
        })
      } else {
        window.scrollTo({ top: target, behavior: "smooth" })
      }
    }

    function jumpToSection(wi: number) {
      const s = RULER_SECTIONS[wi]
      if (!s) return
      const el = document.getElementById(s.id)
      const target =
        s.isHero ||
        wi ===
          0
          ? 0
          : el
            ? Math.max(
                0,
                el.getBoundingClientRect().top + window.scrollY - NAV_H,
              )
            : 0
      const lenis = lenisRef.current
      if (lenis) {
        lenis.scrollTo(target, {
          duration: TUNABLES.jumpDur,
          easing: easeOutExpo,
        })
      } else {
        window.scrollTo({ top: target, behavior: "smooth" })
      }
    }

    let prevPct = -1
    const prevDigits = [-1, -1, -1]
    let readoutAbove = false
    function updateOdometer(pct: number) {
      if (
        pct ===
        prevPct
      )
        return
      prevPct = pct
      rulerEl!.setAttribute("aria-valuenow", String(pct))
      const str = String(pct).padStart(3, "0")
      for (
        let c = 0;
        c <
        3;
        c++
      ) {
        const d =
          str.charCodeAt(c) -
          48
        if (
          d !==
          prevDigits[c]
        ) {
          prevDigits[c] = d
          if (digitCols[c]) {
            digitCols[c].style.transform = `translateY(${-d}em)`
          }
        }
      }
    }

    let zoomIntent = false
    let zoomTimer: NodeJS.Timeout | number = 0
    const rulerZoom = { p: 0, target: 0, dragging: false }
    let dragStartY = 0
    let dragMoved = 0
    let ghostActive = false
    let ghostY = 0

    function scheduleZoom(on: boolean) {
      clearTimeout(zoomTimer)
      zoomTimer = setTimeout(
        () => {
          zoomIntent = on
        },
        on ? TUNABLES.zoomInDelay : TUNABLES.zoomOutDelay,
      )
    }

    const onPointerEnterHit = () => scheduleZoom(true)
    const onPointerLeaveHit = () => {
      ghostActive = false
      if (!rulerZoom.dragging) scheduleZoom(false)
    }
    const onPointerMoveHit = (e: PointerEvent) => {
      const vh = window.innerHeight
      const map = rulerMap(vh, TUNABLES.edgePad)
      const y = Math.max(
        map.base,
        Math.min(
          map.base +
            map.span,
          e.clientY,
        ),
      )
      const p = clamp01((y - map.base) / map.span)
      ghostActive = true
      ghostY = y
      if (rulerZoom.dragging) {
        dragMoved = Math.max(
          dragMoved,
          Math.abs(
            e.clientY -
              dragStartY,
          ),
        )
        const docH = document.documentElement.scrollHeight
        const targetY =
          p *
          Math.max(
            1,
            docH -
              vh,
          )
        const lenis = lenisRef.current
        if (lenis) {
          lenis.scrollTo(targetY, { lerp: TUNABLES.dragLerp })
        } else {
          window.scrollTo({ top: targetY })
        }
      }
    }
    const onPointerDownHit = (e: PointerEvent) => {
      e.preventDefault()
      dragStartY = e.clientY
      dragMoved = 0
      rulerZoom.dragging = true
      hitEl.setPointerCapture(e.pointerId)
    }
    const onPointerEnd = (e: PointerEvent) => {
      if (!rulerZoom.dragging) return
      rulerZoom.dragging = false
      if (
        dragMoved <=
        4
      ) {
        jumpToProgress(e.clientY)
      }
      const rect = rulerEl.getBoundingClientRect()
      const inside =
        e.clientX >=
          rect.left &&
        e.clientX <=
          rect.right &&
        e.clientY >=
          rect.top &&
        e.clientY <=
          rect.bottom
      if (!inside) {
        ghostActive = false
        scheduleZoom(false)
      }
    }

    hitEl.addEventListener("pointerenter", onPointerEnterHit)
    hitEl.addEventListener("pointerleave", onPointerLeaveHit)
    hitEl.addEventListener("pointermove", onPointerMoveHit)
    hitEl.addEventListener("pointerdown", onPointerDownHit)
    hitEl.addEventListener("pointerup", onPointerEnd)
    hitEl.addEventListener("pointercancel", onPointerEnd)

    let lastY = window.scrollY
    let vel = 0
    let lastTime = performance.now()
    const railOccupancySpans: OccupancySpan[] = [];
    let isRunning = true

    function step(now: number) {
      if (!isRunning) return
      requestAnimationFrame(step)

      const docH = document.documentElement.scrollHeight
      const vh = window.innerHeight
      const vw = window.innerWidth
      if (!vh || !docH) return

      const dt =
        Math.min((now - lastTime) / 1000, 0.1) ||
        0.016
      lastTime = now
      const scrollY = window.scrollY
      const maxScroll = Math.max(
        1,
        docH -
          vh,
      )
      const progress = clamp01(
        scrollY /
          maxScroll,
      )

      const rawVel = (scrollY - lastY) / dt
      lastY = scrollY
      vel +=
        (rawVel - vel) *
        (1 -
          Math.exp(
            -6 *
              dt,
          ))

      if (barEl) barEl.style.transform = `scaleX(${progress})`
      rebuildTicks(docH)

      const map = rulerMap(vh, TUNABLES.edgePad)
      const drift = map.drift(progress)

      rulerTrack!.style.transform = `translate3d(0, ${
        -scrollY +
        drift
      }px, 0)`

      const ny = map.base + progress * map.span
      needleEl!.style.transform = `translate3d(0, ${ny}px, 0)`
      needleEl!.style.opacity = String(
        clamp01(
          progress /
            Math.max(
              0.001,
              TUNABLES.needleFadePct /
                100,
            ),
        ),
      )

      const above = ny > vh - 26
      if (
        above !==
        readoutAbove
      ) {
        readoutAbove = above
        readoutEl!.style.top = above ? "-14px" : "4px"
      }

      const pct = Math.round(
        progress *
          100,
      )
      updateOdometer(pct)

      rulerZoom.target =
        zoomIntent ||
        rulerZoom.dragging
          ? 1
          : 0
      rulerZoom.p +=
        (rulerZoom.target - rulerZoom.p) *
        (1 -
          Math.exp(
            -TUNABLES.zoomLerp *
              dt,
          ))
      if (
        rulerZoom.target ===
          0 &&
        rulerZoom.p <
          0.0005
      )
        rulerZoom.p = 0
      if (
        rulerZoom.target ===
          1 &&
        rulerZoom.p >
          0.9995
      )
        rulerZoom.p = 1
      const z = rulerZoom.p

      bracketEl!.style.transform = `translate3d(0, ${
        map.base + (scrollY / docH) * map.span
      }px, 0)`
      bracketEl!.style.height = `${(vh / docH) * map.span}px`
      bracketEl!.style.opacity = String(z)

      if (ghostActive) {
        ghostLine!.style.transform = `translate3d(0, ${ghostY}px, 0)`
        ghostLine!.style.opacity = String(TUNABLES.ghostAlpha * (0.2 + 0.8 * z))
      } else {
        ghostLine!.style.opacity = "0"
      }

      const needleDocY =
        progress *
        docH
      const velNorm = clamp01(
        Math.abs(vel) /
          3000,
      )
      const writeZoom =
        z >
        0
      for (
        let i = 0;
        i <
        tickRoster.length;
        i++
      ) {
        const liveY = tickRoster[i].docY - scrollY + drift
        const compactY = map.base + (tickRoster[i].pct / 100) * map.span
        if (writeZoom && tickRows[i]) {
          tickRows[i].style.transform =
            z >
            0
              ? `translate3d(0, ${z * (compactY - liveY)}px, 0)`
              : ""
        }
        if (tickLabels[i]) {
          const y = liveY + z * (compactY - liveY)
          let fade = 1
          if (
            TUNABLES.yieldPad >
              0 &&
            z <
              1
          ) {
            for (
              let j = 0;
              j <
              railOccupancySpans.length;
              j++
            ) {
              const spn = railOccupancySpans[j]
              const d =
                y <
                spn.top
                  ? spn.top -
                    y
                  : y >
                      spn.bottom
                    ? y -
                      spn.bottom
                    : 0
              if (
                d <
                TUNABLES.yieldPad
              ) {
                const f = 1 - spn.k * (1 - d / TUNABLES.yieldPad)
                if (
                  f <
                  fade
                )
                  fade = f
              }
            }
          }
          tickLabels[i]!.style.opacity = String(
            TUNABLES.labelAlpha * (1 - (1 - fade) * (1 - z)),
          )
        }
        const lineEl = tickLines[i]
        if (lineEl) {
          const dist = Math.abs(
            tickRoster[i].docY -
              needleDocY,
          )
          if (
            dist <
              TUNABLES.velRadius &&
            TUNABLES.velRadius >
              0
          ) {
            const t = 1 - dist / TUNABLES.velRadius
            const boost = velNorm * t * t
            lineEl.style.transform = `scaleX(${1 + TUNABLES.velMax * boost})`
            lineEl.style.opacity = String(
              Math.min(
                1,
                (tickRoster[i].major
                  ? TUNABLES.majorAlpha
                  : TUNABLES.minorAlpha) +
                  0.6 * boost,
              ),
            )
          } else {
            lineEl.style.transform = ""
            lineEl.style.opacity = String(
              tickRoster[i].major ? TUNABLES.majorAlpha : TUNABLES.minorAlpha,
            )
          }
        }
      }
      const hp = TUNABLES.headingPx
      const rs = TUNABLES.ridingPx / hp
      const qs = TUNABLES.queuePx / hp
      const railCenterX = vw - TUNABLES.railW / 2
      const yTopLine = NAV_H + TUNABLES.topPad
      const yQueueLine = vh - TUNABLES.queuePad
      const zoomE = easeInOutCubic(z)

      const measured = RULER_SECTIONS.map((s) => {
        const el = document.getElementById(s.id)
        const top = s.isHero
          ? 0
          : el
            ? el.getBoundingClientRect().top + scrollY - NAV_H
            : 0
        return { ...s, anchor: top }
      })

      const phases = measured.map((s) => {
        const m = metrics[s.label]
        const rideLen = m ? m.total * hp * rs : 100
        const v = map.base + (s.anchor / docH) * map.span - scrollY + drift
        return { v, rideLen, flipP: 0, detachP: 1, yq: 0 }
      })

      for (let wi = phases.length - 1; wi >= 0; wi--) {
        const ph = phases[wi]
        const yTopTarget = yTopLine + wi * TUNABLES.queueSlot
        ph.flipP = clamp01(
          (yTopTarget + TUNABLES.flipZone - ph.v) / TUNABLES.flipZone,
        )
      }

      let below = 0
      for (let wi = phases.length - 1; wi >= 0; wi--) {
        if (wi === 0) continue
        const ph = phases[wi]
        ph.yq = yQueueLine - TUNABLES.queueSlot * below
        ph.detachP = clamp01(
          (ph.yq + TUNABLES.detachZone - (ph.v + ph.rideLen)) /
            TUNABLES.detachZone,
        )
        below += 1 - ph.detachP
      }

      let topK = 0,
        botK = 0
      for (let wi = 0; wi < phases.length; wi++) {
        if (phases[wi].flipP > topK) topK = phases[wi].flipP
        if (wi > 0) {
          const q = 1 - phases[wi].detachP
          if (q > botK) botK = q
        }
      }
      if (topPool)
        topPool.style.opacity = String((TUNABLES.poolAlpha * topK).toFixed(3))
      if (bottomPool)
        bottomPool.style.opacity = String(
          (TUNABLES.poolAlpha * botK).toFixed(3),
        )

      railOccupancySpans.length = 0
      let stackedCount = 0
      let flipShift = 0
      for (let i = 0; i < phases.length; i++) {
        if (phases[i].flipP >= 1) stackedCount++
        else if (phases[i].flipP > 0) flipShift += phases[i].flipP
      }

      const horizPose = (
        m: LabelMetric,
        i: number,
        yLine: number,
        s: number,
        alpha: number,
      ): LetterPose => {
        const along = (m.cum[i] + m.adv[i] / 2) * hp * s;
        const inward =
          TUNABLES.railW + TUNABLES.textPad + (m.total * hp * s - along);
        return { x: vw - inward, y: yLine, rot: 0, scale: s, alpha };
      };

      const ridePose = (
        m: LabelMetric,
        i: number,
        top: number,
      ): LetterPose => ({
        x: railCenterX,
        y: top + (m.total - m.cum[i] - m.adv[i] / 2) * hp * rs,
        rot: -90,
        scale: rs,
        alpha: TUNABLES.queueAlpha,
      });

      for (let wi = 0; wi < measured.length; wi++) {
        const s = measured[wi];
        const m = metrics[s.label];
        const letters = wordLetters[wi];
        const hit = wordHits[wi];
        if (!m || !letters) continue;

        const { v, rideLen, flipP, detachP, yq } = phases[wi];
        const n = m.adv.length;

        let p: number;
        let from: (i: number) => LetterPose;
        let to: (i: number) => LetterPose;
        let reverseStagger = false;
        if (flipP > 0) {
          p = flipP
          reverseStagger = true
          from = (i) => ridePose(m, i, v)
          if (flipP >= 1) {
            const demote = wi === stackedCount - 1 ? flipShift : 1
            const y =
              yTopLine +
              wi * TUNABLES.queueSlot +
              TUNABLES.currentGap * (1 - demote)
            const scale = 1 - (1 - qs) * demote
            const alpha = 1 - (1 - TUNABLES.queueAlpha) * demote
            to = (i) => horizPose(m, i, y, scale, alpha)
          } else {
            to = (i) =>
              horizPose(
                m,
                i,
                yTopLine + wi * TUNABLES.queueSlot + TUNABLES.currentGap,
                1,
                1,
              )
          }
        } else if (detachP < 1) {
          p = detachP
          reverseStagger = true
          const vForm = yq - rideLen
          to = (i) => ridePose(m, i, vForm)
          from = (i) => horizPose(m, i, yq, qs, TUNABLES.queueAlpha)
        } else {
          p = 1
          from = to = (i) => ridePose(m, i, v)
        }

        const sf = TUNABLES.stagger
        const span = 1 + (n - 1) * sf
        const mapY = map.base + (s.anchor / docH) * map.span

        hoverK[wi] +=
          ((hoverWi === wi ? 1 : 0) - hoverK[wi]) * (1 - Math.exp(-dt / 0.08))
        const hk = hoverK[wi]

        let minX = Infinity,
          maxX = -Infinity,
          minY = Infinity,
          maxY = -Infinity
        let maxAlpha = 0

        for (let i = 0; i < n; i++) {
          const el = letters[i]
          if (!el) continue
          const si = reverseStagger ? n - 1 - i : i
          const pi = clamp01(p * span - si * sf)
          const e = easeInOutCubic(pi)

          const a = from(i)
          const b = to(i)
          const cx = (a.x + b.x) / 2 - TUNABLES.arc
          const cy = (a.y + b.y) / 2
          const u = 1 - e
          let x = u * u * a.x + 2 * u * e * cx + e * e * b.x
          let y = u * u * a.y + 2 * u * e * cy + e * e * b.y
          let rot = a.rot + (b.rot - a.rot) * e
          let scale = a.scale + (b.scale - a.scale) * e
          let alpha = a.alpha + (b.alpha - a.alpha) * e

          if (zoomE > 0) {
            const mp = horizPose(m, i, mapY, qs, TUNABLES.mapAlpha)
            x += (mp.x - x) * zoomE
            y += (mp.y - y) * zoomE
            rot *= 1 - zoomE
            scale += (mp.scale - scale) * zoomE
            alpha += (mp.alpha - alpha) * zoomE
          }

          el.style.transform = `translate3d(${x.toFixed(
            2,
          )}px, ${y.toFixed(2)}px, 0) translate(-50%, -50%) rotate(${rot.toFixed(
            2,
          )}deg) scale(${scale.toFixed(3)})`
          const aEff = alpha + (1 - alpha) * hk
          el.style.opacity = aEff < 0.02 ? "0" : "1"
          if (aEff >= 0.995) {
            el.style.color = "var(--fg)"
          } else {
            el.style.color = `color-mix(in srgb, var(--fg) ${(
              clamp01(aEff) * 100
            ).toFixed(1)}%, var(--bg))`
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
          railOccupancySpans.push({ top: v, bottom: v + rideLen, k: onRail })
        }

        if (hit && isFinite(minX)) {
          hit.style.left = `${minX - 2}px`
          hit.style.top = `${minY - 2}px`
          hit.style.width = `${maxX - minX + 4}px`
          hit.style.height = `${maxY - minY + 4}px`
          hit.style.pointerEvents = maxAlpha > 0.05 ? "auto" : "none"
        }
      }

      let activeSecIdx = 0
      for (let i = 0; i < phases.length; i++) {
        if (phases[i].flipP >= 0.5) activeSecIdx = i
      }
      if (onActiveSectionChange && RULER_SECTIONS[activeSecIdx]) {
        onActiveSectionChange(RULER_SECTIONS[activeSecIdx].id)
      }
    }

    const animId = requestAnimationFrame(step)

    const onResize = () => {
      updatePoolSizes()
      rebuildTicks(document.documentElement.scrollHeight)
    }
    window.addEventListener("resize", onResize)

    return () => {
      isRunning = false
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", onResize)
      hitEl.removeEventListener("pointerenter", onPointerEnterHit)
      hitEl.removeEventListener("pointerleave", onPointerLeaveHit)
      hitEl.removeEventListener("pointermove", onPointerMoveHit)
      hitEl.removeEventListener("pointerdown", onPointerDownHit)
      hitEl.removeEventListener("pointerup", onPointerEnd)
      hitEl.removeEventListener("pointercancel", onPointerEnd)
    }
  }, [lenisRef, onActiveSectionChange])

  return (
    <div ref={containerRef}>
      <div id="bar" />
      <div id="topPool" aria-hidden="true" />
      <div id="bottomPool" aria-hidden="true" />
      <div id="headingFlow" aria-hidden="true" />
      <div id="headingHits" />
      <aside
        id="ruler"
        role="scrollbar"
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
        aria-label="Page position"
      >
        <div id="frost" aria-hidden="true" />
        <div id="rulerTrack" aria-hidden="true" />
        <div id="bracket" aria-hidden="true">
          <div className="bracket-fill" />
          <span className="bracket-edge top" />
          <span className="bracket-edge bottom" />
        </div>
        <div id="ghostLine" aria-hidden="true" />
        <div id="needle" aria-hidden="true">
          <span className="needle-line" />
          <span id="readout">
            <span className="ruler-digits">
              <span className="ruler-digit-col">
                <span>0</span>
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6</span>
                <span>7</span>
                <span>8</span>
                <span>9</span>
              </span>
              <span className="ruler-digit-col">
                <span>0</span>
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6</span>
                <span>7</span>
                <span>8</span>
                <span>9</span>
              </span>
              <span className="ruler-digit-col">
                <span>0</span>
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6</span>
                <span>7</span>
                <span>8</span>
                <span>9</span>
              </span>
            </span>
            <span className="pct-sign">%</span>
          </span>
        </div>
        <div id="hit" />
      </aside>
    </div>
  )
}
