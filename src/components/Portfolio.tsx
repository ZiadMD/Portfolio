"use client"

import { useEffect, useState } from "react"
import Lenis from "lenis"
import { MotionConfig } from "motion/react"
import { lenisRef } from "../lib/lenis-ref"
import Navbar from "./layout/Navbar"
import ScrollRuler from "./layout/ScrollRuler"
import Hero from "./sections/Hero"
import About from "./sections/About"
import Experience from "./sections/Experience"
import Work from "./sections/Work"
import Contact from "./sections/Contact"
import IntroGate from "./intro/IntroGate"

export default function Portfolio() {
  // Active-link highlighting is driven by the ruler (heading-flow.tsx).
  const [activeSection] = useState<string>("hero")

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches

    if (!prefersReducedMotion) {
      const lenis = new Lenis({
        lerp: 0.09,
      })
      lenisRef.current = lenis
      // The intro is its own screen: no scrolling until it finishes
      // (IntroGate restarts Lenis when it clears the intro state).
      if (document.documentElement.dataset.introState === "playing") {
        lenis.stop()
      }

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
    // reducedMotion="user": Motion drops transform animations when the
    // visitor has asked their system for reduced motion.
    <MotionConfig reducedMotion="user">
      <div className="min-h-dvh bg-[var(--bg)] text-[var(--fg)]">
        <IntroGate />
        <Navbar activeSection={activeSection} onNavigate={handleNavigate} />
        <ScrollRuler />
        <main id="main">
          <Hero />
          <About />
          <Experience />
          <Work lenisRef={lenisRef} />
          <Contact />
        </main>
        <footer>
          <span>© 2026 Ziad M. Sheashaa</span>
          <span>Built with canvas and a lot of particles.</span>
        </footer>
      </div>
    </MotionConfig>
  )
}
