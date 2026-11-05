"use client"

/*
 * An image that loads in ASCII (ascii-reveal). It stays hidden until it
 * scrolls into view, then decodes into place through a character grid. If
 * it is still downloading by then, a glyph shimmer runs where it will land
 * until it arrives. The wrapper takes `className`, so size and place the
 * wrapper; the image fills it.
 *
 * The reveal is started here rather than by the library's own lazy mode,
 * which only defers wrappers with several children: around one image it
 * would play at once, off screen (and behind the intro).
 */

import { useEffect, useRef, useState } from "react"
import { AsciiReveal, type AsciiRevealHandle } from "ascii-reveal"

interface AsciiImgProps {
  src: string
  alt?: string
  className?: string
  imgClassName?: string
}

export default function AsciiImg({
  src,
  alt = "",
  className,
  imgClassName,
}: AsciiImgProps) {
  const revealRef = useRef<AsciiRevealHandle>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  // In view but not downloaded yet: the library shows its shimmer.
  const [waiting, setWaiting] = useState(false)

  useEffect(() => {
    const handle = revealRef.current
    const wrap = handle?.element
    const img = imgRef.current
    if (!handle || !wrap || !img) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let alive = true
    handle.hide({ instant: true })
    const ready = () => img.complete && img.naturalWidth > 0
    const onArrive = () => alive && setWaiting(false) // decodes in

    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        if (ready()) {
          handle.reveal()
          return
        }
        setWaiting(true)
        img.addEventListener("load", onArrive, { once: true })
        img.addEventListener("error", onArrive, { once: true })
      },
      { threshold: 0.25 },
    )
    io.observe(wrap)
    return () => {
      alive = false
      io.disconnect()
      img.removeEventListener("load", onArrive)
      img.removeEventListener("error", onArrive)
    }
  }, [src])

  return (
    <AsciiReveal
      ref={revealRef}
      as="span"
      className={["ascii-img", className].filter(Boolean).join(" ")}
      loading={waiting}
      revealOnMount={false}
      preset="decode"
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={imgClassName}
        loading="lazy"
        decoding="async"
      />
    </AsciiReveal>
  )
}
