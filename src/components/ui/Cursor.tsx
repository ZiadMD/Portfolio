"use client";

import { useEffect, useRef, useState } from "react";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -600, y: -600 });
  const glow = useRef({ x: -600, y: -600 });
  const raf = useRef<number>(0);
  const [hovering, setHovering] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Disable custom cursor on touch/coarse devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      setHidden(false);
    };
    const onLeave = () => setHidden(true);
    const onEnter = () => setHidden(false);
    const onOver = (e: MouseEvent) => {
      setHovering(!!(e.target as HTMLElement).closest("a, button, [data-cursor]"));
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mouseover", onOver);

    const tick = () => {
      if (dotRef.current) {
        dotRef.current.style.left = `${mouse.current.x}px`;
        dotRef.current.style.top = `${mouse.current.y}px`;
      }

      glow.current.x += (mouse.current.x - glow.current.x) * 0.08;
      glow.current.y += (mouse.current.y - glow.current.y) * 0.08;
      if (glowRef.current) {
        glowRef.current.style.left = `${glow.current.x}px`;
        glowRef.current.style.top = `${glow.current.y}px`;
      }
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mouseover", onOver);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <>
      {/* Soft trailing glow */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none fixed z-[9990]"
        style={{
          width: hovering ? "340px" : "260px",
          height: hovering ? "340px" : "260px",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          background: hovering
            ? "radial-gradient(circle, rgba(201,25,30,0.13) 0%, rgba(201,25,30,0.05) 45%, transparent 70%)"
            : "radial-gradient(circle, rgba(201,25,30,0.09) 0%, rgba(201,25,30,0.03) 45%, transparent 70%)",
          opacity: hidden ? 0 : 1,
          transition: "width 0.4s ease, height 0.4s ease, opacity 0.4s, background 0.3s",
          willChange: "left, top",
        }}
      />
      {/* Sharp red dot */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed z-[9999]"
        style={{
          width: hovering ? "8px" : "5px",
          height: hovering ? "8px" : "5px",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          background: "#c9191e",
          boxShadow: hovering
            ? "0 0 10px 3px rgba(201,25,30,0.8), 0 0 20px 6px rgba(201,25,30,0.4)"
            : "0 0 6px 2px rgba(201,25,30,0.7), 0 0 14px 4px rgba(201,25,30,0.3)",
          opacity: hidden ? 0 : 1,
          transition: "width 0.2s ease, height 0.2s ease, box-shadow 0.2s ease, opacity 0.3s",
          willChange: "left, top",
        }}
      />
    </>
  );
}
