import type { Metadata, Viewport } from "next"
import {
  Space_Grotesk,
  JetBrains_Mono,
  Instrument_Serif,
} from "next/font/google"
import "./globals.css"

const spaceGrotesk = Space_Grotesk({
  weight: ["500", "700"],
  subsets: ["latin"],
  variable: "--font-disp",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: "italic",
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
})

const BASE_URL = "https://ziad-sheashaa.me"

export const viewport: Viewport = {
  themeColor: "#09090a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Ziad M. Sheashaa | Software & AI Engineer",
    template: "%s | Ziad M. Sheashaa",
  },
  description:
    "Portfolio of Ziad M. Sheashaa, a Software & AI Engineer specializing in Agentic AI, Autonomous Systems, Computer Vision, Machine Learning, and Full-Stack Engineering.",
  keywords: [
    "Ziad M. Sheashaa",
    "Ziad Sheashaa",
    "Software Engineer",
    "AI Engineer",
    "Agentic AI",
    "Machine Learning Engineer",
    "Computer Vision Engineer",
    "Autonomous Driving Leader",
    "LangChain",
    "LangGraph",
    "RAG",
    "LLM Orchestration",
    "Python",
    "TypeScript",
    "React",
    "Next.js",
    "FastAPI",
    "PyTorch",
    "TensorFlow",
    "C++20",
    "ROS",
    "Robotics",
    "Autonomous Systems",
    "Basira",
    "Nexcut Studio",
    "Thaj",
    "Portfolio",
    "Ismailia Egypt",
    "Remote Engineer",
  ],
  authors: [{ name: "Ziad M. Sheashaa", url: BASE_URL }],
  creator: "Ziad M. Sheashaa",
  publisher: "Ziad M. Sheashaa",
  category: "technology",
  classification: "Software & AI Engineering Portfolio",
  applicationName: "Ziad M. Sheashaa Portfolio",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      "en-US": BASE_URL,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Ziad M. Sheashaa | Software & AI Engineer",
    title: "Ziad M. Sheashaa | Software & AI Engineer",
    description:
      "Building at the intersection of code and intelligence. Machine Learning, Computer Vision, Agentic AI, and Full-Stack Systems.",
    images: [
      {
        url: "/images/desktop-profile-with-background.jpg",
        width: 1200,
        height: 630,
        alt: "Ziad M. Sheashaa | Software & AI Engineer Portfolio",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ziad M. Sheashaa | Software & AI Engineer",
    description:
      "Building at the intersection of code and intelligence. Machine Learning, Computer Vision, Agentic AI, and Full-Stack Systems.",
    images: [
      {
        url: "/images/desktop-profile-with-background.jpg",
        alt: "Ziad M. Sheashaa | Software & AI Engineer",
      },
    ],
    creator: "@ZiadMD",
    site: "@ZiadMD",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${BASE_URL}/#person`,
      name: "Ziad M. Sheashaa",
      alternateName: ["Ziad Sheashaa", "ZiadMD"],
      url: BASE_URL,
      image: `${BASE_URL}/images/desktop-profile-with-background.jpg`,
      jobTitle: "Software & AI Engineer",
      description:
        "Software & AI Engineer specializing in Machine Learning, Computer Vision, Autonomous Systems, and Full-Stack Engineering.",
      worksFor: {
        "@type": "Organization",
        name: "Nexus",
      },
      alumniOf: {
        "@type": "EducationalOrganization",
        name: "Suez Canal University",
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Ismailia",
        addressCountry: "EG",
      },
      email: "mailto:ziadmohamedgamal25@gmail.com",
      sameAs: [
        "https://github.com/ZiadMD",
        "https://www.linkedin.com/in/ziad-sheashaa/",
      ],
      knowsAbout: [
        "Artificial Intelligence",
        "Machine Learning",
        "Deep Learning",
        "Computer Vision",
        "Robotics",
        "Autonomous Systems",
        "Agentic AI",
        "LangChain",
        "LangGraph",
        "RAG",
        "FastAPI",
        "Python",
        "TypeScript",
        "React",
        "Next.js",
        "PyTorch",
        "TensorFlow",
        "C++",
        "ROS",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: "Ziad M. Sheashaa | Portfolio",
      description:
        "Official engineering portfolio of Ziad M. Sheashaa, Software & AI Engineer.",
      publisher: {
        "@id": `${BASE_URL}/#person`,
      },
    },
    {
      "@type": "ProfilePage",
      "@id": `${BASE_URL}/#webpage`,
      url: BASE_URL,
      name: "Ziad M. Sheashaa | Software & AI Engineer Portfolio",
      isPartOf: {
        "@id": `${BASE_URL}/#website`,
      },
      mainEntity: {
        "@id": `${BASE_URL}/#person`,
      },
    },
    {
      "@type": "ItemList",
      "@id": `${BASE_URL}/#projects`,
      name: "Featured Engineering Projects",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          item: {
            "@type": "SoftwareApplication",
            name: "Basira",
            description:
              "AI-powered screening and psychological assessment platform for schools with early behavioral detection.",
            applicationCategory: "HealthApplication",
            operatingSystem: "Web",
            url: "https://bassira.org",
            codeRepository: "https://github.com/aboellil0/Basira",
          },
        },
        {
          "@type": "ListItem",
          position: 2,
          item: {
            "@type": "SoftwareApplication",
            name: "Nexcut Studio",
            description:
              "Agentic desktop video editor with an on-device AI service, timeline architecture, MCP-compliant tools, and local model inference.",
            applicationCategory: "MultimediaApplication",
            operatingSystem: "Desktop",
            codeRepository: "https://github.com/Mohanadmomen/Nxtcut",
          },
        },
        {
          "@type": "ListItem",
          position: 3,
          item: {
            "@type": "SoftwareApplication",
            name: "NASA 2025: TERRA",
            description:
              "Educational web platform using Scikit-learn ML models to predict climate patterns from NASA data, with Gemini API chatbot.",
            url: "https://spatuim.vercel.app/",
            codeRepository: "https://github.com/ZiadMD/Nasa-2025",
          },
        },
        {
          "@type": "ListItem",
          position: 4,
          item: {
            "@type": "SoftwareApplication",
            name: "EVER 5th Generation",
            description:
              "AI-powered autonomous truck system combining machine learning, PID controllers, and computer vision for lane changes.",
            applicationCategory: "Automotive",
            codeRepository: "https://github.com/ZiadMD/EVER_CLoseLoop",
          },
        },
        {
          "@type": "ListItem",
          position: 5,
          item: {
            "@type": "SoftwareApplication",
            name: "Cat-Dog Classifier",
            description:
              "PySide6 application using TensorFlow for deep learning image classification.",
            codeRepository: "https://github.com/ZiadMD/cat-dog-classifier",
          },
        },
        {
          "@type": "ListItem",
          position: 6,
          item: {
            "@type": "SoftwareApplication",
            name: "Qt-Cascade-app",
            description:
              "Real-time object detection desktop application built with Qt and OpenCV using Haar cascade classifiers.",
            codeRepository: "https://github.com/ZiadMD/Qt-Cascade-app",
          },
        },
        {
          "@type": "ListItem",
          position: 7,
          item: {
            "@type": "SoftwareApplication",
            name: "Safespace",
            description:
              "Edge road-safety system: a Raspberry Pi node with an AI camera running accident detection, and a containerized YOLOv8 central service for accident inference and license-plate extraction.",
            codeRepository: "https://github.com/ZiadMD/Safespace_node",
          },
        },
        {
          "@type": "ListItem",
          position: 8,
          item: {
            "@type": "SoftwareApplication",
            name: "ScreenSeekeR",
            description:
              "Vision-based Windows desktop automation using cascaded visual grounding to locate UI elements from natural-language descriptions.",
            codeRepository:
              "https://github.com/ZiadMD/ScreenSeekeR-Desktop-Automation",
          },
        },
        {
          "@type": "ListItem",
          position: 9,
          item: {
            "@type": "SoftwareApplication",
            name: "Computer Vision x Arduino",
            description:
              "MediaPipe face and hand tracking that sends labels over serial to an Arduino driving LED patterns.",
            codeRepository: "https://github.com/ZiadMD/Computer-Vision-x-Arduino",
          },
        },
        {
          "@type": "ListItem",
          position: 10,
          item: {
            "@type": "SoftwareApplication",
            name: "Thaj",
            description:
              "Platform for student activities & organizations with flexible roles, task review, scoring, and automated AI agents.",
          },
        },
        {
          "@type": "ListItem",
          position: 11,
          item: {
            "@type": "SoftwareApplication",
            name: "Fitness, Nutrition & PT",
            description:
              "Graduation-project platform combining fitness, nutrition, and physical therapy services.",
            codeRepository:
              "https://github.com/ZiadMD/Nutrition-Graduation-Project",
          },
        },
      ],
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable}`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            // Before first paint: mark JS on, remember a seen intro, and put
            // the page into the intro screen (unless reduced motion). If the
            // app never takes over, release the page after 4s anyway.
            __html: `(function(){var d=document.documentElement;d.classList.add('js');try{if(localStorage.getItem('zs-intro-seen'))d.classList.add('intro-seen');localStorage.removeItem('zs-theme');d.dataset.theme='dark';}catch(e){}try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){d.dataset.introState='playing';setTimeout(function(){if(!d.classList.contains('intro-live'))delete d.dataset.introState},4000)}}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
