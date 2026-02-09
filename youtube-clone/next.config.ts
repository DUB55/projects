import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enabled dynamic rendering (removed output: export)
  // This allows Supabase-backed pages to work without pre-rendering everything at build time.

  // Disable image optimization (can be re-enabled if not on a static host)
  images: {
    unoptimized: true,
  },

  // Trailing slashes for better SEO
  trailingSlash: true,
};

export default nextConfig;
