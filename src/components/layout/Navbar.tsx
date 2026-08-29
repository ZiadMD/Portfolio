"use client";

import { useState } from "react";
import { NAV_LINKS } from "../../data/portfolioData";

interface NavbarProps {
  activeSection: string;
}

export default function Navbar({ activeSection }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <header>
      {/* Desktop — Floating Dock */}
      <div className="hidden md:flex fixed top-4 left-0 right-0 z-50 justify-center pointer-events-none">
        <nav
          aria-label="Main Navigation"
          className="pointer-events-auto flex items-center gap-1 px-3 py-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] w-[560px] max-w-[90vw] justify-between"
        >
          <button
            type="button"
            onClick={() => scrollTo("hero")}
            aria-label="Scroll to home"
            className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-white/10 transition-colors duration-200"
          >
            <span className="font-display text-sm text-[#c9191e] leading-none tracking-tight">ZS</span>
          </button>
          <div className="flex items-center gap-1">
            {NAV_LINKS.map(({ id, label }) => {
              const isActive = activeSection === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollTo(id)}
                  className={`relative px-4 h-9 rounded-xl text-[11px] uppercase tracking-[0.18em] transition-all duration-200 ${
                    isActive ? "bg-[#1a1a1a] text-[#f0ede8]" : "text-[#666666] hover:text-[#f0ede8] hover:bg-white/5"
                  }`}
                >
                  {isActive && (
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#c9191e]" />
                  )}
                  {label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Mobile — Top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-xs">
        <button
          type="button"
          onClick={() => scrollTo("hero")}
          aria-label="Scroll to home"
          className="font-display text-sm text-[#c9191e] leading-none tracking-tight"
        >
          ZS
        </button>
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex flex-col gap-[5px] justify-center items-end p-2"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <span
            className={`block h-px bg-[#888888] transition-all duration-300 ${
              menuOpen ? "w-5 rotate-45 translate-y-[7px]" : "w-5"
            }`}
          />
          <span
            className={`block h-px bg-[#888888] transition-all duration-300 ${
              menuOpen ? "opacity-0 w-5" : "w-3"
            }`}
          />
          <span
            className={`block h-px bg-[#888888] transition-all duration-300 ${
              menuOpen ? "w-5 -rotate-45 -translate-y-[7px]" : "w-5"
            }`}
          />
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      <div
        className={`md:hidden fixed top-14 right-4 z-40 transition-all duration-200 origin-top-right ${
          menuOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <nav
          aria-label="Mobile Navigation"
          className="w-40 rounded-xl border border-[#1e1e1e] bg-[#0a0a0a]/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.7)] overflow-hidden"
        >
          {NAV_LINKS.map(({ id, label }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                className={`w-full px-4 py-3 text-left text-[11px] uppercase tracking-[0.18em] border-b border-[#141414] last:border-b-0 transition-colors ${
                  isActive ? "text-[#c9191e] font-medium" : "text-[#777777] hover:text-[#f0ede8]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
