import type { NextConfig } from "next";

const DEFAULT_IMAGE_ALLOWED_ORIGINS = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://demo.lab-edu.team:8080",
];

function parseAllowedOrigins(value: string | undefined) {
  const rawOrigins = value
    ? value.split(",").map((item) => item.trim()).filter(Boolean)
    : DEFAULT_IMAGE_ALLOWED_ORIGINS;

  return rawOrigins
    .map((origin) => {
      try {
        const parsed = new URL(origin);
        return {
          protocol: parsed.protocol.replace(":", ""),
          hostname: parsed.hostname,
          port: parsed.port || (parsed.protocol === "https:" ? "443" : "80"),
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
