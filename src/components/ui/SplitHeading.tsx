import type { ReactNode } from "react"

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
 */
export default function SplitHeading({
  parts,
  as: Tag = "h2",
  className,
}: SplitHeadingProps) {
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
    <Tag className={["split", className].filter(Boolean).join(" ")}>{out}</Tag>
  )
}
