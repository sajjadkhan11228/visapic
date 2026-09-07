import type { MetadataRoute } from "next";

const routes = [
  "",
  "/passport-photo",
  "/passport-photo-maker",
  "/passport-photo-size",
  "/passport-photo-sheet",
  "/photo-print-sheet",
  "/image-cropper",
  "/image-resizer",
  "/image-compressor",
  "/image-size-reducer",
  "/jpg-to-png",
  "/image-to-jpg",
  "/background-changer",
  "/photo-to-pdf",
  "/dpi-converter",
  "/about",
  "/privacy",
  "/terms",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
