import {
  Project,
  ExperienceItem,
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
  {
    label: "Resume",
    value: "Download CV (PDF) ↓",
    href: "/Ziad_Mohamed_Sheashaa_CV.pdf",
  },
]

export const FEATURED_PROJECTS: Project[] = [
  {
    id: 1,
    title: "Basira",
    subtitle: "AI screening platform for schools",
    description:
      "An AI-powered screening and psychological assessment platform for schools, providing early detection of behavioral and emotional indicators with secure analytics.",
    tech: ["Next.js", "TypeScript", "Node.js", "MongoDB", "AI"],
    category: "AI",
    demoUrl: "https://bassira.org",
    githubUrl: "https://github.com/aboellil0/Basira",
    img: "/images/basira.jpg",
    hue: 200,
  },
  {
    id: 2,
    title: "Nexcut Studio",
    subtitle: "Agentic desktop video editor with on-device AI",
    description:
      "An Electron-based agentic video editor with an on-device AI service. The agent subsystem translates natural-language editing instructions into timeline actions using MCP-compliant tools, validated tool calls with retry loops, and a local model stack with Whisper, SAM2, and Kokoro.",
    tech: ["Electron", "TypeScript", "MCP", "Whisper", "SAM2", "Kokoro"],
    category: "AI",
    githubUrl: "https://github.com/Mohanadmomen/Nxtcut",
    img: "/images/nexcut.jpg",
    hue: 20,
  },
  {
    id: 9,
    title: "Safespace",
    subtitle: "Edge road-safety and accident detection system",
    description:
      "A road-monitoring system built in three parts: an edge node on a Raspberry Pi with a Sony IMX500 AI camera that runs accident-detection models and streams RTSP, a containerized YOLOv8 central AI service for accident inference and license-plate extraction, and a training and evaluation pipeline for the models. Nodes report to the central unit over Socket.IO and WebSockets.",
    tech: ["Python", "YOLOv8", "Raspberry Pi", "RTSP", "Docker", "PyQt6"],
    category: "AI",
    githubUrl: "https://github.com/ZiadMD/Safespace_node",
    hue: 30,
  },
  {
    id: 10,
    title: "ScreenSeekeR",
    subtitle: "Vision-based Windows desktop automation",
    description:
      "A desktop automation system that finds UI elements from natural-language descriptions using a cascaded visual-grounding search inspired by the ScreenSeekeR paper: region proposals ranked by Gaussian centrality and non-maximum suppression, then recursive crop refinement. Works with Gemini, OpenAI, Groq or local Ollama vision models, corrects for DPI scaling, and includes a watchdog that dismisses blocking dialogs.",
    tech: ["Python", "Vision LLMs", "PyAutoGUI", "Gemini", "Ollama"],
    category: "AI",
    githubUrl: "https://github.com/ZiadMD/ScreenSeekeR-Desktop-Automation",
    hue: 260,
  },
  {
    id: 3,
    title: "NASA 2025: TERRA",
    subtitle: "ML climate predictions from NASA data",
    description:
      "Educational web platform using Scikit-learn ML models to predict climate patterns from NASA data, with a Gemini API chatbot and interactive game.",
    tech: ["Next.js", "TypeScript", "Scikit-learn", "Gemini API"],
    category: "AI",
    demoUrl: "https://spatuim.vercel.app/",
    githubUrl: "https://github.com/ZiadMD/Nasa-2025",
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
    hue: 280,
  },
  {
    id: 11,
    title: "Computer Vision x Arduino",
    subtitle: "Face and hand tracking that drives hardware",
    description:
      "MediaPipe face and hand detection on a PC camera, turned into small labels or finger counts and sent over a serial protocol to an Arduino that shows them as LED patterns. Includes the Arduino sketch, wiring notes and a step-by-step build guide.",
    tech: ["Python", "MediaPipe", "OpenCV", "Arduino", "Serial"],
    category: "Robotics",
    githubUrl: "https://github.com/ZiadMD/Computer-Vision-x-Arduino",
    hue: 190,
  },
]

export const WORKING_ON_NOW_PROJECTS: Project[] = [
  {
    id: 7,
    title: "Thaj",
    subtitle: "Platform for student activities & organizations",
    description:
      "A comprehensive platform for student activities and organizations with flexible roles and permissions, task submission and review, attendance tracking, scoring, and an AI agent that sends reminders and automated follow-ups.",
    note: "Started at an AWS hackathon and actively in development.",
    tech: ["React", "FastAPI", "Supabase", "AI agents"],
    category: "Software",
    hue: 170,
    comingSoon: true,
    isWorkingOnNow: true,
  },
  {
    id: 8,
    title: "Fitness, Nutrition & PT",
    subtitle: "Graduation project: online care platform",
    description:
      "A graduation-project platform combining fitness, nutrition, and physical therapy services, built together with a team of five students.",
    tech: ["React", "Node.js", "SQLite", "Figma"],
    category: "Software",
    githubUrl: "https://github.com/ZiadMD/Nutrition-Graduation-Project",
    hue: 100,
    comingSoon: true,
    isWorkingOnNow: true,
  },
]

export const PROJECTS: Project[] = [
  ...FEATURED_PROJECTS,
  ...WORKING_ON_NOW_PROJECTS,
]
