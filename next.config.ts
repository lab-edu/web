import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

const DEFAULT_IMAGE_ALLOWED_ORIGINS = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://demo.lab-edu.team:8080",
];

function parseAllowedOrigins(value: string | undefined): RemotePattern[] {
  const rawOrigins = value
    ? value.split(",").map((item) => item.trim()).filter(Boolean)
    : DEFAULT_IMAGE_ALLOWED_ORIGINS;

  return rawOrigins
    .map((origin) => {
      try {
        const parsed = new URL(origin);
        const protocol = parsed.protocol.replace(":", "") as "http" | "https";
        return {
          protocol,
          hostname: parsed.hostname,
          port: parsed.port || "",
          pathname: "/api/v1/resources/**",
        };
      } catch {
        return null;
      }
    })
    .filter((pattern): pattern is NonNullable<typeof pattern> => pattern !== null);
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: parseAllowedOrigins(process.env.NEXT_IMAGE_ALLOWED_ORIGINS),
  },
};

export default nextConfig;
