"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserProfile } from "@/components/auth/UserProfile";

// 대시보드 페이지 - 로그인한 유저만 접근 가능
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // 로그인하지 않은 경우 메인 페이지로 리다이렉트
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  // 세션 로딩 중 표시
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  // 인증되지 않은 경우 아무것도 표시하지 않음 (리다이렉트 처리 중)
  if (!session) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 헤더 영역 */}
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">이와나베리치</h1>
          <UserProfile />
        </header>

        {/* 환영 메시지 */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800">
            환영합니다, {session.user?.name || "사용자"}님!
          </h2>
          <p className="mt-2 text-gray-600">
            대시보드에 성공적으로 로그인하셨습니다.
          </p>
        </section>
      </div>
    </main>
  );
}
