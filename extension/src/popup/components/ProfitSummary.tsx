import React from "react";
import { useProfitLossSummary } from "../../hooks/queries";

export function ProfitSummary() {
  const { data: summary } = useProfitLossSummary(7);

  if (!summary) {
    return null;
  }

  const isProfit = summary.netPnl >= 0;

  return (
    <div style={styles.card}>
      <div style={styles.header}>7일 수익 요약</div>
      <div style={styles.grid}>
        <div style={styles.item}>
          <span style={styles.itemLabel}>순수익</span>
          <span style={{
            ...styles.itemValue,
            color: isProfit ? "#4ade80" : "#f87171",
          }}>
            {isProfit ? "+" : ""}{summary.netPnl.toLocaleString()}원
          </span>
        </div>
        <div style={styles.item}>
          <span style={styles.itemLabel}>총 거래</span>
          <span style={styles.itemValue}>{summary.totalTrades}건</span>
        </div>
        <div style={styles.item}>
          <span style={styles.itemLabel}>승률</span>
          <span style={styles.itemValue}>{summary.winRate.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "#1e293b",
    borderRadius: "8px",
    padding: "12px",
  },
  header: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "600",
    marginBottom: "8px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "8px",
  },
  item: {
    textAlign: "center" as const,
  },
  itemLabel: {
    display: "block",
    fontSize: "11px",
    color: "#64748b",
    marginBottom: "2px",
  },
  itemValue: {
    display: "block",
    fontSize: "15px",
    fontWeight: "bold",
    color: "#e2e8f0",
  },
};
