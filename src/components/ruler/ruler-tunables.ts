// Tunables for Ruler layout, motion, and look — 1:1 with artcraft-services

export interface RulerLayout {
  side: number // 0=left, 1=right
  edgePad: number
  railW: number
  minorPct: number
  labelPct: number
  thresholdPct: number
  headingPx: number
  ridingPx: number
  queuePx: number
  topPad: number
  currentGap: number
  queueSlot: number
  queuePad: number
  textPad: number
}

export interface RulerMotion {
  flipZone: number
  detachZone: number
  stagger: number
  arc: number
  jumpDur: number
  snapDelay: number
  snapDur: number
  introDur: number
  introStagger: number
  velRadius: number
  velMax: number
  zoomInDelay: number
  zoomOutDelay: number
  zoomLerp: number
  dragLerp: number
  heroLead: number
  heroZone: number
}

export interface RulerLook {
  minorAlpha: number
  majorAlpha: number
  labelAlpha: number
  minorLen: number
  majorLen: number
  ghostAlpha: number
  ghostThick: number
  queueAlpha: number
  yieldPad: number
  needleFadePct: number
  bracketAlpha: number
  mapAlpha: number
  poolAlpha: number
  frostSolid: number
  frostGamma: number
  poolPad: number
}

const DEFAULT_LAYOUT: RulerLayout = {
  side: 1, // right side
  edgePad: 12,
  railW: 60,
  minorPct: 1,
  labelPct: 5,
  thresholdPct: 12,
  headingPx: 32,
  ridingPx: 20,
  queuePx: 16,
  topPad: 28,
  currentGap: 26,
  queueSlot: 20,
  queuePad: 36,
  textPad: 0,
}

const DEFAULT_MOTION: RulerMotion = {
  flipZone: 200,
  detachZone: 240,
  stagger: 0.16,
  arc: 28,
  jumpDur: 1.25,
  snapDelay: 350,
  snapDur: 0.6,
  introDur: 1.0,
  introStagger: 0.01,
  velRadius: 180,
  velMax: 0.6,
  zoomInDelay: 150,
  zoomOutDelay: 150,
  zoomLerp: 10,
  dragLerp: 0.18,
  heroLead: 100,
  heroZone: 320,
}

const DEFAULT_LOOK: RulerLook = {
  minorAlpha: 0.4,
  majorAlpha: 0.8,
  labelAlpha: 0.5,
  minorLen: 10,
  majorLen: 20,
  ghostAlpha: 1.0,
  ghostThick: 2,
  queueAlpha: 0.35,
  yieldPad: 24,
  needleFadePct: 3,
  bracketAlpha: 0.1,
  mapAlpha: 0.85,
  poolAlpha: 1.0,
  frostSolid: 40,
  frostGamma: 2.2,
  poolPad: 64,
}

export const rulerLayoutTuner = {
  read: (): RulerLayout => DEFAULT_LAYOUT,
}

export const rulerMotionTuner = {
  read: (): RulerMotion => DEFAULT_MOTION,
}

export const rulerLookTuner = {
  read: (): RulerLook => DEFAULT_LOOK,
}
