/**
 * Intro → hero handover effects (dependency-free).
 *
 * dissolveFrame: the intro's last ASCII frame is frozen onto a canvas above
 *   the site and cleared cell by cell, outwards from the eye (the same way
 *   the portrait spread in), behind a flickering front of red glyphs. The
 *   hero shows through the holes.
 * formText: the hero's text (name, nav, status line, marquee...) starts as
 *   red glyph noise and resolves character by character into the real text.
 *
 * Both return a cancel function that restores everything immediately.
 */

const GLYPHS = "0123456789ABCDEFXYZ<>{}[]()/\\|=+*:;#$%&@?!"
const CELL_W = 6 // introEngine glyph cell, in backing pixels
const CELL_H = 12

/** Inverse of smooth(): the x where smooth(x) = y. */
const smoothInv = (y: number) =>
  0.5 - Math.sin(Math.asin(1 - 2 * Math.min(1, Math.max(0, y))) / 3)

const smooth = (x: number) => {
  const q = Math.min(1, Math.max(0, x))
  return q * q * (3 - 2 * q)
}

export interface DissolveOptions {
  /** Eye position in css px (where the dissolve starts). */
  eyeX: number
  eyeY: number
  /** Seconds for the whole dissolve. */
  duration?: number
  onDone?: () => void
}

export interface Dissolve {
  /** Stop now and clear the frame. */
  cancel: () => void
  /** Seconds after the start when the point (css px) is uncovered. */
  timeAt: (x: number, y: number) => number
}

