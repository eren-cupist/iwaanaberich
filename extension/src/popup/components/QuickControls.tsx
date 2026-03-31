import React, { useEffect, useState } from "react";

export function QuickControls() {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_STATUS" }, (response) => {
      if (response) setActive(response.active);
    });

    // AI 에러로 인한 자동매매 종료 이벤트 수신
    const listener = (message: { type: string; reason?: string }) => {
      if (message.type === "TRADING_STOPPED_BY_ERROR") {
        setActive(false);
        setErrorMessage(message.reason ?? "알 수 없는 오류로 자동매매가 중지되었습니다.");
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const handleToggle = () => {
    setLoading(true);
    setErrorMessage(null);
    const type = active ? "STOP_TRADING" : "START_TRADING";
    chrome.runtime.sendMessage({ type, intervalMin: 5 }, (response) => {
      if (response?.success) {
        setActive(!active);
      }
      setLoading(false);
    });
  };

  const handleManualAnalysis = () => {
    setLoading(true);
    chrome.runtime.sendMessage({ type: "TRIGGER_ANALYSIS" }, () => {
      setLoading(false);
    });
  };

  return (
    <div>
      {errorMessage && (
        <div style={styles.errorBanner}>
          {errorMessage}
        </div>
      )}
      <div style={styles.container}>
        <button
          onClick={handleToggle}
          disabled={loading}
          style={{
            ...styles.mainBtn,
            background: active ? "#dc2626" : "#16a34a",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "처리 중..." : active ? "자동매매 정지" : "자동매매 시작"}
        </button>

        <button
          onClick={handleManualAnalysis}
          disabled={loading || !active}
          style={{
            ...styles.subBtn,
            opacity: loading || !active ? 0.4 : 1,
          }}
        >
          수동 분석 실행
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  errorBanner: {
    padding: "8px 12px",
    marginBottom: "8px",
    background: "#7f1d1d",
    border: "1px solid #dc2626",
    borderRadius: "8px",
    color: "#fca5a5",
    fontSize: "12px",
    lineHeight: "1.4",
  },
  container: {
    display: "flex",
    gap: "8px",
  },
  mainBtn: {
    flex: 2,
    padding: "10px",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  subBtn: {
    flex: 1,
    padding: "10px",
    background: "#1e293b",
    color: "#94a3b8",
    border: "1px solid #334155",
    borderRadius: "8px",
    fontSize: "12px",
    cursor: "pointer",
  },
};
