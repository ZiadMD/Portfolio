export type ProjectCategory = "All" | "Software" | "AI" | "Robotics"

export interface Project {
  id: number
  title: string
  subtitle: string
  description: string
  note?: string
  tech: string[]
  category: "Software" | "AI" | "Robotics"
  demoUrl?: string
  githubUrl?: string
  img?: string
  hue: number
}

export interface ExperienceItem {
  when: string
  role: string
  company: string
  location?: string
  points?: string[]
}

export interface StatItem {
  value: number
  label: string
}

export interface SocialLink {
  label: string
  value: string
  href: string
}

export interface NavLink {
  id: string
  label: string
}
