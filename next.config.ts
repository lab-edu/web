import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const coreOrigin = process.env.NEXT_PUBLIC_CORE_ORIGIN ?? "http://localhost:8080";

    return [
      {
        source: "/core/:path*",
        destination: `${coreOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;
