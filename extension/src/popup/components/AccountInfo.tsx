import React from "react";
import { useUpbitKeysStatus, useUpbitAccounts } from "../../hooks/queries";

export function AccountInfo() {
  const { data: keysStatus, isLoading: keysLoading } = useUpbitKeysStatus();
  const hasKeys = keysStatus?.accessKey && keysStatus?.secretKey;

  const {
    data: accountsRaw,
    isLoading: accountsLoading,
    refetch,
  } = useUpbitAccounts(!!hasKeys);

  const loading = keysLoading || accountsLoading;

  if (loading) {
    return <div style={styles.card}><span style={styles.muted}>계좌 로딩 중...</span></div>;
  }

  if (!hasKeys) {
    return (
      <div style={styles.card}>
        <span style={styles.muted}>설정에서 Upbit API 키를 등록해주세요.</span>
      </div>
    );
  }

  const accounts = (accountsRaw ?? []).filter(
    (a) => parseFloat(a.balance) > 0 || parseFloat(a.locked) > 0,
  );
  const krw = accounts.find((a) => a.currency === "KRW");
  const coins = accounts.filter((a) => a.currency !== "KRW");

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <span style={styles.header}>계좌 정보</span>
        <button onClick={() => refetch()} style={styles.refreshBtn} title="새로고침">
          ↻
        </button>
      </div>

      {accounts.length === 0 && (
        <span style={styles.muted}>보유 자산이 없습니다.</span>
      )}

      {krw && (
        <div style={styles.row}>
          <span style={styles.currency}>KRW</span>
          <span style={styles.balance}>
            {Math.floor(parseFloat(krw.balance)).toLocaleString()}원
          </span>
        </div>
      )}

      {coins.map((coin) => {
        const balance = parseFloat(coin.balance);
        const avgPrice = parseFloat(coin.avg_buy_price);
        const evalAmount = balance * avgPrice;

        return (
          <div key={coin.currency} style={styles.row}>
            <span style={styles.currency}>{coin.currency}</span>
            <div style={styles.coinDetail}>
              <span style={styles.balance}>{balance.toFixed(8)} 개</span>
              <span style={styles.sub}>~{Math.floor(evalAmount).toLocaleString()}원</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { background: "#1e293b", borderRadius: "8px", padding: "12px" },
  headerRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: "8px",
  },
  header: {
    fontSize: "11px", color: "#64748b", fontWeight: "600",
    textTransform: "uppercase" as const, letterSpacing: "0.05em",
  },
  refreshBtn: {
    background: "none", border: "none", color: "#64748b",
    fontSize: "16px", cursor: "pointer", padding: "0 2px",
    lineHeight: "1",
  },
  row: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "4px 0",
  },
  currency: { fontSize: "13px", fontWeight: "600", color: "#e2e8f0" },
  balance: { fontSize: "13px", color: "#f1f5f9", fontWeight: "500" },
  coinDetail: { textAlign: "right" as const },
  sub: { display: "block", fontSize: "10px", color: "#64748b" },
  muted: { fontSize: "12px", color: "#64748b" },
};
