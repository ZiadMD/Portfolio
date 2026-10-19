"use client"

// Generate fallback arts for projects without explicit local image

// Section reveals

// Peek cursor tracking

// Modal open/close body scroll locking

// Keyboard Escape listener for modal

// Draggable window title bar
/* Floating Peek Cursor Preview */ /* Window Dialog Modal */

import { useEffect, useRef, useState, useMemo } from "react"
import Lenis from "lenis"
import { PROJECTS } from "../../data/portfolioData"
import { Project } from "../../types/portfolio"

function generateProjectArt(title: string, hue: number): string {
  if (
    typeof document ===
    "undefined"
  )
    return ""
  const c = document.createElement("canvas")
  c.width = 640
  c.height = 440
  const g = c.getContext("2d")
  if (!g) return ""
  const q = g.createLinearGradient(0, 0, 640, 440)
  q.addColorStop(0, `hsl(${hue} 55% 12%)`)
  q.addColorStop(
    1,
    `hsl(${
      hue +
      40
    } 65% 30%)`,
  )
  g.fillStyle = q
  g.fillRect(0, 0, 640, 440)
  g.fillStyle = `hsla(${
    hue +
    20
  }, 90%, 80%, 0.4)`
  for (
    let y = 14;
    y <
    440;
    y += 14
  ) {
    for (
      let x = 10;
      x <
      640;
      x += 14
    ) {
      const v =
        (Math.sin(x * 0.02 + hue) +
          Math.cos(
            y *
              0.03,
          ) +
          2) /
        4
      g.beginPath()
      g.arc(
        x,
        y,
        v *
          4.5,
        0,
        6.283,
      )
      g.fill()
    }
  }
  g.fillStyle = "#fff"
  g.font = "700 38px sans-serif"
  g.fillText(title, 28, 404)
  return c.toDataURL("image/jpeg", 0.8)
}

interface WorkProps {
  lenisRef: React.MutableRefObject<Lenis | null>
}

