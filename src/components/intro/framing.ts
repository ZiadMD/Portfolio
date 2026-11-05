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
 * Phones frame the face closer than a whole-photo fit: at that size the
 * face is only ~25 characters wide. 1 = whole photo.
 */
const MOBILE_END_ZOOM = 1.8

/**
 * The portrait's box on a W x H hero (css px). Desktop: bottom-anchored,
 * up to 82% of the height, the face slightly left of centre so the name
 * reads beside it. Phone: centred, above the marquee.
 */
export function heroPhotoRect(W: number, H: number, mobile: boolean, ia: number) {
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
 * introEngine framing (endZoom / endCenterX / endCenterY) for a canvas of
 * vw x vh css px laid over the top of a hero of height heroH. In the
 * engine, zoom 1 fits the whole photo in the canvas, and endCenter is the
 * photo point that ends at the canvas centre.
 * - Desktop: the photo fills heroPhotoRect.
 * - Phone: closer (MOBILE_END_ZOOM), eyes at the height heroPhotoRect puts
 *   them.
 */
export function framingFor(
  photo: Photo,
  mobile: boolean,
  vw: number,
  vh: number,
  heroH = vh,
): Framing {
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

/** Where the photo's eye sits (css px) on a vw x vh canvas with framing f. */
export function eyeOnScreen(photo: Photo, f: Framing, vw: number, vh: number) {
  const s = Math.min(vh / photo.h, vw / photo.w) * f.endZoom
  return {
    x: vw / 2 + (photo.eye[0] - f.endCenterX) * photo.w * s,
    y: vh / 2 + (photo.eye[1] - f.endCenterY) * photo.h * s,
  }
}
