import { auth } from "../../auth";
import { redirect } from "next/navigation";
import { LoginButton } from "@/components/auth/LoginButton";

// 메인 페이지 - 서버 컴포넌트
export default async function HomePage() {
  const session = await auth();

  // 이미 로그인된 경우 대시보드로 리다이렉트
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">이와나베리치</h1>
          <p className="mt-2 text-lg text-gray-600">
            Google 계정으로 로그인하세요
          </p>
        </div>
        <LoginButton />
      </div>
    </main>
  );
}
