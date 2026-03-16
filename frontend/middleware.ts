export { auth as middleware } from "./auth";

// 미들웨어 적용 경로 설정 - 대시보드 하위 경로 보호
export const config = {
  matcher: ["/dashboard/:path*"],
};
