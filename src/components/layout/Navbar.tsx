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
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M5 5.5h14L5 18.5h14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="square"
            />
            <circle cx="19" cy="5.5" r="2.1" fill="var(--acc)" />
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
          href="#contact"
          onClick={(e) => handleClick(e, "contact")}
        >
          CV ↓
        </a>
      </div>
    </nav>
  )
}
