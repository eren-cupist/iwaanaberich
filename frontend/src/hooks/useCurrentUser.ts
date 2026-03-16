"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import apiClient from "@/lib/api";
import { User } from "@/types/user";

// 현재 로그인한 유저 정보를 백엔드에서 가져오는 훅
export function useCurrentUser() {
  const { data: session } = useSession();
  // Session 타입 확장 (src/types/next-auth.d.ts)으로 타입 안전하게 접근
  const backendToken = session?.backendToken;

  return useQuery<User>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const response = await apiClient.get<User>("/users/me");
      return response.data;
    },
    // backendToken이 있을 때만 요청 실행
    enabled: !!backendToken,
  });
}
