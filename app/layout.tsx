import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import "./globals.css";

const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

const inter = Inter({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const BASE_URL = "https://ziad-sheashaa.me";

export const viewport: Viewport = {
  themeColor: "#080808",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Ziad M. Sheashaa — Software & AI Engineer",
    template: "%s | Ziad M. Sheashaa",
  },
  description:
    "Portfolio of Ziad M. Sheashaa, a Software & AI Engineer specializing in Machine Learning, Computer Vision, Autonomous Systems, and Full-Stack development.",
  keywords: [
    "Ziad M. Sheashaa",
    "Ziad Sheashaa",
    "Software Engineer",
    "AI Engineer",
    "Machine Learning Engineer",
    "Computer Vision",
    "Deep Learning",
    "Python",
    "TypeScript",
    "React",
    "Next.js",
    "PyTorch",
    "TensorFlow",
    "ROS",
    "Robotics",
    "Autonomous Driving",
    "Portfolio",
  ],
  authors: [{ name: "Ziad M. Sheashaa", url: BASE_URL }],
  creator: "Ziad M. Sheashaa",
  publisher: "Ziad M. Sheashaa",
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Ziad M. Sheashaa Portfolio",
    title: "Ziad M. Sheashaa — Software & AI Engineer",
    description:
      "Building at the intersection of code and intelligence. Machine Learning, Computer Vision, Robotics, and Full-Stack Applications.",
    images: [
      {
        url: "/images/desktop-profile-with-background.jpg",
        width: 1200,
        height: 630,
        alt: "Ziad M. Sheashaa — Software & AI Engineer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ziad M. Sheashaa — Software & AI Engineer",
    description:
      "Building at the intersection of code and intelligence. Machine Learning, Computer Vision, Robotics, and Full-Stack Applications.",
    images: ["/images/desktop-profile-with-background.jpg"],
    creator: "@ZiadMD",
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
    icon: "/images/desktop-profile-with-background.jpg",
    shortcut: "/images/desktop-profile-with-background.jpg",
    apple: "/images/desktop-profile-with-background.jpg",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${BASE_URL}/#person`,
      name: "Ziad M. Sheashaa",
      alternateName: "Ziad Sheashaa",
      url: BASE_URL,
      image: `${BASE_URL}/images/desktop-profile-with-background.jpg`,
      jobTitle: "Software & AI Engineer",
      description:
        "Software & AI Engineer specializing in Machine Learning, Computer Vision, Autonomous Systems, and Full-Stack Engineering.",
      sameAs: [
        "https://github.com/ZiadMD",
        "https://www.linkedin.com/in/ziadmsheashaa",
        "mailto:ziadmsheashaa@gmail.com",
      ],
      knowsAbout: [
        "Artificial Intelligence",
        "Machine Learning",
        "Deep Learning",
        "Computer Vision",
        "Robotics",
        "Autonomous Systems",
        "Python",
        "TypeScript",
        "Next.js",
        "PyTorch",
        "TensorFlow",
        "C++",
        "ROS",
      ],
    },
    {
      "@type": "ProfilePage",
      "@id": `${BASE_URL}/#webpage`,
      url: BASE_URL,
      name: "Ziad M. Sheashaa — Software & AI Engineer Portfolio",
      isPartOf: {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        url: BASE_URL,
        name: "Ziad M. Sheashaa Portfolio",
      },
      mainEntity: {
        "@id": `${BASE_URL}/#person`,
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSerifDisplay.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
