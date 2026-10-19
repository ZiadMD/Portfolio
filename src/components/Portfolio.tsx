"use client"
// Initialize Lenis smooth scrolling if not reduced motion
import { useEffect, useRef, useState } from "react"
import Lenis from "lenis"
import Navbar from "./layout/Navbar"
import ScrollRuler from "./layout/ScrollRuler"
import Hero from "./sections/Hero"
import About from "./sections/About"
import Experience from "./sections/Experience"
import Work from "./sections/Work"
import Contact from "./sections/Contact"

export default function Portfolio() {
  const [activeSection, setActiveSection] = useState<string>("hero")
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches

    if (!prefersReducedMotion) {
      const lenis = new Lenis({
        lerp: 0.09,
      })
      lenisRef.current = lenis

      let animId = 0
      function raf(time: number) {
        lenis.raf(time)
        animId = requestAnimationFrame(raf)
      }
      animId = requestAnimationFrame(raf)

      return () => {
        cancelAnimationFrame(animId)
        lenis.destroy()
        lenisRef.current = null
      }
    }
  }, [])

  const handleNavigate = (id: string) => {
    const el = document.getElementById(id)
    const target = id === "hero" ? 0 : el ? Math.max(0, el.offsetTop - 52) : 0
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, { duration: 1.3 })
    } else {
      window.scrollTo({ top: target, behavior: "smooth" })
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <Navbar activeSection={activeSection} onNavigate={handleNavigate} />
      <ScrollRuler lenisRef={lenisRef} />
      <main>
        <Hero />
        <About />
        <Experience />
        <Work lenisRef={lenisRef} />
      </main>
      <Contact />
    </div>
  )
}
