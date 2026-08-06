import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Run as a native Node dependency rather than being webpack-bundled — pdfjs-dist's
  // optional canvas/worker file references break under bundling in a route handler.
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;
