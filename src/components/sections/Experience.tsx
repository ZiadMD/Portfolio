"use client"

import { useRef } from "react"
import { EXPERIENCE_DATA } from "../../data/portfolioData"
import { useReveal } from "../../lib/use-reveal"
import SplitHeading from "../ui/SplitHeading"

export default function Experience() {
  const sectionRef = useRef<HTMLElement>(null)
  useReveal(sectionRef)

  return (
    <section
      className="s"
      id="experience"
      data-l="~/experience"
      ref={sectionRef}
    >
      <SplitHeading parts={["Engineering track record & leadership."]} />

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
