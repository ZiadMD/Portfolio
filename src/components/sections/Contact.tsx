import { CONTACT_LINKS } from "../../data/portfolioData";

export default function Contact() {
  return (
    <footer id="contact" aria-label="Contact and Socials" className="min-h-screen py-24 px-6 md:px-16 flex items-center">
      <div className="max-w-4xl mx-auto w-full">
        <p className="text-[#c9191e] text-xs uppercase tracking-[0.3em] mb-10 md:mb-16">
          Contact
        </p>
        <h2 className="font-display text-[clamp(2.2rem,6vw,5.5rem)] leading-tight text-[#f0ede8] mb-6">
          {"Let's build"}
          <br />
          <span className="italic text-[#888888]">something together.</span>
        </h2>
        <p className="text-[#666666] text-sm leading-relaxed mb-10 md:mb-16 max-w-sm">
          Open to internships, collaborations, and interesting problems. If you have
          something worth building, I want to hear about it.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 md:gap-12 border-t border-[#222222] pt-10 md:pt-16">
          {CONTACT_LINKS.map(({ label, value, href }) => (
            <div key={label}>
              <p className="text-[#c9191e] text-xs uppercase tracking-[0.25em] mb-3">
                {label}
              </p>
              <a
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="text-[#f0ede8] text-sm hover:text-[#c9191e] transition-colors duration-300"
              >
                {value}
              </a>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
