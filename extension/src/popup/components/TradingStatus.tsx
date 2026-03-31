import React from "react";
import { useTradingStatus } from "../../hooks/queries";

export function TradingStatus() {
  const { data: status, error, isLoading } = useTradingStatus();

  if (error) {
    return (
      <div style={styles.card}>
        <div style={{ color: "#ef4444", fontSize: "13px" }}>{error.message}</div>
      </div>
    );
  }

  if (isLoading || !status) {
    return (
      <div style={styles.card}>
        <div style={{ color: "#64748b" }}>상태 로딩 중...</div>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.row}>
        <span style={styles.label}>상태</span>
        <span style={{
          ...styles.badge,
          background: status.isActive ? "#166534" : "#991b1b",
          color: status.isActive ? "#4ade80" : "#fca5a5",
        }}>
          {status.isActive ? "자동매매 중" : "정지됨"}
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>대상 마켓</span>
        <span style={styles.value}>
          {status.targetMarkets.length > 0
            ? status.targetMarkets.join(", ")
            : "미설정"}
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>오늘 거래</span>
        <span style={styles.value}>{status.todayTradeCount}건</span>
      </div>

      {status.lastAnalysis && (
        <div style={styles.analysisBox}>
          <div style={styles.analysisHeader}>
            <span style={styles.analysisMarket}>{status.lastAnalysis.market}</span>
            <span style={{
              ...styles.decisionBadge,
              color: status.lastAnalysis.decision === "BUY" ? "#4ade80"
                : status.lastAnalysis.decision === "SELL" ? "#f87171" : "#94a3b8",
            }}>
              {status.lastAnalysis.decision} ({status.lastAnalysis.confidence}%)
            </span>
          </div>
          <div style={styles.analysisReason}>{status.lastAnalysis.reason}</div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "#1e293b",
    borderRadius: "8px",
    padding: "12px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
  },
  label: {
    fontSize: "13px",
    color: "#94a3b8",
  },
  value: {
    fontSize: "13px",
    color: "#e2e8f0",
    fontWeight: "500",
  },
  badge: {
    fontSize: "11px",
    padding: "2px 8px",
    borderRadius: "9999px",
    fontWeight: "600",
  },
  analysisBox: {
    marginTop: "8px",
    padding: "8px",
    background: "#0f172a",
    borderRadius: "6px",
  },
  analysisHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px",
  },
  analysisMarket: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#e2e8f0",
  },
  decisionBadge: {
    fontSize: "12px",
    fontWeight: "bold",
  },
  analysisReason: {
    fontSize: "11px",
    color: "#94a3b8",
    lineHeight: "1.4",
  },
};
