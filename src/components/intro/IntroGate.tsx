"use client"

/*
 * IntroGate: plays the ASCII portrait intro (AsciiIntro + introEngine) as a
 * full-screen layer above the site, then hands over to the hero.
 *
 * - The pre-paint script in app/layout.tsx puts the page into the intro
 *   screen (html[data-intro-state="playing"]) before first paint: the nav,
 *   ruler and chrome are hidden and scrolling is locked. The gate's black
 *   layer is only visible in that state (see globals.css, "ASCII intro"),
 *   so nothing of the site flashes before the intro mounts.
 * - The intro's last frame uses the hero's framing (framing.ts), and the
 *   hero draws the same ASCII portrait with the same engine, picking up its
 *   clock where the intro ends. So the intro ends on the hero itself.
 * - Handover (see handover.ts): when the intro finishes or is skipped, its
 *   last ASCII frame is frozen and dissolves cell by cell outwards from the
 *   eye onto the live hero portrait, while the hero's text (name, nav,
 *   status line, marquee) forms out of red glyph noise. The page is in
 *   html[data-intro-state="handover"] meanwhile: chrome visible, scrolling
 *   still locked. Then the state clears and scrolling unlocks.
 * - If the intro fails (e.g. the photo does not load), the layer just fades
 *   out (~600ms) and the page unlocks.
 * - It plays on every visit. The hero's "Replay intro" button dispatches
 *   INTRO_REPLAY_EVENT to play it again.
 * - Reduced motion: the pre-paint script never sets the state; no intro.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import AsciiIntro from "./AsciiIntro"
import { lenisRef } from "../../lib/lenis-ref"
import { dissolveFrame, formText } from "./handover"
import {
  DESKTOP,
  MOBILE,
  MOBILE_QUERY,
  eyeOnScreen,
  framingFor,
  type Framing,
  type Photo,
} from "./framing"

export const INTRO_REPLAY_EVENT = "zs:intro-replay"

/** Must match the layer's opacity transition in globals.css (error path). */
const FADE_MS = 600

/** The intro's final framing: the hero's portrait, on the full viewport. */
function introFraming(photo: Photo, mobile: boolean): Framing {
  const hero = document.getElementById("hero")
  const vh = window.innerHeight
  const heroH = hero ? hero.getBoundingClientRect().height : vh
  return framingFor(photo, mobile, window.innerWidth, vh, heroH)
}

/** Seconds for the intro's last frame to dissolve into the hero. */
const DISSOLVE_S = 1.4

/** The hero text that forms out of glyphs, in order of appearance. */
// Each element starts forming just before the dissolve uncovers it; `delay`
// shifts that moment (negative = earlier).
const FORM_GROUPS = [
  { selector: "#hero .cap h1", delay: -0.15, duration: 1.0 },
  { selector: "#hero .hud", delay: -0.1, duration: 0.7 },
  { selector: ".nav .nl a, .nav .cv, .nav .menu-btn", delay: -0.1, duration: 0.6 },
  { selector: "#replay .lbl-replay", delay: -0.05, duration: 0.5 },
  { selector: ".mqh span", delay: -0.1, duration: 0.6 },
]

