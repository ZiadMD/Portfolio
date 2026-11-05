"use client"

import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { motion, AnimatePresence, useDragControls } from "motion/react"
import Lenis from "lenis"
import {
  PROJECTS,
  FEATURED_PROJECTS,
  WORKING_ON_NOW_PROJECTS,
} from "../../data/portfolioData"
import { Project } from "../../types/portfolio"
import { useReveal } from "../../lib/use-reveal"
import SplitHeading from "../ui/SplitHeading"

/**
 * Title card for a project that has no screenshot yet: drawn from the
 * project's own name, category and stack in the site's palette. The
 * initial is sampled into dots, the same way the hero builds its logos.
 * `withText: false` draws only the mark, for thumbnails that sit above
 * the title anyway.
 */
function drawTitleCard(p: Project, withText = true): string {
  if (typeof document === "undefined") return ""
  const W = 1280
  const H = 800
  const c = document.createElement("canvas")
  c.width = W
  c.height = H
  const g = c.getContext("2d")
  if (!g) return ""

  const css = getComputedStyle(document.documentElement)
  const v = (name: string, fb: string) => css.getPropertyValue(name).trim() || fb
  const panel = v("--panel", "#101012")
  const fg = v("--fg", "#ecebe7")
  const mut = v("--mut", "#8a8b8f")
  const acc = v("--acc", "#ff4a3d")
  const disp = v("--font-disp", "sans-serif")
  const mono = v("--font-mono", "monospace")

  g.fillStyle = panel
  g.fillRect(0, 0, W, H)

  const m = document.createElement("canvas")
  const S = 120
  m.width = m.height = S
  const mg = m.getContext("2d")
  if (mg) {
    mg.fillStyle = "#fff"
    mg.textAlign = "center"
    mg.textBaseline = "middle"
    mg.font = `700 ${S * 0.95}px ${disp}`
    mg.fillText(p.title.charAt(0).toUpperCase(), S / 2, S * 0.54)
    const d = mg.getImageData(0, 0, S, S).data
    const cell = 6.2
    const ox = withText ? W - S * cell - 40 : (W - S * cell) / 2
    const oy = (H - S * cell) / 2 - (withText ? 40 : 0)
    g.fillStyle = acc
    for (let y = 0; y < S; y += 2) {
      for (let x = 0; x < S; x += 2) {
        if (d[(y * S + x) * 4 + 3] > 128) {
          g.beginPath()
          g.arc(ox + x * cell, oy + y * cell, 4.2, 0, Math.PI * 2)
          g.fill()
        }
      }
    }
  }

  if (!withText) return c.toDataURL("image/png")

  g.textBaseline = "alphabetic"
  g.fillStyle = acc
  g.font = `400 26px ${mono}`
  g.fillText(p.category.toUpperCase(), 64, 96)

  g.fillStyle = fg
  let size = 92
  g.font = `700 ${size}px ${disp}`
  while (g.measureText(p.title).width > W * 0.62 && size > 48) {
    size -= 4
    g.font = `700 ${size}px ${disp}`
  }
  g.fillText(p.title, 64, H - 150)

  g.fillStyle = mut
  g.font = `400 26px ${mono}`
  g.fillText(p.tech.slice(0, 4).join("  ·  "), 64, H - 84)

  return c.toDataURL("image/png")
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
    </svg>
  )
}

function MaxIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      {on ? (
        <path d="M5.5 2.5h8v8M2.5 5.5h8v8h-8z" />
      ) : (
        <path d="M2.5 2.5h11v11h-11z" />
      )}
    </svg>
  )
}

interface WorkProps {
  lenisRef: React.MutableRefObject<Lenis | null>
}

type OriginPoint = { x: number; y: number; width: number }

const SEL = 3

