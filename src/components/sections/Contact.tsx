"use client"

import { useRef } from "react"
import { CONTACT_LINKS } from "../../data/portfolioData"
import { useReveal } from "../../lib/use-reveal"
import SplitHeading from "../ui/SplitHeading"

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null)
  useReveal(sectionRef)

  return (
    <section className="s" id="contact" data-l="~/contact" ref={sectionRef}>
      <SplitHeading
        className="big"
        parts={["Let’s engineer something ambitious."]}
      />
      <p className="lead rv">
        Open to full-time engineering roles, research collaborations, and
        high-impact technical challenges. If you are building a complex
        system, let&apos;s connect.
      </p>

      <div className="cgrid rv">
        {CONTACT_LINKS.map((link) => {
          const isExternal = link.href.startsWith("http")
          const isDownload = link.href.endsWith(".pdf")
          return (
            <a
              key={link.label}
              href={link.href}
              target={isExternal || isDownload ? "_blank" : undefined}
              rel={isExternal || isDownload ? "noopener noreferrer" : undefined}
              download={isDownload ? "Ziad_Mohamed_Sheashaa_CV.pdf" : undefined}
            >
              <small>{link.label}</small>
              <span className="cval">{link.value}</span>
            </a>
          )
        })}
      </div>
    </section>
  )
}