export default function Work({ lenisRef }: WorkProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const peekRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)

  const [expanded, setExpanded] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isMaximized, setIsMaximized] = useState(false)
  const [projectImages, setProjectImages] = useState<string[]>([])

  const SEL = 6
  const initialProjects = useMemo(() => PROJECTS.slice(0, SEL), [])
  const extraProjects = useMemo(() => PROJECTS.slice(SEL), [])
  useEffect(() => {
    const images = PROJECTS.map(
      (p) =>
        p.img ||
        generateProjectArt(p.title, p.hue),
    )
    setProjectImages(images)
  }, [])
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const headings = section.querySelectorAll<HTMLElement>("h2, .big")
    headings.forEach((h) => {
      if (h.dataset.wrapped) return
      h.dataset.wrapped = "true"
      let i = 0
      h.innerHTML = h.innerHTML.replace(
        /(<[^>]+>)|([^\s<]+)/g,
        (match, g, w) =>
          g ? g : `<span class="w"><i style="--i:${i++}">${w}</i></span>`,
      )
    })

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          e.target.classList.toggle("in", e.isIntersecting)
        })
      },
      { threshold: 0.15 },
    )

    const revealEls = section.querySelectorAll<HTMLElement>(".rv, h2, .big")
    revealEls.forEach((el) => io.observe(el))

    return () => io.disconnect()
  }, [])
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
      const dt =
        Math.min(0.05, (now - lt) / 1000) ||
        0.016
      lt = now
      qx +=
        (tx - qx) *
        (1 -
          Math.exp(
            -dt *
              9,
          ))
      qy +=
        (ty - qy) *
        (1 -
          Math.exp(
            -dt *
              9,
          ))
      ss +=
        (st - ss) *
        (1 -
          Math.exp(
            -dt *
              11,
          ))

      pk!.style.transform = `translate3d(${qx}px, ${qy}px, 0) translate(-50%, -50%) scale(${ss})`

      if (
        st ||
        ss >
          0.004
      ) {
        animId = requestAnimationFrame(loop)
      } else {
        run = 0
        pk!.style.visibility = "hidden"
      }
    }

    function pick(i: number) {
      if (
        i ===
        act
      )
        return
      const was = act
      act = i
      st =
        i >=
        0
          ? 1
          : 0
      if (
        i <
        0
      )
        return

      if (
        was <
        0
      ) {
        qx = tx
        qy = ty
        ss = 0
        strip!.style.transition = "none"
        strip!.style.transform = `translateY(${-i * (100 / PROJECTS.length)}%)`
        void strip!.offsetWidth
        strip!.style.transition = ""
      } else {
        strip!.style.transform = `translateY(${-i * (100 / PROJECTS.length)}%)`
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
      return r &&
        r.dataset.i !==
          undefined
        ? Number(r.dataset.i)
        : -1
    }

    const onPointerMove = (e: PointerEvent) => {
      tx = e.clientX
      ty = e.clientY
      pick(rowAt(tx, ty))
    }

    const onPointerLeave = () => pick(-1)
    const onScroll = () => {
      if (
        act >=
        0
      )
        pick(rowAt(tx, ty))
    }

    list.addEventListener("pointermove", onPointerMove)
    list.addEventListener("pointerleave", onPointerLeave)
    window.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(animId)
      list.removeEventListener("pointermove", onPointerMove)
      list.removeEventListener("pointerleave", onPointerLeave)
      window.removeEventListener("scroll", onScroll)
    }
  }, [])
  const openModal = (project: Project) => {
    setSelectedProject(project)
    setIsMaximized(false)
    document.body.style.overflow = "hidden"
    if (lenisRef.current) {
      lenisRef.current.stop()
    }
  }

  const closeModal = () => {
    setSelectedProject(null)
    setIsMaximized(false)
    document.body.style.overflow = ""
    if (lenisRef.current) {
      lenisRef.current.start()
    }
  }
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key ===
          "Escape" &&
        selectedProject
      ) {
        closeModal()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [selectedProject])
  const winRef = useRef<HTMLDivElement>(null)
  const [dragOffset, setDragOffset] = useState<[number, number] | null>(null)

  const onTitleBarPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      (e.target as HTMLElement).closest("button") ||
      isMaximized ||
      !winRef.current
    )
      return
    const r = winRef.current.getBoundingClientRect()
    setDragOffset([e.clientX - r.left, e.clientY - r.top])
    winRef.current.style.transform = "none"
    winRef.current.style.left = `${r.left}px`
    winRef.current.style.top = `${r.top}px`
  }

  useEffect(() => {
    if (!dragOffset) return

    const clamp = (v: number, a: number, b: number) =>
      Math.min(b, Math.max(a, v))

    const onPointerMove = (e: PointerEvent) => {
      if (!winRef.current) return
      const x = clamp(e.clientX - dragOffset[0], 0, window.innerWidth - 80)
      const y = clamp(e.clientY - dragOffset[1], 0, window.innerHeight - 40)
      winRef.current.style.left = `${x}px`
      winRef.current.style.top = `${y}px`
    }

    const onPointerUp = () => setDragOffset(null)

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)

    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }
  }, [dragOffset])

  const renderProjectRow = (project: Project, index: number) => {
    const imgSrc = projectImages[index] || project.img
    return (
      <a
        key={project.id}
        className="row"
        href="#"
        data-i={index}
        onClick={(e) => {
          e.preventDefault()
          openModal(project)
        }}
      >
        <span>
          <b>{project.title}</b>
          <small>{project.subtitle}</small>
        </span>
        <span className="g">{project.tech.slice(0, 3).join(" · ")}</span>
        {imgSrc && <img className="m" src={imgSrc} alt={project.title} />}
      </a>
    )
  }

  return (
    <section className="s" id="work" data-l="~/work" ref={sectionRef}>
      <p className="lab rv">Selected work</p>
      <h2>
        Featured <em>projects</em>.
      </h2>

      <div id="list" className="rv" ref={listRef}>
        {initialProjects.map((p, idx) => renderProjectRow(p, idx))}

        <div id="more" className={expanded ? "open" : ""}>
          <div id="moreIn">
            {extraProjects.map((p, idx) => renderProjectRow(p, SEL + idx))}
          </div>
        </div>
      </div>

      <div className="mr">
        <span id="cnt">
          Showing {expanded ? PROJECTS.length : SEL} of {PROJECTS.length}
        </span>
        <button
          className="btn"
          id="seeMore"
          type="button"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded
            ? "See fewer −"
            : `See more projects (${PROJECTS.length - SEL}) +`}
        </button>
      </div>

      {}
      <div id="peek" ref={peekRef} aria-hidden="true">
        <div id="strip" ref={stripRef}>
          {projectImages.map((src, idx) => (
            <img key={idx} src={src} alt="" />
          ))}
        </div>
      </div>

      {}
      {selectedProject && (
        <>
          <div id="scrim" onClick={closeModal} />
          <div
            id="win"
            ref={winRef}
            role="dialog"
            aria-modal="true"
            aria-label="Project details"
            className={`on ${isMaximized ? "max" : ""}`}
          >
            <div id="wbar" onPointerDown={onTitleBarPointerDown}>
              <span id="wt">
                ~/work/
                {selectedProject.title
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, "")}
              </span>
              <span>
                <button
                  id="wmax"
                  aria-label="Maximize"
                  type="button"
                  onClick={() => setIsMaximized(!isMaximized)}
                >
                  ▢
                </button>
                <button
                  id="wx"
                  aria-label="Close"
                  type="button"
                  onClick={closeModal}
                >
                  ✕
                </button>
              </span>
            </div>

            <div id="wbody">
              <img
                src={
                  projectImages[
                    PROJECTS.findIndex((p) => p.id === selectedProject.id)
                  ] || selectedProject.img
                }
                alt={selectedProject.title}
              />
              <div>
                <small>{selectedProject.category}</small>
                <h3>{selectedProject.title}</h3>
                <p>{selectedProject.description}</p>
                {selectedProject.note && (
                  <p className="nt">{selectedProject.note}</p>
                )}

                <div className="tg">
                  {selectedProject.tech.map((t, idx) => (
                    <span key={idx}>{t}</span>
                  ))}
                </div>

                <div className="lk">
                  {selectedProject.demoUrl && (
                    <a
                      href={selectedProject.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Live ↗
                    </a>
                  )}
                  {selectedProject.githubUrl && (
                    <a
                      href={selectedProject.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GitHub ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