/** Freeze `source` (the intro canvas) onto `target` and dissolve it. */
export function dissolveFrame(
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  opts: DissolveOptions,
): Dissolve {
  const W = source.width
  const H = source.height
  target.width = W
  target.height = H
  const g = target.getContext("2d")
  if (!g || !W || !H) {
    opts.onDone?.()
    return { cancel: () => {}, timeAt: () => 0 }
  }
  g.drawImage(source, 0, 0)
  target.style.visibility = "visible"

  const cols = Math.ceil(W / CELL_W)
  const rows = Math.ceil(H / CELL_H)
  const n = cols * rows
  // Eye in backing pixels (the canvas is stretched to the viewport).
  const sx = W / Math.max(1, target.clientWidth || window.innerWidth)
  const sy = H / Math.max(1, target.clientHeight || window.innerHeight)
  const ex = opts.eyeX * sx
  const ey = opts.eyeY * sy
  const far = Math.max(
    Math.hypot(ex, ey),
    Math.hypot(W - ex, ey),
    Math.hypot(ex, H - ey),
    Math.hypot(W - ex, H - ey),
  )

  // Each cell's moment (0..1): distance from the eye, a ragged edge, noise.
  const NOISE = 0.18
  const when = new Float32Array(n)
  const done = new Uint8Array(n)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dx = (c + 0.5) * CELL_W - ex
      const dy = (r + 0.5) * CELL_H - ey
      const d = Math.hypot(dx, dy) / far
      const ragged = 0.04 * Math.sin(Math.atan2(dy, dx) * 9)
      when[r * cols + c] = Math.min(0.97, d * 0.78 + ragged + Math.random() * NOISE)
    }
  }

  const FRONT = 0.05 // width of the glyph front, in progress units
  const dur = (opts.duration ?? 1.1) * 1000
  g.font = `10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
  g.textBaseline = "top"
  const t0 = performance.now()
  let raf = 0
  let finished = false

  const finish = () => {
    if (finished) return
    finished = true
    cancelAnimationFrame(raf)
    g.clearRect(0, 0, W, H)
    target.style.visibility = "hidden"
    opts.onDone?.()
  }

  const frame = (now: number) => {
    // Ease in: the first cells go slowly, then the wave accelerates out.
    const p = smooth((now - t0) / dur) * (1 + FRONT)
    for (let i = 0; i < n; i++) {
      if (done[i]) continue
      const w = when[i]
      if (w > p) continue
      const x = (i % cols) * CELL_W
      const y = Math.floor(i / cols) * CELL_H
      g.clearRect(x, y, CELL_W, CELL_H)
      if (p - w < FRONT) {
        // On the front: a flickering glyph, hot at the leading edge.
        if (Math.random() < 0.6) {
          const heat = 1 - (p - w) / FRONT
          g.fillStyle =
            heat > 0.7
              ? `rgba(255,205,205,${heat})`
              : `rgba(255,26,36,${0.35 + 0.65 * heat})`
          g.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], x, y + 1)
        }
      } else {
        done[i] = 1
      }
    }
    if (p >= 1 + FRONT) finish()
    else raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)

  const timeAt = (x: number, y: number) => {
    const d = Math.hypot(x * sx - ex, y * sy - ey) / far
    const w = Math.min(0.97, d * 0.78 + NOISE / 2)
    return (dur / 1000) * smoothInv(w / (1 + FRONT))
  }
  return { cancel: finish, timeAt }
}

export interface FormGroup {
  /** CSS selector; every match forms independently. */
  selector: string
  /** Seconds before this group starts (added to `delayAt`, if given). */
  delay: number
  /** Seconds for one element to resolve. */
  duration: number
}

interface Forming {
  el: HTMLElement
  nodes: { node: Text; orig: string; at: Float32Array }[]
  end: number
}

/**
 * Turn the text inside each matched element into glyph noise and resolve it
 * left to right. Live text (e.g. the <time> clock) is left alone.
 */
export function formText(
  groups: FormGroup[],
  /** Per-element start time, e.g. when the dissolve uncovers it. */
  delayAt?: (el: HTMLElement) => number,
  onDone?: () => void,
): () => void {
  const list: FormTarget[] = []
  const seen = new Set<Element>()
  for (const grp of groups) {
    document.querySelectorAll<HTMLElement>(grp.selector).forEach((el, k) => {
      if (seen.has(el) || !el.offsetParent) return
      seen.add(el)
      const start = grp.delay + (delayAt ? delayAt(el) : k * 0.03)
      list.push({ el, start, duration: grp.duration })
    })
  }
  return formElements(list, onDone)
}

export interface FormTarget {
  el: HTMLElement
  /** Seconds from now until it starts resolving. */
  start: number
  /** Seconds to resolve. */
  duration: number
}

/** formText for a given list of elements (see formText). */
export function formElements(
  targets: FormTarget[],
  onDone?: () => void,
): () => void {
  const items: Forming[] = []
  for (const { el, start, duration } of targets) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (t) =>
        t.nodeValue?.trim() && !t.parentElement?.closest("time, script, style")
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT,
    })
    const nodes: Forming["nodes"] = []
    let total = 0
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      total += (t as Text).nodeValue!.length
      nodes.push({ node: t as Text, orig: (t as Text).nodeValue!, at: new Float32Array(0) })
    }
    if (!nodes.length) continue
    // Each character resolves at its moment, roughly left to right.
    let idx = 0
    for (const nd of nodes) {
      nd.at = new Float32Array(nd.orig.length)
      for (let i = 0; i < nd.orig.length; i++, idx++) {
        nd.at[i] =
          start + duration * (0.75 * (idx / Math.max(1, total)) + 0.25 * Math.random())
      }
    }
    items.push({ el, nodes, end: start + duration })
  }

  const t0 = performance.now()
  let raf = 0
  let finished = false
  let last = -1
  for (const it of items) {
    it.el.style.color = "var(--acc)"
    it.el.style.textShadow = "0 0 10px rgba(255, 26, 36, 0.55)"
  }

  const settle = (it: Forming) => {
    for (const nd of it.nodes) nd.node.nodeValue = nd.orig
    // Fade from red into the element's own colour.
    it.el.style.transition = "color 0.45s ease, text-shadow 0.45s ease"
    it.el.style.color = ""
    it.el.style.textShadow = ""
    window.setTimeout(() => (it.el.style.transition = ""), 500)
  }
  const settled = new Set<Forming>()

  const finish = () => {
    if (finished) return
    finished = true
    cancelAnimationFrame(raf)
    for (const it of items) if (!settled.has(it)) settle(it)
    onDone?.()
  }

  const frame = (now: number) => {
    const t = (now - t0) / 1000
    // Swap the noise glyphs ~24 times a second; resolved ones stay put.
    const tick = Math.floor(t * 24)
    const reroll = tick !== last
    last = tick
    let busy = false
    for (const it of items) {
      if (settled.has(it)) continue
      if (t >= it.end) {
        settle(it)
        settled.add(it)
        continue
      }
      busy = true
      if (!reroll) continue
      for (const nd of it.nodes) {
        let s = ""
        for (let i = 0; i < nd.orig.length; i++) {
          const ch = nd.orig[i]
          s +=
            ch === " " || t >= nd.at[i]
              ? ch
              : GLYPHS[(Math.random() * GLYPHS.length) | 0]
        }
        if (nd.node.nodeValue !== s) nd.node.nodeValue = s
      }
    }
    if (busy) raf = requestAnimationFrame(frame)
    else finish()
  }
  // First frame right away, so no real text shows before the noise.
  frame(t0)
  return finish
}
