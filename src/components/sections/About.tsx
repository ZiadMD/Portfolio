import { SKILLS } from "../../data/portfolioData";

export default function About() {
  return (
    <section id="about" aria-label="About Me" className="py-24 px-6 md:px-16">
      <div className="max-w-6xl mx-auto">
        <p className="text-[#c9191e] text-xs uppercase tracking-[0.3em] mb-10 md:mb-16">
          About
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-start">
          <div>
            <h2 className="font-display text-[clamp(2rem,5vw,4rem)] leading-tight text-[#f0ede8] mb-8">
              Ziad M. Sheashaa —
              <br />
              <span className="italic text-[#888888]">Software &amp; AI Engineer</span>
            </h2>
            <p className="text-[#888888] text-sm leading-relaxed mb-5">
              {"I'm a software & AI engineering student building at the intersection of code and intelligence. My work spans ML models, computer vision pipelines, robotics, and full-stack apps."}
            </p>
            <p className="text-[#888888] text-sm leading-relaxed">
              {"I care about building things that actually work — not just impressive in a demo. Still early in the journey, but shipping real projects and learning fast."}
            </p>
          </div>

          <div className="flex flex-col gap-10">
            <div>
              <p className="text-[#c9191e] text-xs uppercase tracking-[0.25em] mb-4">
                Stack
              </p>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs uppercase tracking-[0.15em] text-[#888888] border border-[#222222] px-3 py-1.5 hover:border-[#c9191e] hover:text-[#c9191e] transition-colors duration-300 cursor-default"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-l-2 border-[#c9191e] pl-5">
              <blockquote className="text-[#f0ede8] text-sm leading-relaxed italic font-display">
                {"\"From fine-tuning to deployment, the full stack is the playground.\""}
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
