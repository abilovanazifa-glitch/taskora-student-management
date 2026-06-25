import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/ja/dashboard", "/uz/dashboard", "/ja/tasks", "/uz/tasks"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
