"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { setAxiosToken } from "@/lib/axiosInstance";

// 세션 토큰을 axios에 동기화하는 컴포넌트
function TokenSync({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    setAxiosToken((session?.backendToken as string) || null);
  }, [session?.backendToken]);

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <TokenSync>{children}</TokenSync>
    </SessionProvider>
  );
}
