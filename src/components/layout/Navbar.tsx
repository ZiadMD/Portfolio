"use client"
// ignore
// ignore
import { useEffect, useState } from "react"
import { NAV_LINKS } from "../../data/portfolioData"

interface NavbarProps {
  activeSection: string
  onNavigate?: (id: string) => void
}

export default function Navbar({ activeSection, onNavigate }: NavbarProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  useEffect(() => {
    try {
      const saved = localStorage.getItem("zs-theme") as "dark" | "light" | null
      if (saved) {
        setTheme(saved)
        document.documentElement.dataset.theme = saved
      } else {
        const isDark = document.documentElement.dataset.theme !== "light"
        setTheme(isDark ? "dark" : "light")
      }
    } catch {}
  }, [])

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light"
    setTheme(next)
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem("zs-theme", next)
    } catch {}
    window.dispatchEvent(new CustomEvent("zs-theme-change", { detail: next }))
  }

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

        <button
          className="ib"
          id="theme"
          type="button"
          onClick={toggleTheme}
          aria-label={`Toggle theme (currently ${theme})`}
        >
          <svg className="moon" viewBox="0 0 24 24">
            <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
          </svg>
          <svg className="sun" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
          </svg>
        </button>

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
