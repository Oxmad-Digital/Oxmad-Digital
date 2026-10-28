import type { NextConfig } from "next";
import mediaConfig from "./lib/media-config.json";

const mediaPublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || mediaConfig.publicUrl;
const mediaOrigin = mediaPublicUrl ? new URL(mediaPublicUrl) : null;

const nextConfig: NextConfig = {
  experimental: {
    // TypeScript 5 exposes the compiler API. This avoids Node 24 dropping the
    // captured stdout of Next's experimental CLI checker during `next build`.
    useTypeScriptCli: false,
    // app/global-not-found.tsx: the 404 page shared by the site, admin and client root layouts.
    globalNotFound: true,
  },
  // Read with fs at runtime (lib/geo.ts), so the tracer can't see it.
  outputFileTracingIncludes: {
    "/api/track": ["./data/dbip-country-lite.mmdb"],
  },
  // Pages removed by the redesign, which may still be indexed or linked from client domains.
  async redirects() {
    return [
      { source: "/site-en-developpement", destination: "/", permanent: true },
      { source: "/site-en-refonte", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
      // The sign-in token lives in this URL: never leak it through the Referer header.
      {
        source: "/espace-client/connexion/verifier",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
    ];
  },
  images: {
    qualities: [75, 90, 92],
    remotePatterns: mediaOrigin ? [{
      protocol: "https",
      hostname: mediaOrigin.hostname,
      port: "",
      pathname: `${mediaOrigin.pathname.replace(/\/$/, "")}/images/oxmad-digital-*.webp`,
      search: "",
    }] : [],
  },
};

export default nextConfig;
