export type ProjectCategory = "All" | "Software" | "AI" | "Robotics";

export interface Project {
  id: number;
  title: string;
  description: string;
  tech: string[];
  category: "Software" | "AI" | "Robotics";
  featured: boolean;
  demoUrl?: string;
  githubUrl?: string;
  img: string;
}

export interface SocialLink {
  label: string;
  value: string;
  href: string;
}

export interface NavLink {
  id: string;
  label: string;
}
