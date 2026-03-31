import React from "react";

interface Props {
  onLoginSuccess: () => void;
}

export function LoginPrompt({ onLoginSuccess }: Props) {
  const handleLogin = () => {
    // 로그인 페이지를 새 창으로 열기
    window.open(
      "http://localhost:3001/extension-callback",
      "login",
      "width=500,height=600",
    );

    // 로그인 완료 메시지 수신
    const listener = (event: MessageEvent) => {
      if (event.data?.type === "LOGIN_SUCCESS" && event.data?.tokens) {
        chrome.storage.local.set({ auth_tokens: event.data.tokens }, () => {
          onLoginSuccess();
        });
        window.removeEventListener("message", listener);
      }
    };
    window.addEventListener("message", listener);
  };

  return (
    <div style={styles.container}>
      <p style={styles.text}>
        자동매매를 시작하려면 Google 계정으로 로그인하세요.
      </p>
      <button onClick={handleLogin} style={styles.loginBtn}>
        Google 로그인
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    textAlign: "center" as const,
    padding: "40px 20px",
  },
  text: {
    fontSize: "14px",
    color: "#94a3b8",
    marginBottom: "20px",
    lineHeight: "1.5",
  },
  loginBtn: {
    padding: "12px 24px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
