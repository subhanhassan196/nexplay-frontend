import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle for small, fast Docker images.
  output: "standalone",

  images: {
    // Modern formats first — roughly 30% smaller than JPEG at the same
    // quality, with automatic fallback for older browsers.
    formats: ["image/avif", "image/webp"],
    // Card widths we actually render at; trimming the list means fewer
    // variants generated and cached.
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Cloudinary — user-uploaded avatars, banners and chat attachments
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },

  // Trim the client bundle: only the icons actually imported get shipped.
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"],
  },
};

export default nextConfig;
