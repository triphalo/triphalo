import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://www.triphalo.com", changeFrequency: "yearly", priority: 1 },
  ];
}
