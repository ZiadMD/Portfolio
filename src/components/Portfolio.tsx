"use client";

import { useState, useEffect } from "react";
import Cursor from "./ui/Cursor";
import Navbar from "./layout/Navbar";
import Hero from "./sections/Hero";
import About from "./sections/About";
import Work from "./sections/Work";
import Contact from "./sections/Contact";

const SECTIONS = ["hero", "about", "work", "contact"] as const;

export default function Portfolio() {
  const [activeSection, setActiveSection] = useState<string>("hero");

  useEffect(() => {
    const root = document.getElementById("scroll-root");
    if (!root) return;

    const handleScroll = () => {
      const scrollY = root.scrollTop;
      for (const id of [...SECTIONS].reverse()) {
        const el = document.getElementById(id);
        if (el && el.offsetTop - 140 <= scrollY) {
          setActiveSection(id);
          return;
        }
      }
      setActiveSection("hero");
    };

    root.addEventListener("scroll", handleScroll, { passive: true });
    return () => root.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      id="scroll-root"
      className="size-full overflow-y-auto bg-[#080808]"
      style={{ cursor: "none" }}
    >
      <Cursor />
      <Navbar activeSection={activeSection} />
      <main>
        <Hero />
        <About />
        <Work />
      </main>
      <Contact />
    </div>
  );
}
