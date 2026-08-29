"use client";

import { useEffect, useRef } from "react";
import LavaBlobs from "./LavaBlobs";
import { PORTRAIT_IMAGES } from "../../data/portfolioData";

export default function Hero() {
  const watermarkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!watermarkRef.current) return;
      const rect = watermarkRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const mask = `radial-gradient(circle 340px at ${x}px ${y}px, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 55%, transparent 78%)`;
      watermarkRef.current.style.webkitMaskImage = mask;
      watermarkRef.current.style.maskImage = mask;
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" aria-label="Introduction" className="relative w-full">
      {/* ========================================================================= */}
      {/* MOBILE HERO (< 768px)                                                     */}
      {/* ========================================================================= */}
      <div className="md:hidden relative w-full min-h-screen overflow-hidden">
        {/* Base dark canvas */}
        <div className="absolute inset-0 bg-black" style={{ zIndex: 1 }} />

        {/* Background Image (16:9) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PORTRAIT_IMAGES.mobile.bg}
          alt=""
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-full object-cover object-bottom"
          style={{ zIndex: 2, height: "95%" }}
        />

        {/* Animated Lava Blobs */}
        <LavaBlobs />

        {/* Mobile scan layer — Vertical outline text (Hidden by default, illuminated ONLY by scan animation) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none select-none overflow-hidden"
          style={{ zIndex: 3 }}
        >
          {/* Sequential Left-to-Right outline scan: Software first, then AI Engineer */}
          <span
            className="font-display uppercase absolute text-transparent"
            style={{
              fontSize: "clamp(2.4rem, 6.5vh, 3.8rem)",
              letterSpacing: "0.18em",
              left: "18px",
              top: "50%",
              transformOrigin: "center center",
              transform: "translate(-50%, -50%) rotate(90deg)",
              whiteSpace: "nowrap",
              WebkitTextStroke: "1px rgba(255, 80, 80, 0.95)",
              color: "transparent",
              filter: "drop-shadow(0 0 8px rgba(201, 25, 30, 0.85)) drop-shadow(0 0 16px rgba(201, 25, 30, 0.4))",
              maskImage:
                "linear-gradient(90deg, transparent 0%, transparent 35%, black 50%, transparent 65%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(90deg, transparent 0%, transparent 35%, black 50%, transparent 65%, transparent 100%)",
              maskSize: "300% 100%",
              WebkitMaskSize: "300% 100%",
              animation: "wm-scan-left 8s ease-in-out infinite",
            }}
          >
            Software
          </span>
          <span
            className="font-display uppercase absolute text-transparent"
            style={{
              fontSize: "clamp(2.4rem, 6.5vh, 3.8rem)",
              letterSpacing: "0.18em",
              right: "18px",
              top: "50%",
              transformOrigin: "center center",
              transform: "translate(50%, -50%) rotate(90deg)",
              whiteSpace: "nowrap",
              WebkitTextStroke: "1px rgba(255, 80, 80, 0.95)",
              color: "transparent",
              filter: "drop-shadow(0 0 8px rgba(201, 25, 30, 0.85)) drop-shadow(0 0 16px rgba(201, 25, 30, 0.4))",
              maskImage:
                "linear-gradient(90deg, transparent 0%, transparent 35%, black 50%, transparent 65%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(90deg, transparent 0%, transparent 35%, black 50%, transparent 65%, transparent 100%)",
              maskSize: "300% 100%",
              WebkitMaskSize: "300% 100%",
              animation: "wm-scan-right 8s ease-in-out infinite",
            }}
          >
            AI Engineer
          </span>
        </div>

        {/* Cutout Silhouette */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PORTRAIT_IMAGES.mobile.cutout}
          alt="Ziad M. Sheashaa portrait"
          className="absolute bottom-0 left-0 w-full object-cover object-bottom"
          style={{ zIndex: 4, height: "95%" }}
        />

        {/* Text Overlay — matches desktop typography and layout structure */}
        <div
          className="absolute inset-0 flex flex-col justify-end px-6 pb-12"
          style={{ zIndex: 5 }}
        >
          <h1 className="font-display text-[clamp(2.2rem,8vw,3.6rem)] leading-[0.9] tracking-tight text-[#f0ede8] mb-4">
            Ziad M.
            <br />
            Sheashaa
          </h1>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => scrollTo("work")}
              className="group flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-[#f0ede8] hover:text-[#c9191e] transition-colors w-fit"
            >
              View work{" "}
              <span className="w-8 h-px bg-current transition-all group-hover:w-14" />
            </button>
            <button
              type="button"
              onClick={() => scrollTo("about")}
              className="text-xs uppercase tracking-[0.2em] text-[#888888] hover:text-[#f0ede8] transition-colors w-fit"
            >
              About me
            </button>
          </div>
        </div>

        {/* Bottom Fade Gradient */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{
            zIndex: 6,
            background: "linear-gradient(to top, #080808 20%, transparent)",
          }}
        />
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP HERO (>= 768px)                                                   */}
      {/* ========================================================================= */}
      <div className="hidden md:block relative w-full min-h-screen overflow-hidden">
        {/* Base dark canvas */}
        <div className="absolute inset-0 bg-black" style={{ zIndex: 1 }} />

        {/* Studio Background Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PORTRAIT_IMAGES.desktop.bg}
          alt=""
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-full object-cover object-bottom"
          style={{ zIndex: 2, height: "95%" }}
        />

        {/* 1. Sequential Left-to-Right Scan (Hidden by default, illuminated ONLY as beam sweeps) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none select-none overflow-hidden"
          style={{ zIndex: 3 }}
        >
          <span
            className="font-display uppercase text-transparent absolute"
            style={{
              fontSize: "clamp(2rem, 5vw, 5rem)",
              letterSpacing: "0.18em",
              left: "2%",
              top: "62%",
              transform: "translateY(-50%)",
              whiteSpace: "nowrap",
              WebkitTextStroke: "1.5px rgba(255, 80, 80, 0.95)",
              color: "transparent",
              filter: "drop-shadow(0 0 10px rgba(201, 25, 30, 0.85)) drop-shadow(0 0 22px rgba(201, 25, 30, 0.45))",
              maskImage:
                "linear-gradient(90deg, transparent 0%, transparent 35%, black 50%, transparent 65%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(90deg, transparent 0%, transparent 35%, black 50%, transparent 65%, transparent 100%)",
              maskSize: "300% 100%",
              WebkitMaskSize: "300% 100%",
              animation: "wm-scan-left 8s ease-in-out infinite",
            }}
          >
            Software
          </span>
          <span
            className="font-display uppercase text-transparent absolute"
            style={{
              fontSize: "clamp(2rem, 5vw, 5rem)",
              letterSpacing: "0.18em",
              right: "2%",
              top: "62%",
              transform: "translateY(-50%)",
              whiteSpace: "nowrap",
              WebkitTextStroke: "1.5px rgba(255, 80, 80, 0.95)",
              color: "transparent",
              filter: "drop-shadow(0 0 10px rgba(201, 25, 30, 0.85)) drop-shadow(0 0 22px rgba(201, 25, 30, 0.45))",
              maskImage:
                "linear-gradient(90deg, transparent 0%, transparent 35%, black 50%, transparent 65%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(90deg, transparent 0%, transparent 35%, black 50%, transparent 65%, transparent 100%)",
              maskSize: "300% 100%",
              WebkitMaskSize: "300% 100%",
              animation: "wm-scan-right 8s ease-in-out infinite",
            }}
          >
            AI Engineer
          </span>
        </div>

        {/* 2. Cursor-reveal Stroke Layer (Hidden by default, illuminated ONLY when cursor hovers near) */}
        <div
          ref={watermarkRef}
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none select-none overflow-hidden"
          style={{
            zIndex: 3,
            maskImage:
              "radial-gradient(circle 340px at -999px -999px, transparent 0%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(circle 340px at -999px -999px, transparent 0%, transparent 100%)",
          }}
        >
          <span
            className="font-display uppercase text-transparent absolute"
            style={{
              fontSize: "clamp(2rem, 5vw, 5rem)",
              WebkitTextStroke: "1.5px rgba(201, 25, 30, 0.9)",
              color: "transparent",
              filter: "drop-shadow(0 0 8px rgba(201, 25, 30, 0.7))",
              letterSpacing: "0.18em",
              left: "2%",
              top: "62%",
              transform: "translateY(-50%)",
              whiteSpace: "nowrap",
            }}
          >
            Software
          </span>
          <span
            className="font-display uppercase text-transparent absolute"
            style={{
              fontSize: "clamp(2rem, 5vw, 5rem)",
              WebkitTextStroke: "1.5px rgba(201, 25, 30, 0.9)",
              color: "transparent",
              filter: "drop-shadow(0 0 8px rgba(201, 25, 30, 0.7))",
              letterSpacing: "0.18em",
              right: "2%",
              top: "62%",
              transform: "translateY(-50%)",
              whiteSpace: "nowrap",
            }}
          >
            AI Engineer
          </span>
        </div>

        {/* Animated Lava Blobs */}
        <LavaBlobs />

        {/* Silhouette Cutout Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PORTRAIT_IMAGES.desktop.cutout}
          alt="Ziad M. Sheashaa portrait"
          className="absolute bottom-0 left-0 w-full object-cover object-bottom"
          style={{ zIndex: 4, height: "95%" }}
        />

        {/* 3-Column Text & Content Overlay */}
        <div
          className="absolute inset-0 grid grid-cols-[1fr_38%_1fr] items-center px-10 lg:px-16"
          style={{ zIndex: 5 }}
        >
          <div className="flex flex-col justify-center">
            <h1 className="font-display text-[clamp(1.8rem,4vw,4.5rem)] leading-[0.9] tracking-tight text-[#f0ede8] mb-4">
              Ziad M.
              <br />
              Sheashaa
            </h1>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => scrollTo("work")}
                className="group flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-[#f0ede8] hover:text-[#c9191e] transition-colors w-fit"
              >
                View work{" "}
                <span className="w-8 h-px bg-current transition-all group-hover:w-14" />
              </button>
              <button
                type="button"
                onClick={() => scrollTo("about")}
                className="text-xs uppercase tracking-[0.2em] text-[#888888] hover:text-[#f0ede8] transition-colors w-fit"
              >
                About me
              </button>
            </div>
          </div>
          {/* Middle column: clear space for portrait */}
          <div />
          {/* Right column: balanced spacing */}
          <div className="flex flex-col justify-center items-end text-right" />
        </div>

        {/* Bottom Fade Gradient */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{
            zIndex: 6,
            background: "linear-gradient(to top, #080808, transparent)",
          }}
        />
      </div>
    </section>
  );
}
