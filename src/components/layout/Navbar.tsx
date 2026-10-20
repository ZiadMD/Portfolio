"use client"

import { NAV_LINKS } from "../../data/portfolioData"

interface NavbarProps {
  activeSection: string
  onNavigate?: (id: string) => void
}

export default function Navbar({ activeSection, onNavigate }: NavbarProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    if (onNavigate) {
      onNavigate(id)
    } else {
      const el = document.getElementById(id)
      if (el) {
        const top = id === "hero" ? 0 : Math.max(0, el.offsetTop - 52)
        window.scrollTo({ top, behavior: "smooth" })
      }
    }
  }

  return (
    <nav className="nav" aria-label="Main Navigation">
      <a
        className="brand"
        href="#hero"
        onClick={(e) => handleClick(e, "hero")}
        aria-label="Ziad M. Sheashaa, home"
      >
        <span className="mark">
          <svg
            viewBox="0 0 104.311 60.391"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M27.537 60.391 L104.311 46.436 L51.871 46.436 L72.37 19.647 L43.337 19.647 C43.337 19.647 31.994 10.065 31.415 9.582 C31.362 9.537 31.335 9.514 31.338 9.514 C37.577 9.514 83.812 9.514 83.812 9.514 L69.146 0 L0 0 L31.415 28.865 L53.664 28.865 Z"
              fill="currentColor"
            />
            <path
              d="M84.809 20.749 L84.809 36.348 L72.93 36.348 Z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span>
          Ziad<i>.</i>
        </span>
      </a>

      <div className="nr">
        <div className="nl">
          {NAV_LINKS.map(({ id, label }) => {
            const isActive = activeSection.toLowerCase() === id.toLowerCase()
            return (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => handleClick(e, id)}
                className={isActive ? "on" : ""}
              >
                {label}
              </a>
            )
          })}
        </div>

        <a
          className="btn cv"
          id="cv"
          href="/Ziad_Mohamed_Sheashaa_CV.pdf"
          download="Ziad_Mohamed_Sheashaa_CV.pdf"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Download Ziad Mohamed Sheashaa CV (PDF)"
        >
          CV ↓
        </a>
      </div>
    </nav>
  )
}
