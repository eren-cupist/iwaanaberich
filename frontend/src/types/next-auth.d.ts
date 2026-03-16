import "next-auth";
import "next-auth/jwt";
import { DefaultSession } from "next-auth";

// next-auth Session 타입 확장 - 백엔드 토큰 및 유저 정보 추가
declare module "next-auth" {
  interface Session extends DefaultSession {
    backendToken?: string;
    refreshToken?: string;
    error?: string;
    backendUser?: {
      id: string;
      email: string;
      name: string | null;
      picture: string | null;
    };
  }
}

// JWT 토큰 타입 확장
declare module "next-auth/jwt" {
  interface JWT {
    backendToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
    backendUser?: {
      id: string;
      email: string;
      name: string | null;
      picture: string | null;
    };
  }
}
