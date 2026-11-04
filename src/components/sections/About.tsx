"use client"

import { useRef } from "react"
import { useReveal } from "../../lib/use-reveal"
import SplitHeading from "../ui/SplitHeading"

export default function About() {
  const sectionRef = useRef<HTMLElement>(null)
  useReveal(sectionRef)

  return (
    <section className="s" id="about" data-l="~/about" ref={sectionRef}>
      <SplitHeading
        className="about-h"
        parts={["Engineering deep learning models & production AI systems."]}
      />

      <div className="two">
        <div className="rv">
          <p className="lead">
            I am a Software and AI Engineer working across computer vision
            pipelines, deep learning architectures, and high-performance
            software.
          </p>
          <p className="lead">
            My work focuses on bridging the gap between algorithmic models and
            dependable execution. From fine-tuning custom architectures to
            optimizing real-time edge inference, I build systems engineered
            for stability and speed.
          </p>
        </div>
        <p className="q rv">
          Focused on deterministic execution, low-latency pipelines, and
          end-to-end reliability.
        </p>
      </div>
    </section>
  )
}
