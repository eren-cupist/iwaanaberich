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
};

export default nextConfig;
