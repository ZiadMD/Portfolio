/*
 * Where the ASCII portrait sits, shared by the intro (IntroGate) and the
 * hero (Hero.tsx), which both render it with introEngine. The intro's last
 * frame uses the same framing as the hero, so the handover lands on it.
 */

import { DESKTOP_PHOTO_SRC, MOBILE_PHOTO_SRC } from "../../data/photoSrc"

export const MOBILE_QUERY = "(max-width: 767.98px)" // phones: below 768px

/** Natural size and eye position (between the eyes, 0..1) of each photo. */
export const DESKTOP = { src: DESKTOP_PHOTO_SRC, w: 2752, h: 1536, eye: [0.5, 0.355] }
export const MOBILE = { src: MOBILE_PHOTO_SRC, w: 928, h: 1152, eye: [0.5, 0.32] }

export type Photo = typeof DESKTOP
export type Framing = { endZoom: number; endCenterX: number; endCenterY: number }

/**
 * Phones: how close the portrait is (1 = the photo fills the screen width)
 * and how far down the hero the eyes sit (0 = top, 1 = bottom). 1.45 / 0.3
 * shows head, shoulders and chest above the name.
 */
const MOBILE_END_ZOOM = 1.45
const MOBILE_EYE_Y = 0.3

/**
 * The desktop portrait's box on a W x H hero (css px): bottom-anchored, up
 * to 82% of the height, the face slightly left of centre so the name reads
 * beside it.
 */
export function heroPhotoRect(W: number, H: number, ia: number) {
  const targetVisibleH = Math.min(H * 0.82, 820)
  const maxVisibleW = W * 0.78
  const visibleW = targetVisibleH * 1.077
  const effectiveVisibleH =
    visibleW > maxVisibleW ? maxVisibleW / 1.077 : targetVisibleH
  const hh = effectiveVisibleH / 0.9505
  const x = W / 2 - hh * ia * (1414 / 2752)
  return { x, y: H - hh, w: hh * ia, h: hh }
}

/**
 * introEngine framing (endZoom / endCenterX / endCenterY) for a canvas of
 * vw x vh css px laid over the top of a hero of height heroH. In the
 * engine, zoom 1 fits the whole photo in the canvas, and endCenter is the
 * photo point that ends at the canvas centre.
 * - Desktop: the photo fills heroPhotoRect.
 * - Phone: MOBILE_END_ZOOM, centred, eyes MOBILE_EYE_Y down the hero.
 */
export function framingFor(
  photo: Photo,
  mobile: boolean,
  vw: number,
  vh: number,
  heroH = vh,
): Framing {
  const fit = Math.min(vh / photo.h, vw / photo.w)
  if (mobile) {
    const dh = photo.h * fit * MOBILE_END_ZOOM
    return {
      endZoom: MOBILE_END_ZOOM,
      endCenterX: photo.eye[0],
      endCenterY: photo.eye[1] - (heroH * MOBILE_EYE_Y - vh / 2) / dh,
    }
  }
  const r = heroPhotoRect(vw, heroH, photo.w / photo.h)
  return {
    endZoom: r.h / (photo.h * fit),
    endCenterX: (vw / 2 - r.x) / r.w,
    endCenterY: (vh / 2 - r.y) / r.h,
  }
}

/** Where the photo's eye sits (css px) on a vw x vh canvas with framing f. */
export function eyeOnScreen(photo: Photo, f: Framing, vw: number, vh: number) {
  const s = Math.min(vh / photo.h, vw / photo.w) * f.endZoom
  return {
    x: vw / 2 + (photo.eye[0] - f.endCenterX) * photo.w * s,
    y: vh / 2 + (photo.eye[1] - f.endCenterY) * photo.h * s,
  }
}
