import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// refreshToken으로 새 accessToken을 발급받는 함수
async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
} | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }
    );
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ account }) {
      // Google OAuth 콜백에서 id_token을 백엔드로 전달
      if (account?.provider === "google" && account.id_token) {
        // id_token은 jwt callback에서 처리
        return true;
      }
      return false;
    },
    async jwt({ token, account }) {
      // 최초 로그인: Google id_token을 백엔드로 전달하여 토큰 발급
      if (account?.provider === "google" && account.id_token) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/google`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken: account.id_token }),
            }
          );
          if (response.ok) {
            const data = await response.json();
            token.backendToken = data.accessToken;
            token.refreshToken = data.refreshToken;
            token.accessTokenExpires = data.accessTokenExpires;
            token.backendUser = data.user;
            token.error = undefined;
          }
        } catch {
          // 백엔드 연결 실패 시 로그인 진행 (개발 환경 대비)
        }
        return token;
      }

      // accessToken이 아직 유효하면 그대로 반환
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }

      // accessToken 만료: refreshToken으로 갱신 시도
      if (!token.refreshToken) {
        return { ...token, error: "RefreshTokenError" };
      }

      const refreshed = await refreshAccessToken(token.refreshToken);
      if (!refreshed) {
        // 갱신 실패 시 에러 반환
        return { ...token, error: "RefreshTokenError" };
      }

      return {
        ...token,
        backendToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        accessTokenExpires: refreshed.accessTokenExpires,
        error: undefined,
      };
    },
    async session({ session, token }) {
      // session에 backendToken 및 refreshToken 추가
      if (token.backendToken) {
        session.backendToken = token.backendToken;
      }
      if (token.refreshToken) {
        session.refreshToken = token.refreshToken;
      }
      if (token.backendUser) {
        session.backendUser = token.backendUser;
      }
      if (token.error) {
        session.error = token.error;
      }
      return session;
    },
  },
});
