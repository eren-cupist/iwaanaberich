"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { LoginButton } from "@/components/auth/LoginButton";

export default function ExtensionCallbackPage() {
  const { data: session, status } = useSession();
  const [sent, setSent] = useState(false);

  useEffect(() => {
    // 세션이 있고 백엔드 토큰이 발급된 경우 확장 프로그램으로 전달
    if (
      session?.backendToken &&
      session?.refreshToken &&
      !sent
    ) {
      // 부모 창(확장 프로그램 팝업)으로 토큰 전달
      if (window.opener) {
        window.opener.postMessage(
          {
            type: "LOGIN_SUCCESS",
            tokens: {
              accessToken: session.backendToken,
              refreshToken: session.refreshToken,
              accessTokenExpires: Date.now() + 15 * 60 * 1000,
            },
          },
          "*"
        );
        setSent(true);

        // 잠시 후 창 닫기
        setTimeout(() => window.close(), 1500);
      }
    }
  }, [session, sent]);

  if (status === "loading") {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={styles.text}>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>로그인 완료!</h2>
          <p style={styles.text}>
            이 창은 잠시 후 자동으로 닫힙니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>이와나베리치</h2>
        <p style={styles.text}>
          크롬 확장 프로그램 연동을 위해 로그인해주세요.
        </p>
        <LoginButton />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "#0f172a",
  },
  card: {
    background: "#1e293b",
    borderRadius: "16px",
    padding: "40px",
    textAlign: "center" as const,
    maxWidth: "400px",
    width: "100%",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#f1f5f9",
    marginBottom: "16px",
  },
  text: {
    fontSize: "14px",
    color: "#94a3b8",
    marginBottom: "24px",
    lineHeight: "1.6",
  },
};
