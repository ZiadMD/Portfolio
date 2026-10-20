"use client"

import { useEffect, useRef } from "react"
import { CONTACT_LINKS } from "../../data/portfolioData"

export default function Contact() {
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
    <>
      <section className="s" id="contact" data-l="~/contact" ref={sectionRef}>
        <p className="lab rv">Contact</p>
        <h2 className="big">
          Let’s build <em>something</em> together.
        </h2>
        <p className="lead rv">
          Open to collaborations, freelance work, and interesting problems. If
          you have something worth building, I want to hear about it.
        </p>

        <div className="cgrid rv">
          {CONTACT_LINKS.map((link, idx) => {
            if (link.href === "#") {
              return (
                <div key={idx}>
                  <small>{link.label}</small>
                  {link.value}
                </div>
              )
            }
            const isExternal = link.href.startsWith("http")
            const isDownload = link.href.endsWith(".pdf")
            return (
              <a
                key={idx}
                href={link.href}
                target={isExternal || isDownload ? "_blank" : undefined}
                rel={
                  isExternal || isDownload ? "noopener noreferrer" : undefined
                }
                download={
                  isDownload ? "Ziad_Mohamed_Sheashaa_CV.pdf" : undefined
                }
              >
                <small>{link.label}</small>
                {link.value}
              </a>
            )
          })}
        </div>
      </section>

      <footer>
        <span>© 2026 Ziad M. Sheashaa</span>
        <span>Built with canvas and a lot of particles.</span>
      </footer>
    </>
  )
}
