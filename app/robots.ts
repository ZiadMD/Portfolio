import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://ziad-sheashaa.me"

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      // Explicitly allow leading AI search engines & LLM crawlers
      {
        userAgent: [
          "Googlebot",
          "Bingbot",
          "GPTBot",
          "ChatGPT-User",
          "OAI-SearchBot",
          "ClaudeBot",
          "Claude-Web",
          "PerplexityBot",
          "Google-Extended",
          "Applebot",
          "Applebot-Extended",
          "CCBot",
          "cohere-ai",
          "Meta-ExternalAgent",
          "Amazonbot",
        ],
        allow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
