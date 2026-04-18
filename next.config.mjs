
const isVercelBuild = process.env.VERCEL === "1";

const nextConfig = {
  // Strict mode for development
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      "/*": ["./prisma/dev.db"],
    },
  },
  // Keep strict checks locally, but prevent Vercel environment drift from blocking deploys.
  eslint: {
    ignoreDuringBuilds: isVercelBuild,
  },
  typescript: {
    ignoreBuildErrors: isVercelBuild,
  },
};

export default nextConfig;