export default function IntroGate() {
  // `run` remounts the intro on replay; null = no intro mounted.
  const [run, setRun] = useState<number | null>(null)
  const [framing, setFraming] = useState<{ d: Framing; m: Framing } | null>(
    null,
  )
  const [debugTime, setDebugTime] = useState<number | undefined>(undefined)
  // Whether an intro is on screen. A ref, so it survives React's dev
  // StrictMode remount (whose cleanup clears the html intro state).
  const activeRef = useRef<boolean | null>(null)
  const failedRef = useRef(false)
  const dissolveRef = useRef<HTMLCanvasElement>(null)
  // Running handover effects, and a token so a cancelled one is ignored.
  const handoverRef = useRef<{ token: number; cancel: () => void }>({
    token: 0,
    cancel: () => {},
  })

  const measure = useCallback(() => {
    setFraming({
      d: introFraming(DESKTOP, false),
      m: introFraming(MOBILE, true),
    })
  }, [])

  const lockPage = useCallback((on: boolean) => {
    const root = document.documentElement
    if (on) {
      root.dataset.introState = "playing"
      window.scrollTo(0, 0)
      lenisRef.current?.stop()
    } else {
      delete root.dataset.introState
      lenisRef.current?.start()
    }
  }, [])

  /** Stop a running handover and restore the page text. */
  const stopHandover = useCallback(() => {
    handoverRef.current.token++
    handoverRef.current.cancel()
    handoverRef.current.cancel = () => {}
  }, [])

  // First visit of this page load: play if the pre-paint script put the
  // page into the intro screen (it does not under reduced motion).
  useEffect(() => {
    const root = document.documentElement
    // Tell the pre-paint failsafe that the intro has taken over.
    root.classList.add("intro-live")
    measure()

    // Dev-only harness: ?t=9.5 renders that second as a still frame.
    if (process.env.NODE_ENV !== "production") {
      const t = new URLSearchParams(location.search).get("t")
      if (t !== null && !Number.isNaN(parseFloat(t))) {
        setDebugTime(parseFloat(t))
        lockPage(true)
      }
    }

    // First mount: play if the pre-paint script started the intro screen.
    if (activeRef.current === null) {
      activeRef.current = root.dataset.introState === "playing"
    }
    if (activeRef.current) {
      lockPage(true)
      setRun((n) => n ?? 1)
    }

    const onReplay = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      stopHandover()
      failedRef.current = false
      measure()
      activeRef.current = true
      lockPage(true)
      setRun((n) => (n ?? 0) + 1)
    }
    window.addEventListener(INTRO_REPLAY_EVENT, onReplay)

    // Keep the end framing on the hero photo if the screen changes.
    let rt = 0
    const onResize = () => {
      window.clearTimeout(rt)
      rt = window.setTimeout(measure, 150)
    }
    window.addEventListener("resize", onResize)

    return () => {
      window.removeEventListener(INTRO_REPLAY_EVENT, onReplay)
      window.removeEventListener("resize", onResize)
      window.clearTimeout(rt)
      stopHandover()
      // Never leave the page locked behind the intro.
      delete root.dataset.introState
    }
  }, [lockPage, measure, stopHandover])

  // Handover: dissolve the last frame into the hero while its text forms,
  // then unlock the page. The intro itself is unmounted straight away.
  const onFinish = useCallback(() => {
    if (debugTime !== undefined) return
    activeRef.current = false
    const finished = run
    const unmount = () => setRun((cur) => (cur === finished ? null : cur))

    const source = document.querySelector<HTMLCanvasElement>(".intro-gate canvas")
    const target = dissolveRef.current
    if (failedRef.current || !source || !target || !framing) {
      // Nothing to dissolve: fade the layer out.
      lockPage(false)
      window.setTimeout(unmount, FADE_MS + 50)
      return
    }

    const mobile = window.matchMedia(MOBILE_QUERY).matches
    const eye = eyeOnScreen(
      mobile ? MOBILE : DESKTOP,
      mobile ? framing.m : framing.d,
      window.innerWidth,
      window.innerHeight,
    )
    const token = ++handoverRef.current.token
    document.documentElement.dataset.introState = "handover"
    const dissolve = dissolveFrame(source, target, {
      eyeX: eye.x,
      eyeY: eye.y,
      duration: DISSOLVE_S,
      onDone: () => {
        if (handoverRef.current.token !== token) return
        lockPage(false)
      },
    })
    const stopText = formText(FORM_GROUPS, (el) => {
      const r = el.getBoundingClientRect()
      return Math.max(0, dissolve.timeAt(r.left + r.width / 2, r.top + r.height / 2))
    })
    handoverRef.current.cancel = () => {
      dissolve.cancel()
      stopText()
    }
    unmount()
  }, [debugTime, framing, lockPage, run])

  const variants = useMemo(
    () =>
      framing
        ? [{ media: MOBILE_QUERY, src: MOBILE.src, eye: MOBILE.eye, ...framing.m }]
        : undefined,
    [framing],
  )

  return (
    <>
      <div className="intro-gate" aria-hidden={run === null}>
        {run !== null && framing && (
          <AsciiIntro
            key={run}
            src={DESKTOP.src}
            eye={DESKTOP.eye}
            {...framing.d}
            variants={variants}
            audioSrc={debugTime === undefined ? "/intro.mp3" : undefined}
            debugTime={debugTime}
            onError={() => (failedRef.current = true)}
            onFinish={onFinish}
          />
        )}
      </div>
      <canvas className="intro-dissolve" ref={dissolveRef} aria-hidden="true" />
    </>
  )
}
