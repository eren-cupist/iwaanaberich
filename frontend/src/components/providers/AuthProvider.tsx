"use client";

import { SessionProvider } from "next-auth/react";

// next-auth 세션 프로바이더 래퍼 컴포넌트
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
