"use client";

import { useState, useEffect } from "react";
import ProjectCard from "./ProjectCard";
import { PROJECTS, CATEGORIES } from "../../data/portfolioData";
import { ProjectCategory } from "../../types/portfolio";

interface ProjectsModalProps {
  onClose: () => void;
}

export default function ProjectsModal({ onClose }: ProjectsModalProps) {
  const [activeFilter, setActiveFilter] = useState<ProjectCategory>("All");

  const filtered =
    activeFilter === "All"
      ? PROJECTS
      : PROJECTS.filter((w) => w.category === activeFilter);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto"
      style={{ animation: "fadeIn 0.25s ease" }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-6xl mx-4 my-8 bg-[#0a0a0a] border border-[#1e1e1e] shadow-2xl"
        style={{ animation: "slideUp 0.3s ease" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 md:px-10 py-6 border-b border-[#1a1a1a] sticky top-0 bg-[#0a0a0a] z-10">
          <div>
            <p
              id="modal-title"
              className="text-[#c9191e] text-xs uppercase tracking-[0.3em] mb-1"
            >
              All Projects
            </p>
            <p className="text-[#555555] text-xs">
              {filtered.length} of {PROJECTS.length}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Desktop Filters */}
            <div className="hidden sm:flex items-center gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveFilter(cat)}
                  className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] border transition-all duration-200 ${
                    activeFilter === cat
                      ? "border-[#c9191e] text-[#c9191e] bg-[#c9191e]/10"
                      : "border-[#222222] text-[#666666] hover:border-[#444444] hover:text-[#999999]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="w-8 h-8 flex items-center justify-center text-[#666666] hover:text-[#f0ede8] border border-[#222222] hover:border-[#444444] transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Mobile Filters Horizontal Scroll */}
        <div className="sm:hidden flex gap-1 px-6 py-4 border-b border-[#1a1a1a] overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveFilter(cat)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] border whitespace-nowrap transition-all duration-200 ${
                activeFilter === cat
                  ? "border-[#c9191e] text-[#c9191e] bg-[#c9191e]/10"
                  : "border-[#222222] text-[#666666]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid of Projects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1a1a1a] p-px">
          {filtered.map((work) => (
            <ProjectCard key={work.id} work={work} />
          ))}
        </div>
      </div>
    </div>
  );
}
