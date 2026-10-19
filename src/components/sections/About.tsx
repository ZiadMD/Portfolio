"use client"

// Word wrapping for headings in this section

// IntersectionObserver for reveal elements

// Counter animation for stats

import { useEffect, useRef, useState } from "react"
import { STATS, SKILLS } from "../../data/portfolioData"

export default function About() {
  const sectionRef = useRef<HTMLElement>(null)
  const [statsValues, setStatsValues] = useState<number[]>([0, 0, 0])

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
    const eo = (k: number) => 1 - Math.pow(1 - k, 4)
    const clamp = (v: number) => Math.min(1, Math.max(0, v))

    let animated = false
    const statsEl = section.querySelector(".stats")
    let statsIo: IntersectionObserver | null = null

    if (statsEl) {
      statsIo = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !animated) {
            animated = true
            const t0 = performance.now()
            const frame = (now: number) => {
              const k = clamp((now - t0) / 1200)
              const progress = eo(k)
              setStatsValues(STATS.map((s) => Math.round(s.value * progress)))
              if (k < 1) {
                requestAnimationFrame(frame)
              }
            }
            requestAnimationFrame(frame)
          }
        },
        { threshold: 0.4 },
      )
      statsIo.observe(statsEl)
    }

    return () => {
      io.disconnect()
      if (statsIo) statsIo.disconnect()
    }
  }, [])

  return (
    <section className="s" id="about" data-l="~/about" ref={sectionRef}>
      <p className="lab rv">About</p>

      <div className="two">
        <h2>
          Building at the <em>intersection</em> of code and intelligence.
        </h2>

        <div className="rv">
          <p className="lead">
            I’m a Software &amp; AI Engineer working across machine learning
            models, computer vision pipelines, robotics, and full-stack systems.
          </p>
          <p className="lead">
            I focus on engineering reliable, production-ready systems that
            deliver real-world value, not just demo-level concepts. I like
            architecting high-impact products and solving hard technical
            problems.
          </p>
          <p className="q">
            From fine-tuning to deployment, the full stack is the playground.
          </p>
        </div>
      </div>

      <div className="stats rv">
        {STATS.map((stat, idx) => (
          <div key={idx}>
            <b className="cnt">{statsValues[idx]}</b>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="mq" style={{ marginTop: "8vh" }} aria-hidden="true">
        <div>
          {SKILLS.concat(SKILLS).map((skill, idx) => (
            <span key={idx}>{skill}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
