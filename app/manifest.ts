import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ziad M. Sheashaa — Software & AI Engineer",
    short_name: "Ziad Sheashaa",
    description:
      "Software & AI Engineer specializing in Machine Learning, Computer Vision, Autonomous Systems, and Full-Stack Engineering.",
    start_url: "/",
    display: "standalone",
    background_color: "#080808",
    theme_color: "#080808",
    icons: [
      {
        src: "/images/desktop-profile-with-background.jpg",
        sizes: "192x192 512x512",
        type: "image/jpeg",
      },
    ],
  }
}
