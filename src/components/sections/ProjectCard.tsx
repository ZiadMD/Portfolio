import { Project } from "../../types/portfolio";

interface ProjectCardProps {
  work: Project;
}

export default function ProjectCard({ work }: ProjectCardProps) {
  return (
    <article className="group relative bg-[#080808] overflow-hidden flex flex-col">
      <div className="relative overflow-hidden" style={{ aspectRatio: "16/10" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={work.img}
          alt={work.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-[#080808]/50 transition-opacity duration-300 group-hover:opacity-20" />
        <span className="absolute top-3 left-3 text-[9px] uppercase tracking-[0.2em] text-[#c9191e] border border-[#c9191e]/40 bg-[#080808]/70 px-2 py-1 backdrop-blur-sm">
          {work.category}
        </span>
        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {work.demoUrl && work.demoUrl !== "#" && (
            <a
              href={work.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#f0ede8] text-[#080808] text-xs uppercase tracking-[0.15em] font-medium hover:bg-white transition-colors"
            >
              Live ↗
            </a>
          )}
          {work.githubUrl && (
            <a
              href={work.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-[#f0ede8]/60 text-[#f0ede8] text-xs uppercase tracking-[0.15em] hover:bg-[#f0ede8]/10 transition-colors"
            >
              GitHub ↗
            </a>
          )}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1 border-t border-[#1a1a1a]">
        <h3 className="font-display text-lg text-[#f0ede8] mb-2 group-hover:text-[#c9191e] transition-colors duration-300">
          {work.title}
        </h3>
        <p className="text-[#666666] text-xs leading-relaxed mb-4 flex-1">
          {work.description}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {work.tech.map((t) => (
            <span
              key={t}
              className="text-[9px] uppercase tracking-[0.15em] text-[#555555] border border-[#1e1e1e] px-2 py-1"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-px bg-[#c9191e] w-0 group-hover:w-full transition-all duration-500"
      />
    </article>
  );
}