export default function Work({ lenisRef }: WorkProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const peekRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const winRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const dragControls = useDragControls()

  const [expanded, setExpanded] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [origin, setOrigin] = useState<{
    x: number
    y: number
    scale: number
  } | null>(null)
  const [isMaximized, setIsMaximized] = useState(false)
  const [art, setArt] = useState<Record<string, string>>({})

  const initialProjects = useMemo(() => FEATURED_PROJECTS.slice(0, SEL), [])
  const extraProjects = useMemo(() => FEATURED_PROJECTS.slice(SEL), [])
  const imgFor = (p: Project) => p.img || art[p.id] || ""
  const thumbFor = (p: Project) => p.img || art[`${p.id}-plain`] || ""

  useReveal(sectionRef)

  // Title cards need the page fonts, so draw them once fonts are ready.
  useEffect(() => {
    let alive = true
    const build = () => {
      if (!alive) return
      const next: Record<string, string> = {}
      PROJECTS.forEach((p) => {
        if (p.img) return
        next[p.id] = drawTitleCard(p)
        if (p.isWorkingOnNow) next[`${p.id}-plain`] = drawTitleCard(p, false)
      })
      setArt(next)
    }
    if (document.fonts) document.fonts.ready.then(build)
    else build()
    return () => {
      alive = false
    }
  }, [])

  // Floating preview that follows a mouse pointer over the project list.
  useEffect(() => {
    const list = listRef.current
    const pk = peekRef.current
    const strip = stripRef.current
    if (!list || !pk || !strip) return

    let tx = 0
    let ty = 0
    let qx = 0
    let qy = 0
    let ss = 0
    let st = 0
    let act = -1
    let run = 0
    let lt = 0
    let animId = 0

    function loop(now: number) {
      const dt = Math.min(0.05, (now - lt) / 1000) || 0.016
      lt = now
      qx += (tx - qx) * (1 - Math.exp(-dt * 9))
      qy += (ty - qy) * (1 - Math.exp(-dt * 9))
      ss += (st - ss) * (1 - Math.exp(-dt * 11))

      pk!.style.transform = `translate3d(${qx}px, ${qy}px, 0) translate(-50%, -50%) scale(${ss})`

      if (st || ss > 0.004) {
        animId = requestAnimationFrame(loop)
      } else {
        run = 0
        pk!.style.visibility = "hidden"
      }
    }

    function pick(i: number) {
      if (i === act) return
      const was = act
      act = i
      st = i >= 0 ? 1 : 0
      if (i < 0) return

      const y = `translateY(${-i * (100 / FEATURED_PROJECTS.length)}%)`
      if (was < 0) {
        qx = tx
        qy = ty
        ss = 0
        strip!.style.transition = "none"
        strip!.style.transform = y
        void strip!.offsetWidth
        strip!.style.transition = ""
      } else {
        strip!.style.transform = y
      }

      if (!run) {
        run = 1
        lt = performance.now()
        pk!.style.visibility = "visible"
        animId = requestAnimationFrame(loop)
      }
    }

    const rowAt = (x: number, y: number) => {
      const e = document.elementFromPoint(x, y)
      const r = e?.closest<HTMLElement>(".row")
      return r && r.dataset.i !== undefined ? Number(r.dataset.i) : -1
    }

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      tx = e.clientX
      ty = e.clientY
      pick(rowAt(tx, ty))
    }
    const onPointerLeave = () => pick(-1)

    list.addEventListener("pointermove", onPointerMove)
    list.addEventListener("pointerleave", onPointerLeave)

    return () => {
      cancelAnimationFrame(animId)
      list.removeEventListener("pointermove", onPointerMove)
      list.removeEventListener("pointerleave", onPointerLeave)
    }
  }, [])

  const openModal = (
    project: Project,
    opener: HTMLElement | null,
    originPoint?: OriginPoint,
  ) => {
    const winW = window.innerWidth
    const winH = window.innerHeight
    const modalW = Math.min(900, winW * 0.94)

    if (originPoint) {
      const startScale = Math.max(
        0.18,
        Math.min(0.85, originPoint.width / modalW),
      )
      setOrigin({
        x: originPoint.x - winW / 2,
        y: originPoint.y - winH / 2,
        scale: startScale,
      })
    } else {
      setOrigin({ x: 0, y: 30, scale: 0.95 })
    }

    if (peekRef.current) peekRef.current.style.visibility = "hidden"

    openerRef.current = opener
    setSelectedProject(project)
    setIsMaximized(false)
    document.body.style.overflow = "hidden"
    lenisRef.current?.stop()
  }

  const closeModal = useCallback(() => {
    setSelectedProject(null)
    setIsMaximized(false)
    setOrigin(null)
    document.body.style.overflow = ""
    lenisRef.current?.start()
    openerRef.current?.focus()
  }, [lenisRef])

  // Dialog: focus the close button on open, keep Tab inside, Escape closes.
  useEffect(() => {
    if (!selectedProject) return
    closeRef.current?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal()
        return
      }
      if (e.key !== "Tab" || !winRef.current) return
      const items = winRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [selectedProject, closeModal])

  const centreOf = (el: Element, maxW?: number): OriginPoint => {
    const r = el.getBoundingClientRect()
    return {
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
      width: maxW ? Math.min(maxW, r.width) : r.width,
    }
  }

  const renderProjectRow = (project: Project, index: number) => (
    <button
      key={project.id}
      type="button"
      className="row"
      data-i={index}
      aria-haspopup="dialog"
      onClick={(e) => {
        const pk = peekRef.current
        const from =
          pk && pk.style.visibility !== "hidden"
            ? centreOf(pk)
            : centreOf(e.currentTarget, 400)
        openModal(project, e.currentTarget, from)
      }}
    >
      <span>
        <b>{project.title}</b>
        <small>{project.subtitle}</small>
      </span>
      <span className="g">{project.tech.slice(0, 3).join(" · ")}</span>
      {imgFor(project) && (
        <img
          className="m"
          src={imgFor(project)}
          alt=""
          loading="lazy"
          decoding="async"
        />
      )}
    </button>
  )

  const titleId = "win-title"

  return (
    <section className="s" id="work" data-l="~/work" ref={sectionRef}>
      <SplitHeading parts={["Featured projects."]} />

      <div id="list" className="rv" ref={listRef}>
        {initialProjects.map((p, idx) => renderProjectRow(p, idx))}

        <AnimatePresence initial={false}>
          {expanded && extraProjects.length > 0 && (
            <motion.div
              id="more"
              className="open"
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: "auto",
                opacity: 1,
                transition: {
                  height: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: 0.3, delay: 0.05 },
                },
              }}
              exit={{
                height: 0,
                opacity: 0,
                transition: {
                  height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: 0.2 },
                },
              }}
              style={{ overflow: "hidden" }}
            >
              <div id="moreIn">
                {extraProjects.map((p, idx) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.35,
                        delay: idx * 0.06,
                        ease: [0.16, 1, 0.3, 1],
                      },
                    }}
                    exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
                  >
                    {renderProjectRow(p, SEL + idx)}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {extraProjects.length > 0 && (
        <div className="mr">
          <span id="cnt">
            Showing {expanded ? FEATURED_PROJECTS.length : SEL} of{" "}
            {FEATURED_PROJECTS.length}
          </span>
          <motion.button
            className="btn"
            id="seeMore"
            type="button"
            aria-expanded={expanded}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded
              ? "See fewer"
              : `See more projects (${FEATURED_PROJECTS.length - SEL})`}
          </motion.button>
        </div>
      )}

      <div id="now" className="now-section rv">
        <div className="now-header">
          <h3 className="now-title">Working on now</h3>
          <p className="now-desc">
            Early-stage architectures and live client builds currently under
            active development.
          </p>
        </div>

        <div className="now-grid">
          {WORKING_ON_NOW_PROJECTS.map((project) => {
            const imgSrc = thumbFor(project)
            const open = (opener: HTMLElement, card: HTMLElement) =>
              openModal(
                project,
                opener,
                centreOf(card.querySelector(".now-card-thumb") || card),
              )
            return (
              <motion.article
                key={project.id}
                className="now-card"
                whileHover={{
                  y: -5,
                  transition: { duration: 0.2, ease: "easeOut" },
                }}
                onClick={(e) => {
                  // Mouse convenience: the whole card opens the details.
                  if ((e.target as HTMLElement).closest("a, button")) return
                  const card = e.currentTarget
                  const btn =
                    card.querySelector<HTMLElement>(".now-card-action") || card
                  open(btn, card)
                }}
              >
                <div className="now-card-thumb">
                  {imgSrc && (
                    <img
                      src={imgSrc}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className={project.img ? undefined : "art"}
                    />
                  )}
                  <div className="now-card-status">
                    <span className="pulse-dot" aria-hidden="true" />
                    <span>In development</span>
                  </div>
                </div>

                <div className="now-card-body">
                  <span className="now-card-cat">{project.category}</span>
                  <h4 className="now-card-title">{project.title}</h4>
                  <p className="now-card-sub">{project.subtitle}</p>
                  <p className="now-card-desc">{project.description}</p>
                  {project.note && (
                    <p className="now-card-note">{project.note}</p>
                  )}
                  <div className="now-card-tags">
                    {project.tech.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                  <div className="now-card-footer">
                    <button
                      type="button"
                      className="now-card-action"
                      aria-haspopup="dialog"
                      onClick={(e) =>
                        open(
                          e.currentTarget,
                          e.currentTarget.closest(".now-card") as HTMLElement,
                        )
                      }
                    >
                      View details
                      <span className="sr-only"> about {project.title}</span>
                    </button>
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="now-card-gh"
                      >
                        GitHub
                        <span className="sr-only">
                          {" "}
                          repository for {project.title} (opens in new tab)
                        </span>
                      </a>
                    )}
                  </div>
                </div>
              </motion.article>
            )
          })}
        </div>
      </div>

      <div id="peek" ref={peekRef} aria-hidden="true">
        <div id="strip" ref={stripRef}>
          {FEATURED_PROJECTS.map((p) => (
            <img key={p.id} src={imgFor(p) || undefined} alt="" />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedProject && (
          <>
            <motion.div
              id="scrim"
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeModal}
            />
            <div className="modal-overlay" onClick={closeModal}>
              <motion.div
                id="win"
                key="win"
                ref={winRef}
                layout
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={`on ${isMaximized ? "max" : ""}`}
                initial={
                  origin
                    ? {
                        x: origin.x,
                        y: origin.y,
                        scale: origin.scale,
                        opacity: 0.85,
                      }
                    : { x: 0, y: 24, scale: 0.95, opacity: 0 }
                }
                animate={{
                  x: 0,
                  y: 0,
                  scale: 1,
                  opacity: 1,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 26,
                    mass: 0.8,
                  },
                }}
                exit={
                  origin
                    ? {
                        x: origin.x,
                        y: origin.y,
                        scale: origin.scale,
                        opacity: 0,
                        transition: {
                          duration: 0.24,
                          ease: [0.16, 1, 0.3, 1],
                        },
                      }
                    : {
                        opacity: 0,
                        scale: 0.96,
                        transition: { duration: 0.2 },
                      }
                }
                drag={!isMaximized}
                dragControls={dragControls}
                dragListener={false}
                dragMomentum={false}
                dragElastic={0.06}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  id="wbar"
                  onPointerDown={(e) => {
                    // Drag by the title bar on desktop sizes only; on a phone
                    // the window already fills the width.
                    if (
                      (e.target as HTMLElement).closest("button") ||
                      isMaximized ||
                      window.innerWidth <= 700
                    )
                      return
                    dragControls.start(e)
                  }}
                >
                  <span id="wt" aria-hidden="true">
                    ~/work/
                    {selectedProject.title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, "")}
                  </span>
                  <span>
                    <button
                      id="wmax"
                      aria-label={isMaximized ? "Restore size" : "Maximize"}
                      aria-pressed={isMaximized}
                      type="button"
                      onClick={() => setIsMaximized(!isMaximized)}
                    >
                      <MaxIcon on={isMaximized} />
                    </button>
                    <button
                      id="wx"
                      ref={closeRef}
                      aria-label="Close project details"
                      type="button"
                      onClick={closeModal}
                    >
                      <CloseIcon />
                    </button>
                  </span>
                </div>

                <div id="wbody">
                  <div className="wimg-wrap">
                    {imgFor(selectedProject) && (
                      <img src={imgFor(selectedProject)} alt="" />
                    )}
                  </div>
                  <motion.div
                    className="wbody-info"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.22, delay: 0.08 }}
                  >
                    <small>
                      {selectedProject.category}
                      {selectedProject.comingSoon ? " · In development" : ""}
                    </small>
                    <h3 id={titleId}>{selectedProject.title}</h3>
                    <p>{selectedProject.description}</p>
                    {selectedProject.note && (
                      <p className="nt">{selectedProject.note}</p>
                    )}

                    <div className="tg">
                      {selectedProject.tech.map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </div>

                    <div className="lk">
                      {selectedProject.demoUrl && (
                        <a
                          href={selectedProject.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Live site
                        </a>
                      )}
                      {selectedProject.githubUrl && (
                        <a
                          href={selectedProject.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          GitHub
                        </a>
                      )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </section>
  )
}
