"use client";

import { useState } from "react";
import ProjectCard from "./ProjectCard";
import ProjectsModal from "./ProjectsModal";
import { PROJECTS } from "../../data/portfolioData";

export default function Work() {
  const [modalOpen, setModalOpen] = useState(false);
  const featured = PROJECTS.filter((w) => w.featured);

  return (
    <>
      <section id="work" aria-label="Selected Projects" className="py-24 px-6 md:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10 md:mb-14">
            <div>
              <p className="text-[#c9191e] text-xs uppercase tracking-[0.3em] mb-2">
                Selected Work
              </p>
              <p className="text-[#444444] text-xs tracking-wide">Featured projects</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1a1a1a]">
            {featured.map((work) => (
              <ProjectCard key={work.id} work={work} />
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="group flex items-center gap-4 px-8 py-3.5 border border-[#222222] text-xs uppercase tracking-[0.25em] text-[#888888] hover:border-[#c9191e] hover:text-[#c9191e] transition-all duration-300"
            >
              View all {PROJECTS.length} projects
              <span className="w-6 h-px bg-current transition-all duration-300 group-hover:w-10" />
            </button>
          </div>
        </div>
      </section>

      {modalOpen && <ProjectsModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
