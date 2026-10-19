"use client"

import { useEffect, useRef } from "react"
import { EXPERIENCE_DATA } from "../../data/portfolioData"

export default function Experience() {
  const sectionRef = useRef<HTMLElement>(null)

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

  return (
    <section
      className="s"
      id="experience"
      data-l="~/experience"
      ref={sectionRef}
    >
      <p className="lab rv">Experience</p>
      <h2>
        Where I’ve been <em>shipping</em>.
      </h2>

      {EXPERIENCE_DATA.map((item, idx) => (
        <div className="xp rv" key={idx}>
          <span className="when">{item.when}</span>
          <div>
            <b>{item.role}</b>
            <i>
              {item.company}
              {item.location ? ` · ${item.location}` : ""}
            </i>
            {item.points && item.points.length > 0 && (
              <ul>
                {item.points.map((pt, pIdx) => (
                  <li key={pIdx}>{pt}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </section>
  )
}
