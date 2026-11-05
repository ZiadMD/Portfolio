// Types for AsciiIntro.jsx (see the prop docs at the top of that file).
import type { CSSProperties, JSX } from "react"

export interface AsciiIntroFraming {
  src?: string
  eye?: number[]
  endZoom?: number
  endCenterX?: number
  endCenterY?: number
  invert?: boolean | "auto"
}

export interface AsciiIntroVariant extends AsciiIntroFraming {
  media: string
}

export interface AsciiIntroProps extends AsciiIntroFraming {
  src: string
  variants?: AsciiIntroVariant[]
  audioSrc?: string
  onFinish?: () => void
  onError?: (err: unknown) => void
  skippable?: boolean
  debugTime?: number
  fadeOut?: boolean
  maxCells?: number
  startLabel?: string
  silentLabel?: string
  className?: string
  style?: CSSProperties
}

export default function AsciiIntro(props: AsciiIntroProps): JSX.Element
