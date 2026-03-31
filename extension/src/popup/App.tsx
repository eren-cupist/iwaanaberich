import React, { useEffect, useState } from "react";
import { TradingStatus } from "./components/TradingStatus";
import { QuickControls } from "./components/QuickControls";
import { ProfitSummary } from "./components/ProfitSummary";
import { SettingsPanel } from "./components/SettingsPanel";
import { AccountInfo } from "./components/AccountInfo";
import { getTokens } from "../lib/storage";
import { queryClient } from "../lib/queryClient";
import { useMe } from "../hooks/queries";

type Tab = "home" | "settings";

export function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("home");

  const { data: meData } = useMe();
  const user = meData ? { name: meData.data.name, email: meData.data.email } : null;

  useEffect(() => {
    getTokens().then((tokens) => {
      setLoggedIn(!!tokens);
      setLoading(false);
    });

    // 매매 발생 시 백그라운드에서 메시지 수신 → 데이터 refetch
    const listener = (message: { type: string }) => {
      if (message.type === "TRADE_EXECUTED") {
        queryClient.invalidateQueries();
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  if (loading) {
    return <div style={styles.loading}>로딩 중...</div>;
  }

  if (!loggedIn) {
    return (
      <div style={styles.container}>
        <Header user={user} />
        <div style={styles.loginMsg}>로그인이 필요합니다. 확장 프로그램을 다시 설치해주세요.</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Header user={user} />
      {/* 탭 네비게이션 */}
      <div style={styles.tabs}>
        <button
          onClick={() => setTab("home")}
          style={{ ...styles.tabBtn, ...(tab === "home" ? styles.tabActive : {}) }}
        >
          매매 현황
        </button>
        <button
          onClick={() => setTab("settings")}
          style={{ ...styles.tabBtn, ...(tab === "settings" ? styles.tabActive : {}) }}
        >
          설정
        </button>
      </div>

      {tab === "home" && (
        <>
          <AccountInfo />
          <TradingStatus />
          <QuickControls />
          <ProfitSummary />
        </>
      )}

      {tab === "settings" && <SettingsPanel />}
    </div>
  );
}

function Header({ user }: { user: { name: string; email: string } | null }) {
  return (
    <div style={styles.header}>
      <h1 style={styles.title}>이와나베리치</h1>
      <span style={styles.userInfo}>
        {user ? user.name || user.email : "AI 자동매매"}
      </span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "14px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "8px",
    borderBottom: "1px solid #1e293b",
  },
  title: { fontSize: "16px", fontWeight: "bold", color: "#f1f5f9" },
  userInfo: { fontSize: "11px", color: "#94a3b8", fontWeight: "500" },
  tabs: {
    display: "flex",
    gap: "4px",
    background: "#1e293b",
    borderRadius: "8px",
    padding: "3px",
  },
  tabBtn: {
    flex: 1,
    padding: "6px",
    background: "transparent",
    color: "#94a3b8",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  tabActive: {
    background: "#334155",
    color: "#f1f5f9",
  },
  loading: { textAlign: "center" as const, padding: "40px", color: "#64748b" },
  loginMsg: { textAlign: "center" as const, padding: "30px", color: "#94a3b8", fontSize: "13px" },
};
