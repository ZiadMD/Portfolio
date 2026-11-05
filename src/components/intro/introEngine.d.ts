// Types for introEngine.js (see the comments in that file).

export const TIMELINE: {
  nodesIn: number[]
  links: number[]
  morph: number
  talk: number
  glitch: number[]
  escape: number[]
  portrait: number
  portraitLen: number
}
export const TOTAL: number

export interface IntroEngineOptions {
  eye?: number[]
  fontFamily?: string
  fadeOut?: boolean
  endZoom?: number
  endCenterX?: number
  endCenterY?: number
  invert?: boolean | "auto"
  maxImageSide?: number
  minCell?: number
  rowsForHeight?: number
  maxCells?: number
  /** Radius (css px) of the setPointer lens. */
  pointerRadius?: number
}

export interface IntroEngine {
  renderAt(t: number): void
  resize(): void
  /** Cursor position in css px over the canvas, or null when it leaves. */
  setPointer(x: number | null, y?: number): void
  readonly size: { cols: number; rows: number; W: number; H: number }
}

export function createIntro(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement | HTMLCanvasElement,
  opts?: IntroEngineOptions,
): IntroEngine
