import React, { useEffect, useState } from "react";
import { UpbitKeyForm } from "./components/UpbitKeyForm";
import { TradingConfigForm } from "./components/TradingConfigForm";
import { getTokens } from "../lib/storage";

export function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTokens().then((tokens) => {
      setLoggedIn(!!tokens);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div style={styles.loading}>로딩 중...</div>;
  }

  if (!loggedIn) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>이와나베리치 설정</h1>
        <p style={styles.message}>
          먼저 팝업에서 Google 로그인을 해주세요.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>이와나베리치 설정</h1>
      <UpbitKeyForm />
      <TradingConfigForm />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#f1f5f9",
    paddingBottom: "16px",
    borderBottom: "1px solid #1e293b",
  },
  loading: {
    textAlign: "center" as const,
    padding: "60px",
    color: "#64748b",
    fontSize: "16px",
  },
  message: {
    color: "#94a3b8",
    fontSize: "14px",
  },
};
