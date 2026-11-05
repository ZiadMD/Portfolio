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
 * - When the intro finishes (or is skipped, or fails), the state is cleared:
 *   the layer fades out over ~600ms onto the hero, the chrome fades in, and
 *   scrolling is unlocked. The intro is unmounted after the fade.
 * - The intro's last frame is framed to sit exactly where the hero photo is
 *   drawn (heroPhotoRect mirrors Hero.tsx buildPhoto), so the fade lands on
 *   the same portrait.
 * - It plays on every visit. The hero's "Replay intro" button dispatches
 *   INTRO_REPLAY_EVENT to play it again.
 * - Reduced motion: the pre-paint script never sets the state; no intro.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import AsciiIntro from "./AsciiIntro"
import { DESKTOP_PHOTO_SRC, MOBILE_PHOTO_SRC } from "../../data/photoSrc"
import { lenisRef } from "../../lib/lenis-ref"

export const INTRO_REPLAY_EVENT = "zs:intro-replay"

/** Must match the layer's opacity transition in globals.css. */
const FADE_MS = 600
const MOBILE_QUERY = "(max-width: 767.98px)" // Hero.tsx switches at 768px

/** Natural size and eye position (between the eyes, 0..1) of each photo. */
const DESKTOP = { src: DESKTOP_PHOTO_SRC, w: 2752, h: 1536, eye: [0.5, 0.355] }
const MOBILE = { src: MOBILE_PHOTO_SRC, w: 928, h: 1152, eye: [0.5, 0.32] }

type Photo = typeof DESKTOP
type Framing = { endZoom: number; endCenterX: number; endCenterY: number }

/**
 * Where Hero.tsx draws the photo (css px, relative to the hero's top-left).
 * Mirrors the sizing in Hero.tsx buildPhoto(); keep the two in step.
 */
function heroPhotoRect(W: number, H: number, mobile: boolean, ia: number) {
  let hh: number
  let x: number
  let y: number
  if (mobile) {
    const maxVisibleW = Math.min(W * 0.86, 380)
    const maxVisibleH = H * 0.65
    const targetVisibleH = Math.min(maxVisibleW / 0.843, maxVisibleH)
    hh = targetVisibleH / 0.9514
    x = W / 2 - (hh * ia) / 2
    y = H - 38 - hh
  } else {
    const targetVisibleH = Math.min(H * 0.82, 820)
    const maxVisibleW = W * 0.78
    const visibleW = targetVisibleH * 1.077
    const effectiveVisibleH =
      visibleW > maxVisibleW ? maxVisibleW / 1.077 : targetVisibleH
    hh = effectiveVisibleH / 0.9505
    x = W / 2 - hh * ia * (1414 / 2752)
    y = H - hh
  }
  return { x, y, w: hh * ia, h: hh }
}

/**
 * Phones end closer than the hero photo: at the hero's size the face is only
 * ~25 characters wide. 1 = whole photo; the handover suggests 1.5 to 2.0.
 */
const MOBILE_END_ZOOM = 1.8

/**
 * The intro's final framing (endZoom / endCenterX / endCenterY). In the
 * engine, zoom 1 fits the whole photo in the viewport, and endCenter is the
 * photo point that ends at screen centre.
 * - Desktop: the photo lands exactly on the hero photo, so the fade is
 *   seamless.
 * - Phone: closer (MOBILE_END_ZOOM), with the eyes at the same height as
 *   the hero photo's eyes.
 */
function framingFor(photo: Photo, mobile: boolean): Framing {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const hero = document.getElementById("hero")
  const heroH = hero ? hero.getBoundingClientRect().height : vh
  const r = heroPhotoRect(vw, heroH, mobile, photo.w / photo.h)
  const fit = Math.min(vh / photo.h, vw / photo.w)
  if (mobile) {
    const dh = photo.h * fit * MOBILE_END_ZOOM
    const heroEyeY = r.y + photo.eye[1] * r.h
    return {
      endZoom: MOBILE_END_ZOOM,
      endCenterX: photo.eye[0],
      endCenterY: photo.eye[1] - (heroEyeY - vh / 2) / dh,
    }
  }
  return {
    endZoom: r.h / (photo.h * fit),
    endCenterX: (vw / 2 - r.x) / r.w,
    endCenterY: (vh / 2 - r.y) / r.h,
  }
}

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

  const measure = useCallback(() => {
    setFraming({
      d: framingFor(DESKTOP, false),
      m: framingFor(MOBILE, true),
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
      // Never leave the page locked behind the intro.
      delete root.dataset.introState
    }
  }, [lockPage, measure])

  // Handover: fade onto the hero, unlock the page, then unmount the intro.
  const onFinish = useCallback(() => {
    if (debugTime !== undefined) return
    activeRef.current = false
    lockPage(false)
    const finished = run
    window.setTimeout(() => {
      // Unmount only if no replay started during the fade.
      setRun((cur) => (cur === finished ? null : cur))
    }, FADE_MS + 50)
  }, [debugTime, lockPage, run])

  const variants = useMemo(
    () =>
      framing
        ? [{ media: MOBILE_QUERY, src: MOBILE.src, eye: MOBILE.eye, ...framing.m }]
        : undefined,
    [framing],
  )

  return (
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
          onFinish={onFinish}
        />
      )}
    </div>
  )
}
