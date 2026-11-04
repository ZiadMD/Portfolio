import { useEffect, type RefObject } from "react"

/**
 * Adds `.in` once to every `.rv` element and split heading inside `root`
 * when it scrolls into view. Content is visible by default; the hidden
 * starting state only applies under `html.js` (see globals.css), so the
 * page stays readable if scripts fail.
 */
export function useReveal(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current
    if (!el) return

    const targets = el.querySelectorAll<HTMLElement>(".rv, .split")
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.classList.add("in")
          io.unobserve(e.target)
        })
      },
      { threshold: 0.15 },
    )
    targets.forEach((t) => io.observe(t))
    return () => io.disconnect()
  }, [root])
}
