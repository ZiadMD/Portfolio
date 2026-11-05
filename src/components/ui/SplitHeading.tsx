"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { formElements } from "../intro/handover"

/** A heading segment: plain words, or words set in the accent `<em>`. */
export type HeadingPart = string | { em: string }

interface SplitHeadingProps {
  parts: HeadingPart[]
  as?: "h2" | "h3"
  className?: string
}

/**
 * Renders a heading with each word wrapped for the staggered reveal,
 * in JSX rather than by rewriting innerHTML after React has rendered.
 *
 * The first time it scrolls into view, its letters also form out of red
 * glyph noise (the same effect the hero text forms with after the intro),
 * while the words slide up.
 */
export default function SplitHeading({
  parts,
  as: Tag = "h2",
  className,
}: SplitHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return
    let stop: (() => void) | null = null
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        io.disconnect()
        // Hold each word at its real width so the noise glyphs, which are
        // wider or narrower than the letters, never reflow the heading.
        const words = [...el.querySelectorAll<HTMLElement>(".w")]
        words.forEach((w) => (w.style.width = `${w.offsetWidth}px`))
        stop = formElements([{ el, start: 0.1, duration: 1.1 }], () =>
          words.forEach((w) => (w.style.width = "")),
        )
      },
      // Same moment the words start sliding up (see lib/use-reveal.ts).
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      stop?.()
    }
  }, [])

  let i = 0
  const words = (text: string) =>
    text
      .split(/(\s+)/)
      .filter(Boolean)
      .map((w, k) =>
        /^\s+$/.test(w) ? (
          " "
        ) : (
          <span className="w" key={k}>
            <i style={{ "--i": i++ } as React.CSSProperties}>{w}</i>
          </span>
        ),
      )

  const out: ReactNode[] = parts.map((p, k) =>
    typeof p === "string" ? (
      <span key={k}>{words(p)}</span>
    ) : (
      <em key={k}>{words(p.em)}</em>
    ),
  )

  return (
    <Tag ref={ref} className={["split", className].filter(Boolean).join(" ")}>
      {out}
    </Tag>
  )
}
