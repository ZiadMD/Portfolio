import { Project, ProjectCategory, SocialLink, NavLink } from "../types/portfolio";

export const PORTRAIT_IMAGES = {
  desktop: {
    bg: "/images/desktop-profile-with-background.jpg",
    cutout: "/images/desktop-profile-without-background.png",
  },
  mobile: {
    bg: "/images/mobile-profile-with-background.png",
    cutout: "/images/mobile-profile-without-background.png",
  },
} as const;

export const CATEGORIES: ProjectCategory[] = ["All", "Software", "AI", "Robotics"];

export const NAV_LINKS: NavLink[] = [
  { id: "about", label: "about" },
  { id: "work", label: "work" },
  { id: "contact", label: "contact" },
];

export const SKILLS: string[] = [
  "Python",
  "TypeScript",
  "PyTorch",
  "LangChain",
  "RAG",
  "FastAPI",
  "React",
  "Docker",
  "LLM Fine-tuning",
  "Vector DBs",
];

export const CONTACT_LINKS: SocialLink[] = [
  { label: "Email", value: "ziadmohamedgamal25@gmail.com", href: "mailto:ziadmohamedgamal25@gmail.com" },
  { label: "GitHub", value: "@ZiadMD", href: "https://github.com/ZiadMD" },
  { label: "LinkedIn", value: "Ziad M. Sheashaa", href: "https://www.linkedin.com/in/ziad-sheashaa/" },
  { label: "Location", value: "Available Remote", href: "#" },
];

export const PROJECTS: Project[] = [
  {
    id: 1,
    title: "Basira",
    description: "An AI-powered screening and psychological assessment platform for schools, providing early detection of behavioral and emotional indicators with secure analytics.",
    tech: ["Next.js", "TypeScript", "Node.js", "MongoDB", "AI"],
    category: "AI",
    featured: true,
    demoUrl: "#",
    githubUrl: "https://github.com/aboellil0/Basira",
    img: "/images/basira.jpg",
  },
  {
    id: 2,
    title: "NexCut",
    description: "A high-performance multi-track desktop video editor in C++20 with a strictly decoupled headless engine, timeline architecture, FFmpeg decoding, and Qt 6 GUI.",
    tech: ["C++20", "Qt 6", "FFmpeg", "Audio/Video Pipeline"],
    category: "Software",
    featured: true,
    demoUrl: "#",
    githubUrl: "https://github.com/Mohanadmomen/Nxtcut",
    img: "/images/nexcut.jpg",
  },
  {
    id: 3,
    title: "NASA 2025 — TERRA",
    description: "Educational web platform using Scikit-learn ML models to predict climate patterns from NASA data, with a Gemini API chatbot and interactive game.",
    tech: ["Next.js", "TypeScript", "Scikit-learn", "Gemini API"],
    category: "AI",
    featured: true,
    demoUrl: "https://spatuim.vercel.app/",
    githubUrl: "https://github.com/ZiadMD/Nasa-2025",
    img: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=560&fit=crop&auto=format",
  },
  {
    id: 4,
    title: "EVER 5th Generation",
    description: "An AI-powered autonomous truck system combining machine learning, PID controllers, and computer vision for intelligent lane changes.",
    tech: ["Python", "ROS", "Autonomous Driving"],
    category: "Robotics",
    featured: true,
    demoUrl: "#",
    githubUrl: "https://github.com/ZiadMD/EVER_CLoseLoop",
    img: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=560&fit=crop&auto=format",
  },
  {
    id: 5,
    title: "Cat-Dog Classifier",
    description: "A PySide6 application using TensorFlow for image classification, featuring a customizable model to distinguish between cats and dogs.",
    tech: ["Python", "PySide6", "TensorFlow", "Deep Learning"],
    category: "AI",
    featured: true,
    demoUrl: "#",
    githubUrl: "https://github.com/ZiadMD/cat-dog-classifier",
    img: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=560&fit=crop&auto=format",
  },
  {
    id: 6,
    title: "Qt-Cascade-app",
    description: "A desktop object detection application built with Qt and OpenCV using Haar cascade classifiers for real-time computer vision tasks.",
    tech: ["C++", "Qt", "OpenCV", "Computer Vision"],
    category: "Software",
    featured: true,
    demoUrl: "#",
    githubUrl: "https://github.com/ZiadMD/Qt-Cascade-app",
    img: "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=800&h=560&fit=crop&auto=format",
  },
  {
    id: 7,
    title: "AuthMaster",
    description: "A secure login system built with Python's Tkinter library featuring sign-up, sign-in, and SHA-256 password hashing capabilities.",
    tech: ["Python", "GUI", "Hashing"],
    category: "Software",
    featured: false,
    demoUrl: "#",
    githubUrl: "https://github.com/ZiadMD/AuthMaster",
    img: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&h=560&fit=crop&auto=format",
  },
  {
    id: 8,
    title: "Library Management System",
    description: "A Library Management System in C++ using doubly linked lists for efficient book record management with sorting and searching.",
    tech: ["C++", "Data Structures", "Algorithms"],
    category: "Software",
    featured: false,
    demoUrl: "#",
    githubUrl: "https://github.com/ZiadMD/LMS",
    img: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=560&fit=crop&auto=format",
  },
  {
    id: 9,
    title: "Numerical Analysis App",
    description: "A Linux-optimized C++17 application implementing numerical analysis algorithms with Qt6 GUI for root finding and curve fitting.",
    tech: ["C++", "Qt", "Linux"],
    category: "Software",
    featured: false,
    demoUrl: "#",
    githubUrl: "https://github.com/ZiadMD/Numerical-Analysis-project",
    img: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=560&fit=crop&auto=format",
  },
];
