import {
  Project,
  ExperienceItem,
  StatItem,
  SocialLink,
  NavLink,
} from "../types/portfolio"

export const PORTRAIT_IMAGES = {
  desktop: {
    bg: "/images/desktop-profile-with-background.jpg",
    cutout: "/images/desktop-profile-without-background.png",
  },
  mobile: {
    bg: "/images/mobile-profile-with-background.png",
    cutout: "/images/mobile-profile-without-background.png",
  },
} as const

export const NAV_LINKS: NavLink[] = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "work", label: "Work" },
  { id: "contact", label: "Contact" },
]

export const SKILLS: string[] = [
  "Python",
  "TypeScript",
  "PyTorch",
  "LangChain",
  "LangGraph",
  "RAG",
  "FastAPI",
  "React",
  "Docker",
  "LLM fine-tuning",
  "Vector DBs",
  "OpenCV",
  "TensorFlow",
]

export const STATS: StatItem[] = [
  { value: 9, label: "Projects" },
  { value: 5, label: "Engineering domains" },
  { value: 13, label: "Core technologies" },
]

export const EXPERIENCE_DATA: ExperienceItem[] = [
  {
    when: "Now",
    role: "AI Engineer",
    company: "Nexus",
    location: "Ismailia, Egypt",
    points: [
      "Building agentic and generative AI systems end to end.",
      "LLM orchestration with LangChain and LangGraph.",
      "Retrieval-augmented generation (RAG) pipelines.",
      "Multi-agent workflows.",
    ],
  },
  {
    when: "Leadership",
    role: "Autonomous Driving Leader",
    company: "SCU Racing Team · Suez Canal University",
    points: [
      "Lead the autonomous driving effort of the university racing team.",
    ],
  },
  {
    when: "Teaching",
    role: "AI Instructor",
    company: "IEEE · Suez Canal University",
  },
  {
    when: "Community",
    role: "AI Vice Leader",
    company: "Microsoft Student Community · Suez Canal University",
  },
  {
    when: "Independent",
    role: "Custom model training & annotation",
    company: "Freelance",
    points: [
      "Deep learning and computer vision models, plus dataset annotation for classification and object detection.",
    ],
  },
  {
    when: "Education",
    role: "B.Sc. Computer Engineering",
    company: "Suez Canal University",
  },
]

export const CONTACT_LINKS: SocialLink[] = [
  {
    label: "Email",
    value: "ziadmohamedgamal25@gmail.com",
    href: "mailto:ziadmohamedgamal25@gmail.com",
  },
  { label: "GitHub", value: "@ZiadMD", href: "https://github.com/ZiadMD" },
  {
    label: "LinkedIn",
    value: "Ziad M. Sheashaa",
    href: "https://www.linkedin.com/in/ziad-sheashaa/",
  },
  { label: "Location", value: "Available Remote · Ismailia, EG", href: "#" },
]

export const PROJECTS: Project[] = [
  {
    id: 1,
    title: "Basira",
    subtitle: "AI screening platform for schools",
    description:
      "An AI-powered screening and psychological assessment platform for schools, providing early detection of behavioral and emotional indicators with secure analytics.",
    tech: ["Next.js", "TypeScript", "Node.js", "MongoDB", "AI"],
    category: "AI",
    githubUrl: "https://github.com/aboellil0/Basira",
    img: "/images/basira.jpg",
    hue: 200,
  },
  {
    id: 2,
    title: "NexCut",
    subtitle: "Multi-track desktop video editor in C++20",
    description:
      "A high-performance multi-track desktop video editor in C++20 with a strictly decoupled headless engine, timeline architecture, FFmpeg decoding, and Qt 6 GUI.",
    tech: ["C++20", "Qt 6", "FFmpeg", "Audio/Video pipeline"],
    category: "Software",
    githubUrl: "https://github.com/Mohanadmomen/Nxtcut",
    img: "/images/nexcut.jpg",
    hue: 20,
  },
  {
    id: 3,
    title: "NASA 2025 — TERRA",
    subtitle: "ML climate predictions from NASA data",
    description:
      "Educational web platform using Scikit-learn ML models to predict climate patterns from NASA data, with a Gemini API chatbot and interactive game.",
    tech: ["Next.js", "TypeScript", "Scikit-learn", "Gemini API"],
    category: "AI",
    demoUrl: "https://spatuim.vercel.app/",
    githubUrl: "https://github.com/ZiadMD/Nasa-2025",
    img: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=560&fit=crop&auto=format",
    hue: 220,
  },
  {
    id: 4,
    title: "EVER 5th Generation",
    subtitle: "AI-powered autonomous truck system",
    description:
      "An AI-powered autonomous truck system combining machine learning, PID controllers, and computer vision for intelligent lane changes.",
    tech: ["Python", "ROS", "Autonomous driving"],
    category: "Robotics",
    githubUrl: "https://github.com/ZiadMD/EVER_CLoseLoop",
    img: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=560&fit=crop&auto=format",
    hue: 350,
  },
  {
    id: 5,
    title: "Cat-Dog Classifier",
    subtitle: "PySide6 + TensorFlow image classifier",
    description:
      "A PySide6 application using TensorFlow for image classification, featuring a customizable model to distinguish between cats and dogs.",
    tech: ["Python", "PySide6", "TensorFlow", "Deep learning"],
    category: "AI",
    githubUrl: "https://github.com/ZiadMD/cat-dog-classifier",
    img: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=560&fit=crop&auto=format",
    hue: 140,
  },
  {
    id: 6,
    title: "Qt-Cascade-app",
    subtitle: "Real-time object detection desktop app",
    description:
      "A desktop object detection application built with Qt and OpenCV using Haar cascade classifiers for real-time computer vision tasks.",
    tech: ["C++", "Qt", "OpenCV", "Computer vision"],
    category: "Software",
    githubUrl: "https://github.com/ZiadMD/Qt-Cascade-app",
    img: "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=800&h=560&fit=crop&auto=format",
    hue: 280,
  },
  {
    id: 7,
    title: "StudentOps",
    subtitle: "Platform for student activities and organizations",
    description:
      "A platform for student activities and organizations with flexible roles and permissions, task submission and review, attendance tracking, scoring, and an AI agent that sends reminders and follows up.",
    note: "Started at an AWS hackathon and kept going afterwards.",
    tech: ["React", "FastAPI", "Supabase", "AI agents"],
    category: "Software",
    hue: 170,
  },
  {
    id: 8,
    title: "Nexcut Studio",
    subtitle: "Agentic video editor with on-device AI",
    description:
      "An Electron-based agentic non-linear video editor with an on-device AI service. My part is the agent layer: MCP-compliant tools, validated tool calls with a retry loop, and a model stack with Whisper, SAM2 and Kokoro.",
    tech: ["Electron", "MCP", "Zod", "Whisper", "SAM2"],
    category: "AI",
    hue: 300,
  },
  {
    id: 9,
    title: "Fitness, Nutrition & PT",
    subtitle: "Graduation project: online care platform",
    description:
      "A graduation-project platform combining fitness, nutrition, and physical therapy services, built together with a team of five students.",
    tech: ["React", "Node.js", "SQLite", "Figma"],
    category: "Software",
    githubUrl: "https://github.com/ZiadMD/Nutrition-Graduation-Project",
    hue: 100,
  },
]
