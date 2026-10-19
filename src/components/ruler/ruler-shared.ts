// Shared constants, types, and math for the scroll ruler and heading flow — 1:1 with artcraft-services

export const NAV_H = 52

export type RulerMode = "full" | "static"
export type RulerSide = "left" | "right"

export interface MeasuredSection {
  id: string
  label: string
  index: number
  anchor: number
  bottom: number
  isHero: boolean
}

export const rulerZoom = {
  target: 0,
  p: 0,
  dragging: false,
}

export interface RailOccupancySpan {
  top: number
  bottom: number
  k: number
}

export const railOccupancy: {
  spans: RailOccupancySpan[]
} = {
  spans: [],
}

export function rulerMap(vh: number, pad: number) {
  const base = NAV_H + pad
  return {
    base,
    span: Math.max(1, vh - NAV_H - 2 * pad),
    drift: (p: number) => base - p * (NAV_H + 2 * pad),
  }
}

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x))

export const easeOutExpo = (t: number) =>
  t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)

export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
