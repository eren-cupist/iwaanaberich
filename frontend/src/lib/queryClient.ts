import { QueryClient } from "@tanstack/react-query";

// React Query 클라이언트 설정
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 1분간 데이터를 신선하게 유지
      staleTime: 60 * 1000,
      // 실패 시 1회 재시도
      retry: 1,
    },
  },
});
