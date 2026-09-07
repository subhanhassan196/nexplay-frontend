import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/constants";

const routes = [
  "",
  "/games",
  "/categories",
  "/leaderboards",
  "/tournaments",
  "/rewards",
  "/community",
  "/about",
  "/contact",
  "/faq",
  "/terms",
  "/privacy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${SITE_CONFIG.url}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
