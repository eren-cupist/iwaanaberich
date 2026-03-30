import type { NextConfig } from "next";

// Next.js 15 기본 설정
const nextConfig: NextConfig = {
  // 이미지 외부 도메인 허용 (Google 프로필 이미지)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  // 브라우저 → Next.js 서버 → 백엔드 프록시 (CORS 우회)
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: "http://localhost:4000/:path*",
      },
    ];
  },
};

export default nextConfig;
