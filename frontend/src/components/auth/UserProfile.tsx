"use client";

import { useSession, signOut } from "next-auth/react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// 로그인한 유저의 프로필 정보를 표시하는 컴포넌트
export function UserProfile() {
  const { data: session } = useSession();
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) return <div className="text-gray-500">로딩 중...</div>;

  return (
    <div className="flex items-center gap-4">
      {/* 프로필 이미지 - 백엔드 유저 데이터 우선, 없으면 세션 데이터 사용 */}
      {(user?.picture || session?.user?.image) && (
        <img
          src={user?.picture || session?.user?.image || ""}
          alt={user?.name || session?.user?.name || "프로필"}
          className="w-10 h-10 rounded-full"
        />
      )}
      <div>
        <p className="font-medium">{user?.name || session?.user?.name}</p>
        <p className="text-sm text-gray-500">
          {user?.email || session?.user?.email}
        </p>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="ml-4 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        로그아웃
      </button>
    </div>
  );
}
